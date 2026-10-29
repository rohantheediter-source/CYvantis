def test_trigger_backup(client):
    login_res = client.post("/api/v1/auth/login", data={"username": "admin", "password": "Admin@Cyvantis2026!"})
    token = login_res.json()["access_token"]
    
    res = client.post("/api/v1/storage/backups", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "cyvantis_backup" in data["filename"]

def test_storage_status(client):
    login_res = client.post("/api/v1/auth/login", data={"username": "admin", "password": "Admin@Cyvantis2026!"})
    token = login_res.json()["access_token"]

    res = client.get("/api/v1/storage/status", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert "db_size_mb" in res.json()
