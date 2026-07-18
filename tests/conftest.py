import importlib
import sys
from pathlib import Path
from types import SimpleNamespace
from urllib.parse import urlparse

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import close_all_sessions


ROOT_DIR = Path(__file__).resolve().parents[1]
API_DIR = ROOT_DIR / "api"

if str(API_DIR) not in sys.path:
    sys.path.insert(0, str(API_DIR))


MODULES_TO_RELOAD = [
    "database",
    "models",
    "name_utils",
    "email_utils",
    "schemas",
    "security",
    "app_config",
    "request_security",
    "certificate_files",
    "auth_context",
    "bootstrap",
    "migrations",
    "audit_service",
    "reply_email_service",
    "common",
    "email_config",
    "smtp_sender",
    "email_templates",
    "email_attempts",
    "email_delivery",
    "routes_auth",
    "admin_reply_emails",
    "routes_admin",
    "routes_certificate_duplicates",
    "routes_certificates",
    "routes_forms",
    "routes_secretaria_assets",
    "routes_templates",
    "routes_layout_presets",
    "routes_public",
    "main",
]


class CsrfTestClient(TestClient):
    csrf_token: str | None = None

    def request(self, method: str, url, **kwargs):
        normalized_method = method.upper()
        path = urlparse(str(url)).path or str(url)
        headers = dict(kwargs.pop("headers", {}) or {})
        header_names = {key.lower() for key in headers}

        if (
            normalized_method not in {"GET", "HEAD", "OPTIONS"}
            and path != "/api/auth/login"
            and self.csrf_token
            and "x-csrf-token" not in header_names
        ):
            headers["X-CSRF-Token"] = self.csrf_token

        response = super().request(method, url, headers=headers, **kwargs)

        try:
            payload = response.json()
        except ValueError:
            payload = None

        if isinstance(payload, dict) and payload.get("csrf_token"):
            self.csrf_token = payload["csrf_token"]
        elif path == "/api/auth/logout" and response.status_code < 400:
            self.csrf_token = None

        return response


def load_app_modules() -> SimpleNamespace:
    for module_name in MODULES_TO_RELOAD:
        sys.modules.pop(module_name, None)

    database = importlib.import_module("database")
    models = importlib.import_module("models")
    security = importlib.import_module("security")
    migrations = importlib.import_module("migrations")
    main = importlib.import_module("main")
    return SimpleNamespace(
        database=database,
        models=models,
        security=security,
        migrations=migrations,
        main=main,
    )


@pytest.fixture()
def app_ctx(tmp_path, monkeypatch):
    media_dir = tmp_path / "media"
    database_path = tmp_path / "test.sqlite3"

    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{database_path}")
    monkeypatch.setenv("CERTIFICADOS_MEDIA_DIR", str(media_dir))
    monkeypatch.setenv("TEMPLATES_MEDIA_DIR", str(tmp_path / "templates"))
    monkeypatch.setenv("APP_ENV", "development")
    monkeypatch.setenv("PUBLIC_VALIDATION_BASE_URL", "http://testserver/validar")
    monkeypatch.setenv("SESSION_SECRET", "teste-session-secret-1234567890")
    monkeypatch.setenv("CERTIFICATE_HASH_SECRET", "teste-cert-hash-secret-1234567890")
    monkeypatch.setenv("CORS_ALLOW_ORIGINS", "http://testserver")
    monkeypatch.setenv("ENABLE_ADMIN_DOCS", "true")
    monkeypatch.setenv("TRUST_PROXY_HEADERS", "false")
    monkeypatch.setenv("AUTO_SEED_SECRETARIAS", "false")
    monkeypatch.setenv("AUTO_BOOTSTRAP_ADMIN", "false")

    modules = load_app_modules()
    modules.database.Base.metadata.drop_all(bind=modules.database.engine)
    modules.migrations.ensure_database_schema()

    try:
        yield SimpleNamespace(
            api_dir=API_DIR,
            media_dir=media_dir,
            database_path=database_path,
            database=modules.database,
            models=modules.models,
            security=modules.security,
            migrations=modules.migrations,
            main=modules.main,
        )
    finally:
        close_all_sessions()
        modules.database.engine.dispose()


@pytest.fixture()
def client(app_ctx):
    with CsrfTestClient(app_ctx.main.app) as test_client:
        yield test_client


@pytest.fixture()
def seed_data(app_ctx):
    db = app_ctx.database.SessionLocal()
    try:
        seafi = app_ctx.models.Secretaria(
            sigla="SEAFI",
            nome="Secretaria de Administracao e Financas",
            email_resposta="seafi@amargosa.ba.gov.br",
            ativa=True,
        )
        semed = app_ctx.models.Secretaria(
            sigla="SEMED",
            nome="Secretaria de Educacao",
            email_resposta="semed@amargosa.ba.gov.br",
            ativa=True,
        )
        admin = app_ctx.models.Usuario(
            nome="Administrador Local",
            username="admin",
            senha_hash=app_ctx.security.hash_password("admin12345"),
            papel=app_ctx.main.ROLE_ADMIN_GLOBAL,
            ativo=True,
        )
        operador = app_ctx.models.Usuario(
            nome="Operador Teste",
            username="operador",
            senha_hash=app_ctx.security.hash_password("operador123"),
            papel="operador",
            ativo=True,
        )
        operador.secretarias = [seafi]

        db.add_all([seafi, semed, admin, operador])
        db.flush()
        db.add_all(
            [
                app_ctx.models.SecretariaReplyEmail(
                    secretaria_id=seafi.id,
                    nome="Email principal",
                    email="seafi@amargosa.ba.gov.br",
                    ativo=True,
                    padrao=True,
                ),
                app_ctx.models.SecretariaReplyEmail(
                    secretaria_id=semed.id,
                    nome="Email principal",
                    email="semed@amargosa.ba.gov.br",
                    ativo=True,
                    padrao=True,
                ),
            ]
        )
        db.commit()
        db.refresh(seafi)
        db.refresh(semed)
        db.refresh(admin)
        db.refresh(operador)

        yield {
            "admin_id": admin.id,
            "operador_id": operador.id,
            "seafi_id": seafi.id,
            "semed_id": semed.id,
            "admin_password": "admin12345",
            "operador_password": "operador123",
        }
    finally:
        db.close()


@pytest.fixture()
def login(client):
    def _login(username: str, password: str):
        return client.post(
            "/api/auth/login",
            json={"username": username, "password": password},
        )

    return _login
