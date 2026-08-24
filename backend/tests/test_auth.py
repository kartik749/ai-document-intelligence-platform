def test_register_new_user(client):
    response = client.post("/auth/register", json={
        "email": "test1@example.com",
        "password": "testpass123",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test1@example.com"
    assert "id" in data
    assert "password" not in data
    assert "password_hash" not in data


def test_register_duplicate_email_fails(client):
    client.post("/auth/register", json={
        "email": "duplicate@example.com",
        "password": "testpass123",
    })
    response = client.post("/auth/register", json={
        "email": "duplicate@example.com",
        "password": "differentpass",
    })
    assert response.status_code == 400


def test_login_with_correct_credentials(client):
    client.post("/auth/register", json={
        "email": "logintest@example.com",
        "password": "correctpass",
    })
    response = client.post("/auth/login", json={
        "email": "logintest@example.com",
        "password": "correctpass",
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


def test_login_with_wrong_password_fails(client):
    client.post("/auth/register", json={
        "email": "wrongpass@example.com",
        "password": "correctpass",
    })
    response = client.post("/auth/login", json={
        "email": "wrongpass@example.com",
        "password": "wrongpass",
    })
    assert response.status_code == 401


def test_refresh_token_issues_new_access_token(client):
    client.post("/auth/register", json={
        "email": "refreshtest@example.com",
        "password": "testpass123",
    })
    login_response = client.post("/auth/login", json={
        "email": "refreshtest@example.com",
        "password": "testpass123",
    })
    refresh_token = login_response.json()["refresh_token"]

    response = client.post("/auth/refresh", json={"refresh_token": refresh_token})
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_logout_revokes_refresh_token(client):
    client.post("/auth/register", json={
        "email": "logouttest@example.com",
        "password": "testpass123",
    })
    login_response = client.post("/auth/login", json={
        "email": "logouttest@example.com",
        "password": "testpass123",
    })
    refresh_token = login_response.json()["refresh_token"]

    logout_response = client.post("/auth/logout", json={"refresh_token": refresh_token})
    assert logout_response.status_code == 204

    reuse_response = client.post("/auth/refresh", json={"refresh_token": refresh_token})
    assert reuse_response.status_code == 401