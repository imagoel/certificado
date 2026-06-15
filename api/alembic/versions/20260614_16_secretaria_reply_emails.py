"""add secretaria reply email catalog

Revision ID: 20260614_16
Revises: 20260614_15
Create Date: 2026-06-14
"""

from datetime import datetime

from alembic import op
import sqlalchemy as sa


revision = "20260614_16"
down_revision = "20260614_15"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()

    op.create_table(
        "secretaria_reply_emails",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("secretaria_id", sa.Integer(), nullable=False),
        sa.Column("nome", sa.String(length=120), nullable=False),
        sa.Column("email", sa.String(length=254), nullable=False),
        sa.Column("ativo", sa.Boolean(), nullable=False),
        sa.Column("padrao", sa.Boolean(), nullable=False),
        sa.Column("criado_em", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["secretaria_id"], ["secretarias.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("secretaria_id", "email", name="uq_secretaria_reply_emails_email"),
    )
    op.create_index(op.f("ix_secretaria_reply_emails_id"), "secretaria_reply_emails", ["id"])
    op.create_index(
        op.f("ix_secretaria_reply_emails_secretaria_id"),
        "secretaria_reply_emails",
        ["secretaria_id"],
    )

    op.add_column("certificados", sa.Column("reply_email_id", sa.Integer(), nullable=True))
    op.add_column("certificados", sa.Column("reply_to_nome", sa.String(length=120), nullable=True))
    op.add_column("certificados", sa.Column("reply_to_email", sa.String(length=254), nullable=True))
    if bind.dialect.name != "sqlite":
        op.create_foreign_key(
            "fk_certificados_reply_email_id_secretaria_reply_emails",
            "certificados",
            "secretaria_reply_emails",
            ["reply_email_id"],
            ["id"],
        )

    secretarias = sa.table(
        "secretarias",
        sa.column("id", sa.Integer()),
        sa.column("email_resposta", sa.String()),
    )
    reply_emails = sa.table(
        "secretaria_reply_emails",
        sa.column("secretaria_id", sa.Integer()),
        sa.column("nome", sa.String()),
        sa.column("email", sa.String()),
        sa.column("ativo", sa.Boolean()),
        sa.column("padrao", sa.Boolean()),
        sa.column("criado_em", sa.DateTime()),
    )

    rows = bind.execute(
        sa.select(secretarias.c.id, secretarias.c.email_resposta).where(
            secretarias.c.email_resposta.isnot(None),
            sa.func.trim(secretarias.c.email_resposta) != "",
        )
    ).mappings()
    now = datetime.utcnow()
    for row in rows:
        bind.execute(
            reply_emails.insert().values(
                secretaria_id=row["id"],
                nome="Email principal",
                email=row["email_resposta"],
                ativo=True,
                padrao=True,
                criado_em=now,
            )
        )


def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name != "sqlite":
        op.drop_constraint(
            "fk_certificados_reply_email_id_secretaria_reply_emails",
            "certificados",
            type_="foreignkey",
        )
    op.drop_column("certificados", "reply_to_email")
    op.drop_column("certificados", "reply_to_nome")
    op.drop_column("certificados", "reply_email_id")
    op.drop_index(op.f("ix_secretaria_reply_emails_secretaria_id"), table_name="secretaria_reply_emails")
    op.drop_index(op.f("ix_secretaria_reply_emails_id"), table_name="secretaria_reply_emails")
    op.drop_table("secretaria_reply_emails")
