from __future__ import annotations

from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import inspect, text

from database import Base, DATABASE_URL, engine


BASE_DIR = Path(__file__).resolve().parent
ALEMBIC_INI_PATH = BASE_DIR / "alembic.ini"
ALEMBIC_SCRIPT_LOCATION = BASE_DIR / "alembic"
BASELINE_REVISION = "20260328_01"


def get_alembic_config() -> Config:
    config = Config(str(ALEMBIC_INI_PATH))
    config.set_main_option("script_location", str(ALEMBIC_SCRIPT_LOCATION))
    config.set_main_option("sqlalchemy.url", DATABASE_URL.replace("%", "%%"))
    return config


def bridge_legacy_schema(connection) -> None:
    Base.metadata.create_all(bind=connection)
    inspector = inspect(connection)

    try:
        columns = {column["name"] for column in inspector.get_columns("certificados")}
    except Exception:
        return

    statements: list[str] = []
    if "arquivo_relpath" not in columns:
        statements.append("ALTER TABLE certificados ADD COLUMN arquivo_relpath VARCHAR(255)")
    if "arquivo_mime" not in columns:
        statements.append("ALTER TABLE certificados ADD COLUMN arquivo_mime VARCHAR(100)")
    if "arquivo_bytes" not in columns:
        statements.append("ALTER TABLE certificados ADD COLUMN arquivo_bytes INTEGER")
    if "secretaria_id" not in columns:
        statements.append("ALTER TABLE certificados ADD COLUMN secretaria_id INTEGER")
    if "emitido_por_usuario_id" not in columns:
        statements.append("ALTER TABLE certificados ADD COLUMN emitido_por_usuario_id INTEGER")

    for statement in statements:
        connection.execute(text(statement))


def ensure_database_schema() -> None:
    config = get_alembic_config()

    with engine.begin() as connection:
        inspector = inspect(connection)
        tables = set(inspector.get_table_names())

        config.attributes["connection"] = connection

        if not tables:
            command.upgrade(config, "head")
            return

        if "alembic_version" not in tables:
            bridge_legacy_schema(connection)
            command.stamp(config, BASELINE_REVISION)
            command.upgrade(config, "head")
            return

        command.upgrade(config, "head")
