import pytest


def test_auto_bootstrap_admin_falha_sem_credenciais(app_ctx, monkeypatch):
    monkeypatch.setenv("AUTO_BOOTSTRAP_ADMIN", "true")
    monkeypatch.delenv("BOOTSTRAP_ADMIN_USERNAME", raising=False)
    monkeypatch.delenv("BOOTSTRAP_ADMIN_PASSWORD", raising=False)

    db = app_ctx.database.SessionLocal()
    try:
        with pytest.raises(RuntimeError) as error:
            app_ctx.main.run_startup_tasks()
    finally:
        db.close()

    assert "AUTO_BOOTSTRAP_ADMIN=true" in str(error.value)
