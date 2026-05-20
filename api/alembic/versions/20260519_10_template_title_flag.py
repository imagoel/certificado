"""add certificate title visibility flag to templates

Revision ID: 20260519_10
Revises: 20260329_09
Create Date: 2026-05-19
"""

from alembic import op
import sqlalchemy as sa


revision = "20260519_10"
down_revision = "20260329_09"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    op.add_column(
        "certificate_templates",
        sa.Column(
            "ocultar_titulo_certificado",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )
    if bind.dialect.name != "sqlite":
        op.alter_column(
            "certificate_templates",
            "ocultar_titulo_certificado",
            server_default=None,
        )


def downgrade() -> None:
    op.drop_column("certificate_templates", "ocultar_titulo_certificado")
