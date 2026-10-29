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

def test_get_cve_radar_feed():
    token = get_admin_token()
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/v1/advisories/cve-radar", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "total_advisories" in data
    assert "critical_count" in data
    assert "cisa_kev_count" in data
    assert "advisories" in data
    assert len(data["advisories"]) > 0

def test_get_cve_radar_feed_filtered():
    token = get_admin_token()
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/v1/advisories/cve-radar?severity=CRITICAL&cisa_kev_only=true", headers=headers)
    assert response.status_code == 200
    data = response.json()
    for adv in data["advisories"]:
        assert adv["severity"] == "CRITICAL"
        assert adv["cisa_kev"] is True

def test_get_cve_radar_feed_search():
    token = get_admin_token()
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/v1/advisories/cve-radar?q=OpenSSL", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data["advisories"]) >= 1
    assert "OpenSSL" in data["advisories"][0]["vendor"] or "OpenSSL" in data["advisories"][0]["title"]
