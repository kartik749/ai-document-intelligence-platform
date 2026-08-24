from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from app.models.document import DocumentStatus

class DocumentResponse(BaseModel):
    id: UUID
    filename: str
    status: DocumentStatus
    page_count: int | None
    created_at: datetime

    class Config:
        from_attributes = True