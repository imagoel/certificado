"""add form confirmation email tracking

Revision ID: 20260712_18
Revises: 20260710_17
Create Date: 2026-07-12
"""

from alembic import op
import sqlalchemy as sa


revision = "20260712_18"
down_revision = "20260710_17"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "certificate_form_email_tentativas",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("formulario_resposta_id", sa.Integer(), nullable=True),
        sa.Column("formulario_id", sa.Integer(), nullable=True),
        sa.Column("destinatario", sa.String(length=254), nullable=False),
        sa.Column("reply_to", sa.String(length=254), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("erro", sa.Text(), nullable=True),
        sa.Column("criado_em", sa.DateTime(), nullable=False),
        sa.Column("enviado_em", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["formulario_id"], ["certificate_forms.id"]),
        sa.ForeignKeyConstraint(["formulario_resposta_id"], ["certificate_form_responses.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_certificate_form_email_tentativas_id"),
        "certificate_form_email_tentativas",
        ["id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_certificate_form_email_tentativas_formulario_resposta_id"),
        "certificate_form_email_tentativas",
        ["formulario_resposta_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_certificate_form_email_tentativas_formulario_id"),
        "certificate_form_email_tentativas",
        ["formulario_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_certificate_form_email_tentativas_status"),
        "certificate_form_email_tentativas",
        ["status"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_certificate_form_email_tentativas_status"),
        table_name="certificate_form_email_tentativas",
    )
    op.drop_index(
        op.f("ix_certificate_form_email_tentativas_formulario_id"),
        table_name="certificate_form_email_tentativas",
    )
    op.drop_index(
        op.f("ix_certificate_form_email_tentativas_formulario_resposta_id"),
        table_name="certificate_form_email_tentativas",
    )
    op.drop_index(
        op.f("ix_certificate_form_email_tentativas_id"),
        table_name="certificate_form_email_tentativas",
    )
    op.drop_table("certificate_form_email_tentativas")
