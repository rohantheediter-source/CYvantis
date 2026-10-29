def get_admin_token(client):
    login_res = client.post("/api/v1/auth/login", data={"username": "admin", "password": "Admin@Cyvantis2026!"})
    return login_res.json()["access_token"]

def test_get_events_list(client):
    token = get_admin_token(client)
    res = client.get("/api/v1/events?page=1&page_size=10", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert "total" in data
    assert len(data["items"]) <= 10

def test_get_events_filter_protocol(client):
    token = get_admin_token(client)
    res = client.get("/api/v1/events?protocol=SSH", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    for item in res.json()["items"]:
        assert item["protocol"] == "SSH"

def test_overview_analytics(client):
    token = get_admin_token(client)
    res = client.get("/api/v1/analytics/overview", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["total_events"] > 0
    assert "unique_ips" in data
