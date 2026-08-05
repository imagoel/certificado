"""add absence flag to form responses

Revision ID: 20260805_19
Revises: 20260712_18
Create Date: 2026-08-05
"""

from alembic import op
import sqlalchemy as sa


revision = "20260805_19"
down_revision = "20260712_18"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "certificate_form_responses",
        sa.Column(
            "nao_gerar_certificado",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )


def downgrade() -> None:
    op.drop_column("certificate_form_responses", "nao_gerar_certificado")
