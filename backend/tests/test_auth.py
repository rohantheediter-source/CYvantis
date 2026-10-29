def test_login_success(client):
    response = client.post("/api/v1/auth/login", data={"username": "admin", "password": "Admin@Cyvantis2026!"})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["role"] == "admin"

def test_login_failure(client):
    response = client.post("/api/v1/auth/login", data={"username": "admin", "password": "WrongPassword!"})
    assert response.status_code == 401

def test_get_me(client):
    login_res = client.post("/api/v1/auth/login", data={"username": "analyst", "password": "Analyst@Cyvantis2026!"})
    token = login_res.json()["access_token"]
    
    res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["username"] == "analyst"
    assert res.json()["role"] == "analyst"

def test_first_login_password_change(client):
    login_res = client.post("/api/v1/auth/login", data={"username": "viewer", "password": "Viewer@Cyvantis2026!"})
    token = login_res.json()["access_token"]
    
    # Attempt with wrong current password -> 400
    fail_res = client.post(
        "/api/v1/auth/change-password-first-login",
        headers={"Authorization": f"Bearer {token}"},
        json={"current_password": "WrongPassword!", "new_password": "NewSecurePass2026!"}
    )
    assert fail_res.status_code == 400

    # Successful password change
    success_res = client.post(
        "/api/v1/auth/change-password-first-login",
        headers={"Authorization": f"Bearer {token}"},
        json={"current_password": "Viewer@Cyvantis2026!", "new_password": "NewSecureViewerPass2026!"}
    )
    assert success_res.status_code == 200
    assert success_res.json()["must_change_password"] is False

def test_2fa_setup_and_enable(client):
    import pyotp
    login_res = client.post("/api/v1/auth/login", data={"username": "analyst", "password": "Analyst@Cyvantis2026!"})
    token = login_res.json()["access_token"]
    
    # 1. Setup 2FA
    setup_res = client.post("/api/v1/auth/2fa/setup", headers={"Authorization": f"Bearer {token}"})
    assert setup_res.status_code == 200
    data = setup_res.json()
    assert "secret" in data
    assert "qr_code_url" in data

    # 2. Enable 2FA using valid TOTP code
    totp = pyotp.TOTP(data["secret"])
    code = totp.now()
    
    enable_res = client.post(
        "/api/v1/auth/2fa/enable",
        headers={"Authorization": f"Bearer {token}"},
        json={"totp_code": code}
    )
    assert enable_res.status_code == 200
    assert enable_res.json()["is_totp_enabled"] is True


