import uuid
import enum
from sqlalchemy import Column, String, Enum, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base

class MessageRole(str, enum.Enum):
    user = "user"
    assistant = "assistant"

class Message(Base):
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id"), nullable=False)
    role = Column(Enum(MessageRole), nullable=False)
    content = Column(String, nullable=False)
    sources = Column(JSON, nullable=True) 
    created_at = Column(DateTime(timezone=True), server_default=func.now())