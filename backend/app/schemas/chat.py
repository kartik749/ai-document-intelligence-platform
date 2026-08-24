from pydantic import BaseModel
from datetime import datetime
from uuid import UUID

class ChatRequest(BaseModel):
    document_id : UUID
    conversation_id : UUID | None = None
    question : str

class SourceInfo(BaseModel):
    page_number: int
    chunk_id: str

class ChatResponse(BaseModel):
    conversation_id: UUID
    answer: str
    sources: list[SourceInfo]

class MessageResponse(BaseModel):
    id : UUID
    role: str
    content: str
    sources : list[SourceInfo] | None
    created_at: datetime

    class Config:
        from_attributes = True

class ConversationHistoryResponse(BaseModel):
    conversation_id: UUID
    messages: list[MessageResponse]