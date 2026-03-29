"""add secretaria assets table

Revision ID: 20260329_07
Revises: 20260328_06
Create Date: 2026-03-29 06:20:00
"""

from alembic import op
import sqlalchemy as sa


revision = "20260329_07"
down_revision = "20260328_06"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "secretaria_assets",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("secretaria_id", sa.Integer(), nullable=False),
        sa.Column("tipo", sa.String(length=20), nullable=False),
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
        "ix_secretaria_assets_secretaria_id",
        "secretaria_assets",
        ["secretaria_id"],
        unique=False,
    )
    op.create_index(
        "ix_secretaria_assets_tipo",
        "secretaria_assets",
        ["tipo"],
        unique=False,
    )
    op.create_index(
        "ix_secretaria_assets_ativo",
        "secretaria_assets",
        ["ativo"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_secretaria_assets_ativo", table_name="secretaria_assets")
    op.drop_index("ix_secretaria_assets_tipo", table_name="secretaria_assets")
    op.drop_index("ix_secretaria_assets_secretaria_id", table_name="secretaria_assets")
    op.drop_table("secretaria_assets")
