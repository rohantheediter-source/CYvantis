import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def get_admin_token():
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin", "password": "Admin@Cyvantis2026!"}
    )
    assert response.status_code == 200
    return response.json()["access_token"]

def test_security_audit_summary():
    token = get_admin_token()
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/v1/security-audit/summary", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "secure_headers" in data
    assert "cors_policy" in data
    assert "access_control" in data
    assert "sensitive_files" in data
    assert "sast_analysis" in data
    assert data["overall_security_grade"] == "A+"

def test_security_audit_run_scan():
    token = get_admin_token()
    headers = {"Authorization": f"Bearer {token}"}
    response = client.post("/api/v1/security-audit/run-scan", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "COMPLETED"
    assert "PASS" in data["compliance"]
