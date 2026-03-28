"""add certificate sequences

Revision ID: 20260328_03
Revises: 20260328_02
Create Date: 2026-03-28 10:35:00
"""

from alembic import op
import sqlalchemy as sa


revision = "20260328_03"
down_revision = "20260328_02"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "certificado_sequencias",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("prefixo", sa.String(length=20), nullable=False),
        sa.Column("ano", sa.Integer(), nullable=False),
        sa.Column("ultimo_numero", sa.Integer(), nullable=False),
        sa.Column("criado_em", sa.DateTime(), nullable=False),
        sa.Column("atualizado_em", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("prefixo", "ano", name="uq_certificado_sequencias_prefixo_ano"),
    )
    op.create_index(
        op.f("ix_certificado_sequencias_id"),
        "certificado_sequencias",
        ["id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_certificado_sequencias_id"), table_name="certificado_sequencias")
    op.drop_table("certificado_sequencias")
