"""add query support indexes

Revision ID: 20260328_04
Revises: 20260328_03
Create Date: 2026-03-28 16:40:00
"""

from alembic import op


revision = "20260328_04"
down_revision = "20260328_03"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index(
        "ix_certificados_concluido",
        "certificados",
        ["concluido"],
        unique=False,
    )
    op.create_index(
        "ix_certificados_emitido_em",
        "certificados",
        ["emitido_em"],
        unique=False,
    )
    op.create_index(
        "ix_certificados_secretaria_id",
        "certificados",
        ["secretaria_id"],
        unique=False,
    )
    op.create_index(
        "ix_auditoria_eventos_secretaria_id",
        "auditoria_eventos",
        ["secretaria_id"],
        unique=False,
    )
    op.create_index(
        "ix_auditoria_eventos_criado_em",
        "auditoria_eventos",
        ["criado_em"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_auditoria_eventos_criado_em", table_name="auditoria_eventos")
    op.drop_index("ix_auditoria_eventos_secretaria_id", table_name="auditoria_eventos")
    op.drop_index("ix_certificados_secretaria_id", table_name="certificados")
    op.drop_index("ix_certificados_emitido_em", table_name="certificados")
    op.drop_index("ix_certificados_concluido", table_name="certificados")
