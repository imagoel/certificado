"""add certificate templates table

Revision ID: 20260328_05
Revises: 20260328_04
Create Date: 2026-03-28 18:45:00
"""

from alembic import op
import sqlalchemy as sa


revision = "20260328_05"
down_revision = "20260328_04"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "certificate_templates",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("secretaria_id", sa.Integer(), nullable=False),
        sa.Column("nome", sa.String(length=150), nullable=False),
        sa.Column("arquivo_relpath", sa.String(length=255), nullable=False),
        sa.Column("arquivo_mime", sa.String(length=100), nullable=True),
        sa.Column("arquivo_bytes", sa.Integer(), nullable=True),
        sa.Column("ativo", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("padrao", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("ordem", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("criado_por_usuario_id", sa.Integer(), nullable=True),
        sa.Column("criado_em", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["criado_por_usuario_id"], ["usuarios.id"]),
        sa.ForeignKeyConstraint(["secretaria_id"], ["secretarias.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_certificate_templates_secretaria_id",
        "certificate_templates",
        ["secretaria_id"],
        unique=False,
    )
    op.create_index(
        "ix_certificate_templates_ativo",
        "certificate_templates",
        ["ativo"],
        unique=False,
    )
    op.create_index(
        "ix_certificate_templates_padrao",
        "certificate_templates",
        ["padrao"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_certificate_templates_padrao", table_name="certificate_templates")
    op.drop_index("ix_certificate_templates_ativo", table_name="certificate_templates")
    op.drop_index("ix_certificate_templates_secretaria_id", table_name="certificate_templates")
    op.drop_table("certificate_templates")
