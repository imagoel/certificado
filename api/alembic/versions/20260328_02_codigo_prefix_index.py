"""optimize code prefix search

Revision ID: 20260328_02
Revises: 20260328_01
Create Date: 2026-03-28 11:10:00
"""

from alembic import op


revision = "20260328_02"
down_revision = "20260328_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute(
            "CREATE INDEX IF NOT EXISTS ix_certificados_codigo_like_pattern "
            "ON certificados (codigo text_pattern_ops)"
        )


def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute("DROP INDEX IF EXISTS ix_certificados_codigo_like_pattern")
