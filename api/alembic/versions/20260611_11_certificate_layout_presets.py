"""add saved certificate layout presets

Revision ID: 20260611_11
Revises: 20260519_10
Create Date: 2026-06-11
"""

from alembic import op
import sqlalchemy as sa


revision = "20260611_11"
down_revision = "20260519_10"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "certificate_layout_presets",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("secretaria_id", sa.Integer(), nullable=False),
        sa.Column("nome", sa.String(length=120), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("criado_por_usuario_id", sa.Integer(), nullable=True),
        sa.Column("criado_em", sa.DateTime(), nullable=False),
        sa.Column("atualizado_em", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["criado_por_usuario_id"], ["usuarios.id"]),
        sa.ForeignKeyConstraint(["secretaria_id"], ["secretarias.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "secretaria_id",
            "nome",
            name="uq_layout_presets_secretaria_nome",
        ),
    )
    op.create_index(
        op.f("ix_certificate_layout_presets_id"),
        "certificate_layout_presets",
        ["id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_certificate_layout_presets_secretaria_id"),
        "certificate_layout_presets",
        ["secretaria_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_certificate_layout_presets_secretaria_id"),
        table_name="certificate_layout_presets",
    )
    op.drop_index(
        op.f("ix_certificate_layout_presets_id"),
        table_name="certificate_layout_presets",
    )
    op.drop_table("certificate_layout_presets")
