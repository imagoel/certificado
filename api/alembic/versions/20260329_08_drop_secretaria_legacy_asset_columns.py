"""drop legacy secretaria logo and assinatura columns

Revision ID: 20260329_08
Revises: 20260329_07
Create Date: 2026-03-29 11:05:00
"""

from alembic import op
import sqlalchemy as sa


revision = "20260329_08"
down_revision = "20260329_07"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("secretarias") as batch_op:
        batch_op.drop_column("logo_path")
        batch_op.drop_column("assinatura_path")


def downgrade() -> None:
    with op.batch_alter_table("secretarias") as batch_op:
        batch_op.add_column(sa.Column("logo_path", sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column("assinatura_path", sa.String(length=255), nullable=True))
