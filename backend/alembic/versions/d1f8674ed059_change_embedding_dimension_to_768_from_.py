"""change embedding dimension to 768 from groq nomic model

Revision ID: d1f8674ed059
Revises: ded8695affaa
Create Date: 2026-08-25 17:17:51.190693

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd1f8674ed059'
down_revision: Union[str, Sequence[str], None] = 'ded8695affaa'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
