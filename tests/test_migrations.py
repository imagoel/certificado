from sqlalchemy import text


def test_database_schema_is_versioned_with_alembic(app_ctx):
    db = app_ctx.database.SessionLocal()
    try:
        version = db.execute(text("SELECT version_num FROM alembic_version")).scalar_one()
    finally:
        db.close()

    assert version == "20260328_03"
