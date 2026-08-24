import uuid
from app.models.document import Document, DocumentStatus


def create_test_document(db_session, user_id):
    document = Document(
        id=uuid.uuid4(),
        user_id=user_id,
        filename="test.pdf",
        storage_path="fake/path.pdf",
        status=DocumentStatus.ready,
        page_count=5,
    )
    db_session.add(document)
    db_session.commit()
    db_session.refresh(document)
    return document


def get_user_id_from_token(client, headers):
    from jose import jwt
    from app.config import settings

    token = headers["Authorization"].split(" ")[1]
    payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    return payload["sub"]


def test_chat_requires_authentication(client):
    response = client.post("/chat", json={
        "document_id": str(uuid.uuid4()),
        "question": "What is this about?",
    })
    assert response.status_code == 401


def test_chat_returns_404_for_nonexistent_document(client, auth_headers):
    response = client.post("/chat", headers=auth_headers, json={
        "document_id": str(uuid.uuid4()),
        "question": "What is this about?",
    })
    assert response.status_code == 404


def test_chat_returns_grounded_answer(client, auth_headers, db_session, monkeypatch):
    user_id = get_user_id_from_token(client, auth_headers)
    document = create_test_document(db_session, user_id)

    def fake_retrieve(db, document_id, question):
        return [{"chunk_id": "abc123", "page_number": 3, "chunk_text": "The course is worth 4 credits."}]

    def fake_generate(question, chunks):
        return "The course is worth 4 credits, according to page 3."

    monkeypatch.setattr("app.api.chat.retrieve_relevant_chunks", fake_retrieve)
    monkeypatch.setattr("app.api.chat.generate_answer", fake_generate)

    response = client.post("/chat", headers=auth_headers, json={
        "document_id": str(document.id),
        "question": "How many credits is this course?",
    })

    assert response.status_code == 200
    data = response.json()
    assert data["answer"] == "The course is worth 4 credits, according to page 3."
    assert data["sources"][0]["page_number"] == 3
    assert "conversation_id" in data


def test_chat_falls_back_when_no_chunks_found(client, auth_headers, db_session, monkeypatch):
    user_id = get_user_id_from_token(client, auth_headers)
    document = create_test_document(db_session, user_id)

    def fake_retrieve_empty(db, document_id, question):
        return []

    monkeypatch.setattr("app.api.chat.retrieve_relevant_chunks", fake_retrieve_empty)

    response = client.post("/chat", headers=auth_headers, json={
        "document_id": str(document.id),
        "question": "Something totally unrelated",
    })

    assert response.status_code == 200
    data = response.json()
    assert data["answer"] == "I couldn't find this in the provided document."
    assert data["sources"] == []


def test_conversation_history_returns_all_messages(client, auth_headers, db_session, monkeypatch):
    user_id = get_user_id_from_token(client, auth_headers)
    document = create_test_document(db_session, user_id)

    def fake_retrieve(db, document_id, question):
        return [{"chunk_id": "abc123", "page_number": 1, "chunk_text": "Some content."}]

    def fake_generate(question, chunks):
        return "A fake answer."

    monkeypatch.setattr("app.api.chat.retrieve_relevant_chunks", fake_retrieve)
    monkeypatch.setattr("app.api.chat.generate_answer", fake_generate)

    first_response = client.post("/chat", headers=auth_headers, json={
        "document_id": str(document.id),
        "question": "First question",
    })
    conversation_id = first_response.json()["conversation_id"]

    client.post("/chat", headers=auth_headers, json={
        "document_id": str(document.id),
        "conversation_id": conversation_id,
        "question": "Second question",
    })

    history_response = client.get(f"/chat/{conversation_id}", headers=auth_headers)
    assert history_response.status_code == 200
    messages = history_response.json()["messages"]
    assert len(messages) == 4
    assert messages[0]["role"] == "user"
    assert messages[1]["role"] == "assistant"