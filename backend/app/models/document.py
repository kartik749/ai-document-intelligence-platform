import uuid
import enum
from sqlalchemy import Column, String, DateTime , Integer, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base

class DocumentStatus(str, enum.Enum):
    uploaded  = "uploaded"
    processing = "processing"
    ready = "ready"
    failed = "failed"

class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True),primary_key = True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    storage_path = Column(String, nullable=False)
    status = Column(Enum(DocumentStatus), default=DocumentStatus.uploaded, nullable=False)
    page_count = Column(Integer, nullable = True)
    created_at = Column(DateTime(timezone=True), server_default = func.now())
