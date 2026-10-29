import os
import joblib
import pandas as pd
import numpy as np

SAVED_MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "saved_models"))

clf_path = os.path.join(SAVED_MODELS_DIR, "severity_classifier.joblib")
iso_path = os.path.join(SAVED_MODELS_DIR, "anomaly_detector.joblib")

_classifier = None
_anomaly_detector = None

def load_ml_models():
    global _classifier, _anomaly_detector
    if os.path.exists(clf_path):
        try:
            _classifier = joblib.load(clf_path)
        except Exception:
            _classifier = None

    if os.path.exists(iso_path):
        try:
            _anomaly_detector = joblib.load(iso_path)
        except Exception:
            _anomaly_detector = None

FEATURE_COLUMNS = [
    "duration", "dst_port", "protocol_ssh", "protocol_telnet",
    "cmd_len", "user_len", "pass_len", "is_root_user",
    "has_wget_curl", "has_execution", "has_recon", "has_base64",
    "event_login_success", "event_login_failed", "event_cmd_input"
]

def predict_single_event(event_payload: dict):
    """
    Predicts threat severity, class probabilities, and anomaly status for a raw or existing Honeypot event payload.
    """
    load_ml_models()

    cmd = event_payload.get("command") or ""
    user = event_payload.get("username") or ""
    pwd = event_payload.get("password") or ""
    event_id = event_payload.get("eventid") or ""
    proto = (event_payload.get("protocol") or "SSH").upper()

    row = {
        "duration": float(event_payload.get("duration") or 0.0),
        "dst_port": int(event_payload.get("dst_port") or 22),
        "protocol_ssh": 1 if proto == "SSH" else 0,
        "protocol_telnet": 1 if proto == "TELNET" else 0,
        "cmd_len": len(cmd),
        "user_len": len(user),
        "pass_len": len(pwd),
        "is_root_user": 1 if user.lower() in ["root", "admin", "administrator", "system"] else 0,
        "has_wget_curl": 1 if any(kw in cmd.lower() for kw in ["wget", "curl", "tftp", "ftp"]) else 0,
        "has_execution": 1 if any(kw in cmd.lower() for kw in ["chmod", ".sh", "bash", "python", "perl", "nc", "ncat"]) else 0,
        "has_recon": 1 if any(kw in cmd.lower() for kw in ["uname", "whoami", "id", "cat /etc", "lscpu", "uptime", "ps aux"]) else 0,
        "has_base64": 1 if any(kw in cmd.lower() for kw in ["base64", "eval", "exec", "sh -c"]) else 0,
        "event_login_success": 1 if "success" in event_id.lower() else 0,
        "event_login_failed": 1 if "failed" in event_id.lower() else 0,
        "event_cmd_input": 1 if "command" in event_id.lower() else 0
    }

    df_sample = pd.DataFrame([row])[FEATURE_COLUMNS]

    if _classifier is not None and _anomaly_detector is not None:
        predicted_severity = _classifier.predict(df_sample)[0]
        probs = _classifier.predict_proba(df_sample)[0]
        classes = _classifier.classes_

        class_probs = {cls: round(float(prob), 4) for cls, prob in zip(classes, probs)}
        confidence = round(float(np.max(probs)), 4)

        anomaly_pred = _anomaly_detector.predict(df_sample)[0] # -1 for anomaly, 1 for normal
        raw_anomaly_score = float(_anomaly_detector.score_samples(df_sample)[0])

        return {
            "model_status": "TRAINED",
            "predicted_severity": predicted_severity,
            "confidence": confidence,
            "class_probabilities": class_probs,
            "is_anomalous": bool(anomaly_pred == -1),
            "anomaly_score": round(raw_anomaly_score, 4),
            "risk_verdict": f"ML Predicted {predicted_severity.upper()} Severity {'(ANOMALOUS)' if anomaly_pred == -1 else ''}"
        }
    else:
        # Heuristic Rule Fallback
        sev = "low"
        if row["has_wget_curl"] or row["has_execution"]:
            sev = "critical"
        elif row["has_recon"] or row["is_root_user"]:
            sev = "high"
        elif row["event_login_failed"]:
            sev = "medium"

        return {
            "model_status": "HEURISTIC_FALLBACK (Model Untrained)",
            "predicted_severity": sev,
            "confidence": 0.75,
            "class_probabilities": {sev: 0.75},
            "is_anomalous": False,
            "anomaly_score": 0.0,
            "risk_verdict": f"Heuristic Rule Evaluated {sev.upper()} Severity"
        }
