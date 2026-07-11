"""add certificate forms

Revision ID: 20260710_17
Revises: 20260614_16
Create Date: 2026-07-10
"""

from alembic import op
import sqlalchemy as sa


revision = "20260710_17"
down_revision = "20260614_16"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "certificate_forms",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("secretaria_id", sa.Integer(), nullable=False),
        sa.Column("titulo", sa.String(length=200), nullable=False),
        sa.Column("curso", sa.String(length=200), nullable=False),
        sa.Column("carga_h", sa.Integer(), nullable=False),
        sa.Column("concluido", sa.Date(), nullable=False),
        sa.Column("reply_email_id", sa.Integer(), nullable=True),
        sa.Column("token", sa.String(length=80), nullable=False),
        sa.Column("ativo", sa.Boolean(), nullable=False),
        sa.Column("email_obrigatorio", sa.Boolean(), nullable=False),
        sa.Column("campos_extras", sa.JSON(), nullable=True),
        sa.Column("criado_por_usuario_id", sa.Integer(), nullable=True),
        sa.Column("criado_em", sa.DateTime(), nullable=False),
        sa.Column("atualizado_em", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["criado_por_usuario_id"], ["usuarios.id"]),
        sa.ForeignKeyConstraint(["reply_email_id"], ["secretaria_reply_emails.id"]),
        sa.ForeignKeyConstraint(["secretaria_id"], ["secretarias.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token", name="uq_certificate_forms_token"),
    )
    op.create_index(op.f("ix_certificate_forms_id"), "certificate_forms", ["id"])
    op.create_index(
        op.f("ix_certificate_forms_secretaria_id"),
        "certificate_forms",
        ["secretaria_id"],
    )
    op.create_index(op.f("ix_certificate_forms_token"), "certificate_forms", ["token"])

    op.create_table(
        "certificate_form_responses",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("formulario_id", sa.Integer(), nullable=False),
        sa.Column("nome", sa.String(length=200), nullable=False),
        sa.Column("email", sa.String(length=254), nullable=True),
        sa.Column("dados_extras", sa.JSON(), nullable=True),
        sa.Column("ip_hash", sa.String(length=64), nullable=True),
        sa.Column("user_agent", sa.String(length=255), nullable=True),
        sa.Column("certificado_id", sa.Integer(), nullable=True),
        sa.Column("certificado_codigo", sa.String(length=20), nullable=True),
        sa.Column("criado_em", sa.DateTime(), nullable=False),
        sa.Column("certificado_gerado_em", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["certificado_id"], ["certificados.id"]),
        sa.ForeignKeyConstraint(["formulario_id"], ["certificate_forms.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_certificate_form_responses_formulario_id"),
        "certificate_form_responses",
        ["formulario_id"],
    )
    op.create_index(
        op.f("ix_certificate_form_responses_id"),
        "certificate_form_responses",
        ["id"],
    )
    op.create_index(
        op.f("ix_certificate_form_responses_criado_em"),
        "certificate_form_responses",
        ["criado_em"],
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_certificate_form_responses_criado_em"),
        table_name="certificate_form_responses",
    )
    op.drop_index(
        op.f("ix_certificate_form_responses_id"),
        table_name="certificate_form_responses",
    )
    op.drop_index(
        op.f("ix_certificate_form_responses_formulario_id"),
        table_name="certificate_form_responses",
    )
    op.drop_table("certificate_form_responses")

    op.drop_index(op.f("ix_certificate_forms_token"), table_name="certificate_forms")
    op.drop_index(op.f("ix_certificate_forms_secretaria_id"), table_name="certificate_forms")
    op.drop_index(op.f("ix_certificate_forms_id"), table_name="certificate_forms")
    op.drop_table("certificate_forms")
