"""add certificate trash fields

Revision ID: 20260614_12
Revises: 20260611_11
Create Date: 2026-06-14
"""

from alembic import op
import sqlalchemy as sa


revision = "20260614_12"
down_revision = "20260611_11"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    op.add_column("certificados", sa.Column("excluido_em", sa.DateTime(), nullable=True))
    op.add_column("certificados", sa.Column("exclusao_expira_em", sa.DateTime(), nullable=True))
    op.add_column(
        "certificados",
        sa.Column("excluido_por_usuario_id", sa.Integer(), nullable=True),
    )
    if bind.dialect.name != "sqlite":
        op.create_foreign_key(
            "fk_certificados_excluido_por_usuario_id",
            "certificados",
            "usuarios",
            ["excluido_por_usuario_id"],
            ["id"],
        )
    op.create_index(
        op.f("ix_certificados_excluido_em"),
        "certificados",
        ["excluido_em"],
        unique=False,
    )
    op.create_index(
        op.f("ix_certificados_exclusao_expira_em"),
        "certificados",
        ["exclusao_expira_em"],
        unique=False,
    )


def downgrade() -> None:
    bind = op.get_bind()
    op.drop_index(op.f("ix_certificados_exclusao_expira_em"), table_name="certificados")
    op.drop_index(op.f("ix_certificados_excluido_em"), table_name="certificados")
    if bind.dialect.name != "sqlite":
        op.drop_constraint(
            "fk_certificados_excluido_por_usuario_id",
            "certificados",
            type_="foreignkey",
        )
    op.drop_column("certificados", "excluido_por_usuario_id")
    op.drop_column("certificados", "exclusao_expira_em")
    op.drop_column("certificados", "excluido_em")
