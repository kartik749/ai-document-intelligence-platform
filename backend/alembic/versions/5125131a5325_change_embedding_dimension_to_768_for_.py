"""change embedding dimension to 768 for groq nomic model

Revision ID: 5125131a5325
Revises: d1f8674ed059
Create Date: 2026-08-25 17:20:01.699358

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5125131a5325'
down_revision: Union[str, Sequence[str], None] = 'd1f8674ed059'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
