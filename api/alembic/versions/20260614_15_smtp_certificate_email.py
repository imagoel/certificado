"""add smtp email delivery tracking

Revision ID: 20260614_15
Revises: 20260614_14
Create Date: 2026-06-14
"""

from alembic import op
import sqlalchemy as sa


revision = "20260614_15"
down_revision = "20260614_14"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("secretarias", sa.Column("email_resposta", sa.String(length=254), nullable=True))
    op.create_table(
        "certificado_email_tentativas",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("certificado_id", sa.Integer(), nullable=True),
        sa.Column("certificado_codigo", sa.String(length=20), nullable=False),
        sa.Column("destinatario", sa.String(length=254), nullable=False),
        sa.Column("reply_to", sa.String(length=254), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("erro", sa.Text(), nullable=True),
        sa.Column("criado_em", sa.DateTime(), nullable=False),
        sa.Column("enviado_em", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["certificado_id"], ["certificados.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_certificado_email_tentativas_id"),
        "certificado_email_tentativas",
        ["id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_certificado_email_tentativas_certificado_id"),
        "certificado_email_tentativas",
        ["certificado_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_certificado_email_tentativas_certificado_codigo"),
        "certificado_email_tentativas",
        ["certificado_codigo"],
        unique=False,
    )
    op.create_index(
        op.f("ix_certificado_email_tentativas_status"),
        "certificado_email_tentativas",
        ["status"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_certificado_email_tentativas_status"), table_name="certificado_email_tentativas")
    op.drop_index(
        op.f("ix_certificado_email_tentativas_certificado_codigo"),
        table_name="certificado_email_tentativas",
    )
    op.drop_index(
        op.f("ix_certificado_email_tentativas_certificado_id"),
        table_name="certificado_email_tentativas",
    )
    op.drop_index(op.f("ix_certificado_email_tentativas_id"), table_name="certificado_email_tentativas")
    op.drop_table("certificado_email_tentativas")
    op.drop_column("secretarias", "email_resposta")
