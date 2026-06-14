"""add certificate participant email

Revision ID: 20260614_14
Revises: 20260614_13
Create Date: 2026-06-14
"""

from alembic import op
import sqlalchemy as sa


revision = "20260614_14"
down_revision = "20260614_13"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("certificados", sa.Column("email", sa.String(length=254), nullable=True))


def downgrade() -> None:
    op.drop_column("certificados", "email")
