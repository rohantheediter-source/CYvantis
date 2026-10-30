"""
Event -> alert -> incident pipeline.

  1. validate/normalize (done by sources / ingest API -> NormalizedEvent)
  2. deduplicate by event_uid (idempotent ingestion)
  3. enrich (offline GeoIP label + cached threat intel; no network I/O here)
  4. run enabled detection rules (+ attach ML assessment as supporting context)
  5. deduplicate alerts (same rule + entity inside the dedup window -> occurrence_count++)
  6. correlate alerts into incidents (same source IP inside the correlation window, or a
     shared indicator such as a payload hash/URL across different source IPs)
  7. compute explainable risk for alert and incident; build advisory recommendations
  8. persist (single transaction per batch, together with ingestion checkpoints)
  9. return WebSocket messages for the caller to broadcast

Synchronous by design: callers run it in a worker thread (asyncio.to_thread).
"""
import datetime
import logging
from dataclasses import dataclass, field
from typing import Dict, List, Optional

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import settings
from app.detection.engine import Detection, run_detections
from app.detection.recommendations import build_recommendations
from app.detection.risk import RiskInput, compute_risk
from app.geoip_service import enrich_ip
from app.ingestion.schema import NormalizedEvent
from app.intel.service import cached_reputation
from app.models import Alert, Asset, DetectionRule, HoneypotEvent, Incident, Vulnerability
from app.serializers import alert_to_dict, event_to_dict, incident_to_dict

logger = logging.getLogger("cyvantis.pipeline")

ALERT_DEDUP_WINDOW = datetime.timedelta(hours=1)
CORRELATION_WINDOW = datetime.timedelta(hours=2)
MAX_EVIDENCE_IDS = 100
OPEN_STATUSES = ("open", "investigating")
ALERT_OPEN_STATUSES = ("active", "acknowledged", "investigating")


@dataclass
class PipelineResult:
    stored: int = 0
    duplicates: int = 0
    failed: int = 0
    alerts_created: int = 0
    alerts_updated: int = 0
    incidents_touched: int = 0
    messages: List[dict] = field(default_factory=list)
    event_ids: List[int] = field(default_factory=list)


def _ml_assessment(ev: HoneypotEvent) -> Optional[dict]:
    """Supporting ML context only - never creates or confirms an alert on its own."""
    try:
        from app.ml.predictor import predict_single_event
        res = predict_single_event(event_to_dict(ev, include_secrets=True))
        if res.get("model_status") != "TRAINED":
            return None
        return {k: res.get(k) for k in ("predicted_severity", "confidence", "is_anomalous", "anomaly_score", "model_version")}
    except Exception:
        logger.debug("ML assessment unavailable", exc_info=True)
        return None


def _store_event(db: Session, ne: NormalizedEvent) -> Optional[HoneypotEvent]:
    uid = ne.compute_uid()
    if db.query(HoneypotEvent.id).filter(HoneypotEvent.event_uid == uid).first():
        return None
    geo = enrich_ip(ne.src_ip)
    row = HoneypotEvent(
        event_uid=uid, eventid=ne.eventid, timestamp=ne.timestamp, src_ip=ne.src_ip, dst_ip=ne.dst_ip,
        dst_port=ne.dst_port, protocol=ne.protocol, username=ne.username, password=ne.password,
        command=ne.command, file_hash=ne.file_hash, session_id=ne.session_id, duration=ne.duration or 0.0,
        country=geo["country"], country_code=geo["country_code"], city=geo["city"], asn=geo["asn"],
        severity=ne.severity, is_simulated=ne.data_origin == "simulated", raw_payload=ne.redacted_raw_json(),
        source=ne.source, data_origin=ne.data_origin, category=ne.category, sensor=ne.sensor,
        ingested_at=datetime.datetime.utcnow(), source_ref=ne.source_ref,
    )
    sp = db.begin_nested()
    try:
        db.add(row)
        db.flush()
        sp.commit()
    except IntegrityError:
        sp.rollback()
        return None  # concurrent duplicate
    return row


def _upsert_alert(db: Session, det: Detection, ev: HoneypotEvent, ml: Optional[dict]) -> (Alert, bool):
    cutoff = ev.timestamp - ALERT_DEDUP_WINDOW
    alert = db.query(Alert).filter(Alert.dedup_key == det.dedup_key, Alert.status.in_(ALERT_OPEN_STATUSES),
                                   Alert.last_seen >= cutoff).order_by(Alert.last_seen.desc()).first()
    facts = dict(det.facts)
    if ml:
        rule_says_high = det.severity in ("high", "critical")
        facts["ml_assessment"] = dict(ml, agrees_with_rule=(ml.get("predicted_severity") in ("high", "critical")) == rule_says_high)
    created = alert is None
    if created:
        alert = Alert(timestamp=ev.timestamp, title=det.title[:200], rule_name=det.rule_name[:100], rule_id=det.rule_id,
                      src_ip=None if det.entity == "global" else det.entity, status="active", dedup_key=det.dedup_key,
                      occurrence_count=1, first_seen=ev.timestamp, last_seen=ev.timestamp,
                      evidence={"event_ids": [], "facts": {}, "indicators": [], "cves": [], "tactic": det.tactic})
        db.add(alert)
    else:
        alert.occurrence_count = (alert.occurrence_count or 1) + 1
        alert.last_seen = max(alert.last_seen or ev.timestamp, ev.timestamp)
    sev_rank = {"low": 0, "medium": 1, "high": 2, "critical": 3}
    if created or sev_rank.get(det.severity, 0) > sev_rank.get(alert.severity, 0):
        alert.severity = det.severity
    alert.confidence = max(alert.confidence or 0, det.confidence)
    alert.description = det.explanation
    old = alert.evidence or {}
    ids = list(dict.fromkeys(list(det.event_ids) + list(old.get("event_ids", []))))[:MAX_EVIDENCE_IDS]
    alert.evidence = {
        "event_ids": ids,
        "facts": facts,
        "indicators": sorted(set(old.get("indicators", [])) | set(det.indicators))[:50],
        "cves": sorted(set(old.get("cves", [])) | set(det.cves))[:20],
        "tactic": det.tactic,
    }
    alert.data_origin = ev.data_origin or "real"
    rule = db.get(DetectionRule, det.rule_id)
    if rule:
        rule.last_triggered = ev.timestamp
        rule.trigger_count = (rule.trigger_count or 0) + (1 if created else 0)
    db.flush()
    return alert, created


def _find_incident(db: Session, alert: Alert, det: Detection, now: datetime.datetime) -> Optional[Incident]:
    key = "global:volume" if det.entity == "global" else f"src_ip:{det.entity}"
    inc = db.query(Incident).filter(Incident.correlation_key == key, Incident.status.in_(OPEN_STATUSES),
                                    Incident.last_seen >= now - CORRELATION_WINDOW).order_by(Incident.last_seen.desc()).first()
    if inc or not det.indicators:
        return inc
    # Cross-IP correlation through a shared indicator (e.g. same payload hash / download URL)
    recent = db.query(Incident).filter(Incident.status.in_(OPEN_STATUSES),
                                       Incident.last_seen >= now - datetime.timedelta(hours=24)).limit(200).all()
    wanted = set(det.indicators)
    for cand in recent:
        if wanted & set(cand.indicators or []):
            return cand
    return None


def _assets_for(db: Session, dst_ips) -> List[Asset]:
    ips = [i for i in dst_ips if i]
    return db.query(Asset).filter(Asset.ip_address.in_(ips)).all() if ips else []


def _risk_for_alerts(db: Session, alerts: List[Alert], status: str, now) -> Dict:
    event_ids = []
    rule_conf: Dict[str, float] = {}
    indicators, cves, src_ips = set(), set(), set()
    occurrences = 0
    last_seen = None
    for a in alerts:
        ev = a.evidence or {}
        event_ids.extend(ev.get("event_ids", []))
        rule_conf[a.rule_name] = max(rule_conf.get(a.rule_name, 0), a.confidence or 0.5)
        indicators |= set(ev.get("indicators", []))
        cves |= set(ev.get("cves", []))
        if a.src_ip:
            src_ips.add(a.src_ip)
        occurrences += a.occurrence_count or 1
        if a.last_seen and (last_seen is None or a.last_seen > last_seen):
            last_seen = a.last_seen
    event_ids = list(dict.fromkeys(event_ids))[:500]
    rows = db.query(HoneypotEvent.session_id, HoneypotEvent.dst_ip).filter(HoneypotEvent.id.in_(event_ids)).all() if event_ids else []
    sessions = {s for s, _ in rows if s}
    assets = _assets_for(db, {d for _, d in rows})
    intel_scores = [cached_reputation(db, v)["score"] for v in list(src_ips) + list(indicators)]
    intel_scores = [s for s in intel_scores if s is not None]
    asset_cves = {c for a in assets for c in (a.cves or [])}
    cvss = [v.cvss_score for v in db.query(Vulnerability).filter(Vulnerability.cve_id.in_(list(cves | asset_cves))).all()
            if v.cvss_score is not None] if (cves or asset_cves) else []
    exposure_rank = {"internet": 3, "internal": 2, "isolated": 1}
    inp = RiskInput(
        severities=[a.severity for a in alerts],
        rule_confidences=rule_conf,
        intel_score=max(intel_scores) if intel_scores else None,
        asset_criticality=max((a.criticality for a in assets if a.criticality), default=None),
        cvss_max=max(cvss) if cvss else None,
        exposure=max((a.exposure for a in assets if a.exposure), key=lambda e: exposure_rank.get(e, 0), default=None),
        distinct_sessions=len(sessions),
        occurrences=occurrences,
        last_seen=last_seen,
        status=status,
        now=now,
    )
    risk = compute_risk(inp)
    return {"risk": risk, "event_ids": event_ids, "sessions": sorted(sessions), "indicators": sorted(indicators),
            "cves": sorted(cves), "src_ips": sorted(src_ips), "intel_score": inp.intel_score}


def _rule_type_map(db: Session, alerts: List[Alert]) -> Dict[str, dict]:
    out = {}
    for a in alerts:
        rule = db.get(DetectionRule, a.rule_id) if a.rule_id else None
        rt = rule.rule_type if rule else a.rule_name
        cur = out.setdefault(rt, {"confidence": 0.0, "event_ids": [], "facts": {}})
        cur["confidence"] = max(cur["confidence"], a.confidence or 0.5)
        cur["event_ids"] = list(dict.fromkeys(cur["event_ids"] + (a.evidence or {}).get("event_ids", [])))[:20]
        cur["facts"] = {k: v for k, v in ((a.evidence or {}).get("facts") or {}).items() if k != "ml_assessment"}
    return out


def refresh_alert_risk(db: Session, alert: Alert, now=None):
    now = now or datetime.datetime.utcnow()
    status = "resolved" if alert.status in ("resolved", "false_positive") else "open"
    if alert.status == "false_positive":
        status = "false_positive"
    r = _risk_for_alerts(db, [alert], status, now)
    alert.risk_score = r["risk"]["residual_score"]
    alert.priority = r["risk"]["priority"]
    alert.risk_breakdown = r["risk"]
    alert.explanation = r["risk"]["explanation"]
    alert.recommendations = build_recommendations(_rule_type_map(db, [alert]), r["src_ips"], r["indicators"], r["cves"],
                                                  r["intel_score"], r["risk"]["priority"], alert.data_origin or "real")


def refresh_incident(db: Session, inc: Incident, now=None):
    now = now or datetime.datetime.utcnow()
    alerts = db.query(Alert).filter(Alert.incident_id == inc.id).all()
    if not alerts:
        return
    r = _risk_for_alerts(db, alerts, inc.status if inc.status in ("resolved", "false_positive") else "open", now)
    risk = r["risk"]
    inc.risk_score = risk["residual_score"]
    inc.priority = risk["priority"]
    inc.risk_breakdown = risk
    inc.alert_count = len(alerts)
    inc.event_count = len(r["event_ids"])
    inc.src_ips = sorted(set(inc.src_ips or []) | set(r["src_ips"]))[:50]
    inc.session_ids = r["sessions"][:100]
    inc.indicators = r["indicators"][:100]
    inc.tactics = sorted({(a.evidence or {}).get("tactic") for a in alerts if (a.evidence or {}).get("tactic")})
    inc.first_seen = min((a.first_seen or a.timestamp) for a in alerts)
    inc.last_seen = max((a.last_seen or a.timestamp) for a in alerts)
    inc.data_origin = "real" if any((a.data_origin or "real") == "real" for a in alerts) else alerts[0].data_origin
    rules = sorted({a.rule_name for a in alerts})
    inc.explanation = (f"{len(alerts)} correlated alert(s) from {len(rules)} rule(s) ({', '.join(rules[:5])}) "
                       f"covering {inc.event_count} event(s). " + risk["explanation"])
    inc.recommendations = build_recommendations(_rule_type_map(db, alerts), inc.src_ips or [], r["indicators"], r["cves"],
                                                r["intel_score"], risk["priority"], inc.data_origin)
    who = ", ".join((inc.src_ips or [])[:2]) or "multiple sources"
    inc.title = f"{risk['priority'].capitalize()}-risk activity from {who}"[:200]


def process_events(db: Session, events: List[NormalizedEvent], now: Optional[datetime.datetime] = None) -> PipelineResult:
    """Processes a batch. Caller commits (so ingestion checkpoints commit atomically with events)."""
    res = PipelineResult()
    rules = db.query(DetectionRule).filter(DetectionRule.is_enabled.is_(True)).all()
    touched_incidents: Dict[int, Incident] = {}
    touched_alerts: Dict[int, Alert] = {}
    for ne in events:
        try:
            row = _store_event(db, ne)
            if row is None:
                res.duplicates += 1
                continue
            res.stored += 1
            res.event_ids.append(row.id)
            res.messages.append({"type": "event", "data": event_to_dict(row, include_secrets=True)})
            dets = run_detections(db, row, rules)
            if not dets:
                continue
            ml = _ml_assessment(row)
            ref_now = now or max(datetime.datetime.utcnow(), row.timestamp)
            for det in dets:
                alert, created = _upsert_alert(db, det, row, ml)
                res.alerts_created += int(created)
                res.alerts_updated += int(not created)
                if alert.incident_id is None:
                    inc = _find_incident(db, alert, det, row.timestamp)
                    if inc is None:
                        inc = Incident(title="New incident", correlation_key="global:volume" if det.entity == "global"
                                       else f"src_ip:{det.entity}", status="open", first_seen=row.timestamp,
                                       last_seen=row.timestamp, src_ips=[] if det.entity == "global" else [det.entity])
                        db.add(inc)
                        db.flush()
                    alert.incident_id = inc.id
                    db.flush()
                touched_alerts[alert.id] = alert
                inc = db.get(Incident, alert.incident_id)
                touched_incidents[inc.id] = inc
        except Exception:
            res.failed += 1
            logger.exception("Pipeline failed for event from source %s", ne.source)
    ref_now = now or datetime.datetime.utcnow()
    for alert in touched_alerts.values():
        refresh_alert_risk(db, alert, ref_now)
    for inc in touched_incidents.values():
        refresh_incident(db, inc, ref_now)
    db.flush()
    for alert in touched_alerts.values():
        res.messages.append({"type": "alert", "data": alert_to_dict(alert)})
    for inc in touched_incidents.values():
        res.messages.append({"type": "incident", "data": incident_to_dict(inc)})
    res.incidents_touched = len(touched_incidents)
    return res
