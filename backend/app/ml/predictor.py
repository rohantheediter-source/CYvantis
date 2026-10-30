"""
Inference for the severity classifier and anomaly detector.

Models are loaded lazily and re-loaded when the artifact file changes. Artifacts trained by
an older/incompatible pipeline (missing version/feature metadata) are rejected. When models
are unavailable, `model_status` is "UNAVAILABLE" and no prediction is fabricated.
"""
import logging
import os
import threading

import joblib
import numpy as np
import pandas as pd

from app.ml.features import FEATURE_COLUMNS, featurize

logger = logging.getLogger("cyvantis.ml")

SAVED_MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "saved_models"))
clf_path = os.path.join(SAVED_MODELS_DIR, "severity_classifier.joblib")
iso_path = os.path.join(SAVED_MODELS_DIR, "anomaly_detector.joblib")

_lock = threading.Lock()
_cache = {"mtime": None, "clf": None, "iso": None, "version": None, "error": None}


def reset_cache():
    with _lock:
        _cache.update(mtime=None, clf=None, iso=None, version=None, error=None)


def _load(path):
    obj = joblib.load(path)
    if not isinstance(obj, dict) or "model" not in obj or obj.get("features") != FEATURE_COLUMNS:
        raise ValueError("incompatible model artifact (retrain with `python -m app.ml.trainer`)")
    return obj


def load_ml_models():
    with _lock:
        try:
            mtime = (os.path.getmtime(clf_path), os.path.getmtime(iso_path))
        except OSError:
            _cache.update(mtime=None, clf=None, iso=None, version=None, error="model files not found")
            return
        if mtime == _cache["mtime"]:
            return
        try:
            c, i = _load(clf_path), _load(iso_path)
            _cache.update(mtime=mtime, clf=c["model"], iso=i["model"], version=c.get("version"), error=None)
        except Exception as exc:
            logger.warning("Failed to load ML models: %s", exc)
            _cache.update(mtime=mtime, clf=None, iso=None, version=None, error=str(exc)[:200])


def _explain(row: dict, clf) -> list:
    """Active (non-zero) features ranked by the model's global importance."""
    imp = dict(zip(FEATURE_COLUMNS, getattr(clf, "feature_importances_", [0] * len(FEATURE_COLUMNS))))
    active = [(f, row[f], imp.get(f, 0.0)) for f in FEATURE_COLUMNS if row.get(f)]
    active.sort(key=lambda t: -t[2])
    return [{"feature": f, "value": v, "global_importance": round(float(w), 4)} for f, v, w in active[:5]]


def predict_single_event(event_payload: dict) -> dict:
    load_ml_models()
    clf, iso = _cache["clf"], _cache["iso"]
    if clf is None or iso is None:
        return {
            "model_status": "UNAVAILABLE",
            "reason": _cache["error"] or "models not trained",
            "predicted_severity": None,
            "confidence": None,
            "class_probabilities": {},
            "is_anomalous": None,
            "anomaly_score": None,
            "risk_verdict": "No ML assessment available - train models first. Rule-based detection is unaffected.",
        }
    row = featurize(event_payload or {})
    df = pd.DataFrame([row])[FEATURE_COLUMNS]
    probs = clf.predict_proba(df)[0]
    classes = list(clf.classes_)
    pred = classes[int(np.argmax(probs))]
    anomaly = bool(iso.predict(df)[0] == -1)
    score = float(iso.score_samples(df)[0])
    return {
        "model_status": "TRAINED",
        "model_version": _cache["version"],
        "predicted_severity": pred,
        "confidence": round(float(np.max(probs)), 4),
        "class_probabilities": {c: round(float(p), 4) for c, p in zip(classes, probs)},
        "is_anomalous": anomaly,
        "anomaly_score": round(score, 4),
        "explanation": _explain(row, clf),
        "risk_verdict": f"ML suggests {pred.upper()} severity{' and flags the event as anomalous' if anomaly else ''}. "
                        "Supporting signal only - not a confirmed attack.",
    }
