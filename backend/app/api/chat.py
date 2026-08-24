from fastapi import APIRouter, Depends, HTTPException, Request
from app.core.limiter import limiter
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.document import Document
from app.models.conversation import Conversation
from app.models.message import Message, MessageRole
from app.schemas.chat import ChatRequest, ChatResponse, ConversationHistoryResponse, SourceInfo
from app.services.retrieval import retrieve_relevant_chunks
from app.services.llm import generate_answer
from app.api.documents import get_current_user_id

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("", response_model=ChatResponse)
@limiter.limit("10/minute")
def chat(
    request : Request,
    payload: ChatRequest,
    db : Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    document = db.query(Document).filter(Document.id == payload.document_id, Document.user_id == user_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    if payload.conversation_id:
        conversation = db.query(Conversation).filter(Conversation.id == payload.conversation_id, Conversation.user_id == user_id).first()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        conversation = Conversation(user_id=user_id, document_id=document.id)
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    user_message = Message(
        conversation_id=conversation.id,
        role=MessageRole.user,
        content=payload.question
    )
    db.add(user_message)
    db.commit()

    chunks = retrieve_relevant_chunks(db, str(document.id), payload.question)

    if not chunks:
        answer = "I couldn't find this in the provided document."
        sources = []
    else:
        answer = generate_answer(payload.question, chunks)
        sources = [{"page_number": c["page_number"], "chunk_id": c["chunk_id"]} for c in chunks]
    assistant_message = Message(
        conversation_id=conversation.id,
        role=MessageRole.assistant,
        content=answer,
        sources=sources,
    )
    db.add(assistant_message)
    db.commit()
    return ChatResponse(
        conversation_id=conversation.id,
        answer=answer,
        sources=[SourceInfo(**s) for s in sources],
    )

@router.get("/{conversation_id}", response_model=ConversationHistoryResponse)
def get_conversation_history(
    conversation_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.user_id == user_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    messages = db.query(Message).filter(Message.conversation_id == conversation.id).order_by(Message.created_at.asc()).all()
    return ConversationHistoryResponse(
        conversation_id=conversation.id,
        messages=messages,
    )