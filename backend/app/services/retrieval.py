from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.document_chunk import DocumentChunk
from app.services.embedding import generate_embeddings

TOK_K = 5

def retrieve_relevant_chunks(db: Session, document_id: str,question: str) -> list[dict]:
    """
    Embeds the question, find the top k most similar chunks 
    for a specific document using pgvector cosine distance"""
    question_embedding = generate_embeddings([question])[0]

    results =  (
        db.query(DocumentChunk).filter(DocumentChunk.document_id == document_id).order_by(
        DocumentChunk.embedding.cosine_distance(question_embedding)).limit(TOK_K).all()
    )
    return [
        {
            "chunk_id": str(chunk.id),
            "page_number": chunk.page_number,
            "chunk_text": chunk.chunk_text
        }
        for chunk in results    
    ]