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

def test_ip_analyzer_lookup():
    token = get_admin_token()
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/v1/tools/ip-analyzer/185.220.101.5", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["target_ip"] == "185.220.101.5"
    assert "country" in data
    assert "flag_emoji" in data
    assert "asn" in data
    assert "abuse_threat_score" in data
    assert "threat_rating_badge" in data

def test_subnet_calculator():
    token = get_admin_token()
    headers = {"Authorization": f"Bearer {token}"}
    response = client.post(
        "/api/v1/tools/subnet-calculator",
        json={"cidr": "192.168.1.0/24"},
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["network_address"] == "192.168.1.0"
    assert data["broadcast_address"] == "192.168.1.255"
    assert data["netmask"] == "255.255.255.0"
    assert data["usable_hosts"] == 254
    assert data["first_usable_ip"] == "192.168.1.1"
    assert data["last_usable_ip"] == "192.168.1.254"

def test_password_analyzer():
    token = get_admin_token()
    headers = {"Authorization": f"Bearer {token}"}
    response = client.post(
        "/api/v1/tools/password-analyzer",
        json={"password": "Cyvantis@2026!SecurePass"},
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["password_length"] == len("Cyvantis@2026!SecurePass")
    assert data["entropy_bits"] > 70
    assert "STRONG" in data["rating"]
    assert "character_breakdown" in data

def test_log_extractor():
    token = get_admin_token()
    headers = {"Authorization": f"Bearer {token}"}
    response = client.post(
        "/api/v1/tools/log-extractor",
        json={"text": "Failed login from 185.220.101.5 and 193.142.146.210 with hash e3b0c44298fc1c149afbf4c8996fb924"},
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total_ips"] == 2
    assert "185.220.101.5" in data["extracted_ips"]
    assert data["total_hashes"] == 1

def test_header_auditor():
    token = get_admin_token()
    headers = {"Authorization": f"Bearer {token}"}
    response = client.post(
        "/api/v1/tools/header-auditor",
        json={"url": "http://localhost:8000"},
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert "grade" in data
    assert "header_checks" in data

def test_hash_generator():
    token = get_admin_token()
    headers = {"Authorization": f"Bearer {token}"}
    response = client.post(
        "/api/v1/tools/hash-generator",
        json={"text": "CYVANTIS Test Payload"},
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert "md5" in data
    assert "sha256" in data
    assert len(data["md5"]) == 32
    assert len(data["sha256"]) == 64
