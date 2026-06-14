"""add certificate admin edit fields

Revision ID: 20260614_13
Revises: 20260614_12
Create Date: 2026-06-14
"""

from alembic import op
import sqlalchemy as sa


revision = "20260614_13"
down_revision = "20260614_12"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    op.add_column("certificados", sa.Column("render_snapshot", sa.JSON(), nullable=True))
    op.add_column("certificados", sa.Column("atualizado_em", sa.DateTime(), nullable=True))
    op.add_column(
        "certificados",
        sa.Column("atualizado_por_usuario_id", sa.Integer(), nullable=True),
    )
    if bind.dialect.name != "sqlite":
        op.create_foreign_key(
            "fk_certificados_atualizado_por_usuario_id",
            "certificados",
            "usuarios",
            ["atualizado_por_usuario_id"],
            ["id"],
        )


def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name != "sqlite":
        op.drop_constraint(
            "fk_certificados_atualizado_por_usuario_id",
            "certificados",
            type_="foreignkey",
        )
    op.drop_column("certificados", "atualizado_por_usuario_id")
    op.drop_column("certificados", "atualizado_em")
    op.drop_column("certificados", "render_snapshot")
