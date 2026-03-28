from alembic import op
import sqlalchemy as sa


revision = "20260328_06"
down_revision = "20260328_05"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "auditoria_eventos",
        sa.Column("certificado_codigo_snapshot", sa.String(length=20), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("auditoria_eventos", "certificado_codigo_snapshot")
