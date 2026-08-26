import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Request
from app.core.limiter import limiter
from sqlalchemy.orm import Session
from jose import JWTError

from app.database import get_db
from app.models.document import Document, DocumentStatus
from app.models.document_chunk import DocumentChunk
from app.schemas.document import DocumentResponse
from app.core.security import decode_token
from app.config import settings
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services.jobs import process_document_job


router = APIRouter(prefix="/documents", tags=["documents"])
security = HTTPBearer()

def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    try:
        payload = decode_token(credentials.credentials)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token type")

    return payload["sub"]

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def upload_document(
    request : Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    file.file.seek(0, os.SEEK_END)
    file_size_mb = file.file.tell() / (1024 * 1024)
    file.file.seek(0)

    if file_size_mb > settings.max_upload_size_mb:
        raise HTTPException(status_code=400, detail=f"File exceeds {settings.max_upload_size_mb}MB limit")

    user_folder = os.path.join(settings.storage_path, user_id)
    os.makedirs(user_folder, exist_ok=True)

    document_id = uuid.uuid4()
    safe_filename = f"{document_id}.pdf"
    storage_path = os.path.join(user_folder, safe_filename)

    with open(storage_path, "wb") as f:
        f.write(file.file.read())

    document = Document(
        id=document_id,
        user_id=user_id,
        filename=file.filename,
        storage_path=storage_path,
        status=DocumentStatus.uploaded,
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    process_document_job(str(document_id),storage_path,db)
    db.refresh(document)
    return document

@router.get("", response_model=list[DocumentResponse])
def list_documents(db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    return db.query(Document).filter(Document.user_id == user_id).order_by(Document.created_at.desc()).all()

@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(document_id: str, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    document = db.query(Document).filter(Document.id == document_id, Document.user_id == user_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document

@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(document_id: str, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    document = db.query(Document).filter(Document.id == document_id, Document.user_id == user_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    db.query(DocumentChunk).filter(DocumentChunk.document_id == document.id).delete()

    if os.path.exists(document.storage_path):
        os.remove(document.storage_path)

    db.delete(document)
    db.commit()
    return