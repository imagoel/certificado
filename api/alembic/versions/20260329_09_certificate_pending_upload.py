"""mark certificates as pending until PNG upload succeeds

Revision ID: 20260329_09
Revises: 20260329_08
Create Date: 2026-03-29
"""

from alembic import op
import sqlalchemy as sa


revision = "20260329_09"
down_revision = "20260329_08"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    op.add_column(
        "certificados",
        sa.Column("arquivo_pendente", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.execute(
        sa.text(
            "UPDATE certificados SET arquivo_pendente = false WHERE arquivo_relpath IS NOT NULL"
        )
    )
    if bind.dialect.name != "sqlite":
        op.alter_column("certificados", "arquivo_pendente", server_default=None)


def downgrade() -> None:
    op.drop_column("certificados", "arquivo_pendente")
