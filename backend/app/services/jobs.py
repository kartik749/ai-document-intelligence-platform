from app.database import SessionLocal
from app.models.document import Document, DocumentStatus
from app.models.document_chunk import DocumentChunk
from app.services.ingestion import process_pdf
from app.services.embedding import generate_embeddings
from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.models.conversation import Conversation
from app.models.message import Message

def process_document_job(document_id: str, storage_path: str, db):
    try:
        document = db.query(Document).filter(Document.id == document_id).first()
        if not document:
            return
        document.status = DocumentStatus.processing
        db.commit()
        chunks, page_count = process_pdf(storage_path)
        if chunks:
            chunk_texts = [c["chunk_text"] for c in chunks]
            embeddings = generate_embeddings(chunk_texts)
            for chunk_data, embedding in zip(chunks, embeddings):
                db_chunk = DocumentChunk(
                    document_id=document.id,
                    chunk_text=chunk_data["chunk_text"],
                    page_number=chunk_data["page_number"],
                    chunk_index=chunk_data["chunk_index"],
                    embedding=embedding,
                )
                db.add(db_chunk)
        document.page_count = page_count
        document.status = DocumentStatus.ready
        db.commit()
    except Exception:
        document = db.query(Document).filter(Document.id == document_id).first()
        if document:
            document.status = DocumentStatus.failed
            db.commit()
        raise