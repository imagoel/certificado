"""baseline schema

Revision ID: 20260328_01
Revises:
Create Date: 2026-03-28 09:50:00
"""

from alembic import op
import sqlalchemy as sa


revision = "20260328_01"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "secretarias",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("sigla", sa.String(length=20), nullable=False),
        sa.Column("nome", sa.String(length=150), nullable=False),
        sa.Column("ativa", sa.Boolean(), nullable=False),
        sa.Column("logo_path", sa.String(length=255), nullable=True),
        sa.Column("assinatura_path", sa.String(length=255), nullable=True),
        sa.Column("criado_em", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_secretarias_sigla"), "secretarias", ["sigla"], unique=True)

    op.create_table(
        "usuarios",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("nome", sa.String(length=150), nullable=False),
        sa.Column("username", sa.String(length=80), nullable=False),
        sa.Column("senha_hash", sa.String(length=255), nullable=False),
        sa.Column("papel", sa.String(length=40), nullable=False),
        sa.Column("ativo", sa.Boolean(), nullable=False),
        sa.Column("ultimo_login_em", sa.DateTime(), nullable=True),
        sa.Column("criado_em", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_usuarios_username"), "usuarios", ["username"], unique=True)

    op.create_table(
        "certificados",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("codigo", sa.String(length=20), nullable=False),
        sa.Column("nome", sa.String(length=200), nullable=False),
        sa.Column("cpf", sa.String(length=14), nullable=True),
        sa.Column("curso", sa.String(length=200), nullable=False),
        sa.Column("carga_h", sa.Integer(), nullable=False),
        sa.Column("concluido", sa.Date(), nullable=False),
        sa.Column("emitido_em", sa.DateTime(), nullable=False),
        sa.Column("hash", sa.String(length=64), nullable=False),
        sa.Column("secretaria_id", sa.Integer(), nullable=True),
        sa.Column("emitido_por_usuario_id", sa.Integer(), nullable=True),
        sa.Column("arquivo_relpath", sa.String(length=255), nullable=True),
        sa.Column("arquivo_mime", sa.String(length=100), nullable=True),
        sa.Column("arquivo_bytes", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["emitido_por_usuario_id"], ["usuarios.id"]),
        sa.ForeignKeyConstraint(["secretaria_id"], ["secretarias.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_certificados_codigo"), "certificados", ["codigo"], unique=True)

    op.create_table(
        "auditoria_eventos",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("evento", sa.String(length=80), nullable=False),
        sa.Column("descricao", sa.Text(), nullable=True),
        sa.Column("usuario_id", sa.Integer(), nullable=True),
        sa.Column("secretaria_id", sa.Integer(), nullable=True),
        sa.Column("certificado_id", sa.Integer(), nullable=True),
        sa.Column("entidade_tipo", sa.String(length=50), nullable=True),
        sa.Column("entidade_id", sa.Integer(), nullable=True),
        sa.Column("criado_em", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["certificado_id"], ["certificados.id"]),
        sa.ForeignKeyConstraint(["secretaria_id"], ["secretarias.id"]),
        sa.ForeignKeyConstraint(["usuario_id"], ["usuarios.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_auditoria_eventos_evento"), "auditoria_eventos", ["evento"], unique=False)

    op.create_table(
        "usuario_secretarias",
        sa.Column("usuario_id", sa.Integer(), nullable=False),
        sa.Column("secretaria_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["secretaria_id"], ["secretarias.id"]),
        sa.ForeignKeyConstraint(["usuario_id"], ["usuarios.id"]),
        sa.PrimaryKeyConstraint("usuario_id", "secretaria_id"),
    )


def downgrade() -> None:
    op.drop_table("usuario_secretarias")
    op.drop_index(op.f("ix_auditoria_eventos_evento"), table_name="auditoria_eventos")
    op.drop_table("auditoria_eventos")
    op.drop_index(op.f("ix_certificados_codigo"), table_name="certificados")
    op.drop_table("certificados")
    op.drop_index(op.f("ix_usuarios_username"), table_name="usuarios")
    op.drop_table("usuarios")
    op.drop_index(op.f("ix_secretarias_sigla"), table_name="secretarias")
    op.drop_table("secretarias")
