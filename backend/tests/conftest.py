import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.config import settings
from app.database import Base, get_db
from app.main import app

from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.models.conversation import Conversation
from app.models.message import Message

test_engine = create_engine(settings.test_database_url)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind= test_engine)

@pytest.fixture(scope = "function")
def db_session():
    Base.metadata.create_all(bind= test_engine)
    session = TestSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind= test_engine)

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def auth_headers(client):
    client.post("/auth/register", json={
        "email": "fixtureuser@example.com",
        "password": "testpass123",
    })
    login_response = client.post("/auth/login", json={
        "email": "fixtureuser@example.com",
        "password": "testpass123",
    })
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}