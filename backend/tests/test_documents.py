import io


def create_fake_pdf_bytes():
    # Minimal valid PDF file bytes
    return b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R>>endobj\ntrailer<</Root 1 0 R>>"


def test_upload_requires_authentication(client):
    file_bytes = create_fake_pdf_bytes()
    response = client.post(
        "/documents/upload",
        files={"file": ("test.pdf", io.BytesIO(file_bytes), "application/pdf")},
    )
    assert response.status_code == 401


def test_upload_rejects_non_pdf_file(client, auth_headers):
    response = client.post(
        "/documents/upload",
        headers=auth_headers,
        files={"file": ("test.txt", io.BytesIO(b"not a pdf"), "text/plain")},
    )
    assert response.status_code == 400


def test_upload_creates_document(client, auth_headers):
    file_bytes = create_fake_pdf_bytes()
    response = client.post(
        "/documents/upload",
        headers=auth_headers,
        files={"file": ("test.pdf", io.BytesIO(file_bytes), "application/pdf")},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["filename"] == "test.pdf"
    assert data["status"] == "uploaded"


def test_list_documents_returns_only_own(client, db_session):
    client.post("/auth/register", json={"email": "usera@example.com", "password": "pass123"})
    login_a = client.post("/auth/login", json={"email": "usera@example.com", "password": "pass123"})
    headers_a = {"Authorization": f"Bearer {login_a.json()['access_token']}"}

    client.post("/auth/register", json={"email": "userb@example.com", "password": "pass123"})
    login_b = client.post("/auth/login", json={"email": "userb@example.com", "password": "pass123"})
    headers_b = {"Authorization": f"Bearer {login_b.json()['access_token']}"}

    file_bytes = create_fake_pdf_bytes()
    client.post(
        "/documents/upload",
        headers=headers_a,
        files={"file": ("usera_doc.pdf", io.BytesIO(file_bytes), "application/pdf")},
    )

    response_a = client.get("/documents", headers=headers_a)
    response_b = client.get("/documents", headers=headers_b)

    assert len(response_a.json()) == 1
    assert len(response_b.json()) == 0


def test_cannot_access_other_users_document(client):
    client.post("/auth/register", json={"email": "owner@example.com", "password": "pass123"})
    login_owner = client.post("/auth/login", json={"email": "owner@example.com", "password": "pass123"})
    headers_owner = {"Authorization": f"Bearer {login_owner.json()['access_token']}"}

    file_bytes = create_fake_pdf_bytes()
    upload_response = client.post(
        "/documents/upload",
        headers=headers_owner,
        files={"file": ("private.pdf", io.BytesIO(file_bytes), "application/pdf")},
    )
    document_id = upload_response.json()["id"]

    client.post("/auth/register", json={"email": "intruder@example.com", "password": "pass123"})
    login_intruder = client.post("/auth/login", json={"email": "intruder@example.com", "password": "pass123"})
    headers_intruder = {"Authorization": f"Bearer {login_intruder.json()['access_token']}"}

    response = client.get(f"/documents/{document_id}", headers=headers_intruder)
    assert response.status_code == 404