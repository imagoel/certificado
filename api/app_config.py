import os
import re
from pathlib import Path

from security import DEFAULT_DEV_CERTIFICATE_HASH_SECRET, get_certificate_hash_secret


BASE_DIR = Path(__file__).resolve().parent

CODE_REGEX = re.compile(r"^[A-Z0-9]{1,8}-\d{4}-\d{5}$")
DEFAULT_PREFIX = os.getenv("CODE_PREFIX", "ABC")

DEFAULT_MEDIA_DIR = str(BASE_DIR / "data" / "certificados")
CERTIFICADOS_MEDIA_DIR = Path(os.getenv("CERTIFICADOS_MEDIA_DIR", DEFAULT_MEDIA_DIR)).resolve()
MAX_UPLOAD_BYTES = int(os.getenv("CERTIFICADOS_MAX_UPLOAD_BYTES", "8388608"))
CERTIFICATE_TRASH_RETENTION_DAYS = max(
    1,
    int(os.getenv("CERTIFICATE_TRASH_RETENTION_DAYS", "30")),
)

DEFAULT_TEMPLATES_MEDIA_DIR = str(BASE_DIR / "data" / "templates")
TEMPLATES_MEDIA_DIR = Path(
    os.getenv("TEMPLATES_MEDIA_DIR", DEFAULT_TEMPLATES_MEDIA_DIR)
).resolve()
MAX_TEMPLATE_UPLOAD_BYTES = int(os.getenv("TEMPLATES_MAX_UPLOAD_BYTES", "10485760"))
MAX_IMAGE_PIXELS = max(1, int(os.getenv("MAX_IMAGE_PIXELS", "25000000")))

APP_ENV = (os.getenv("APP_ENV", "development").strip().lower() or "development")
IS_PRODUCTION = APP_ENV in {"prod", "production"}

SESSION_SECRET = os.getenv("SESSION_SECRET", "troque-esta-chave-de-sessao")
CERTIFICATE_HASH_SECRET = get_certificate_hash_secret()
SESSION_COOKIE_NAME = os.getenv("SESSION_COOKIE_NAME", "certificado_session").strip() or "certificado_session"
SESSION_SAME_SITE = (os.getenv("SESSION_SAME_SITE", "lax").strip().lower() or "lax")
if SESSION_SAME_SITE not in {"lax", "strict", "none"}:
    SESSION_SAME_SITE = "lax"
SESSION_HTTPS_ONLY = os.getenv("SESSION_HTTPS_ONLY", "false").strip().lower() in {
    "1",
    "true",
    "yes",
    "on",
}
SESSION_MAX_AGE_SECONDS = int(os.getenv("SESSION_MAX_AGE_SECONDS", "43200"))

ENABLE_ADMIN_DOCS = os.getenv("ENABLE_ADMIN_DOCS", "true").strip().lower() in {
    "1",
    "true",
    "yes",
    "on",
}
TRUST_PROXY_HEADERS = os.getenv("TRUST_PROXY_HEADERS", "false").strip().lower() in {
    "1",
    "true",
    "yes",
    "on",
}

LOGIN_MAX_ATTEMPTS = max(1, int(os.getenv("LOGIN_MAX_ATTEMPTS", "5")))
LOGIN_WINDOW_SECONDS = max(60, int(os.getenv("LOGIN_WINDOW_SECONDS", "900")))
LOGIN_BLOCK_SECONDS = max(60, int(os.getenv("LOGIN_BLOCK_SECONDS", "900")))

ROLE_ADMIN_GLOBAL = "admin_global"
DEFAULT_DEV_SESSION_SECRET = "troque-esta-chave-de-sessao"


def resolve_allowed_origins() -> list[str]:
    raw = os.getenv("CORS_ALLOW_ORIGINS", "").strip()
    default_origins = [
        "http://localhost:28754",
        "http://127.0.0.1:28754",
    ]

    if not raw or raw == "*":
        return default_origins

    origins = [origin.strip() for origin in raw.split(",") if origin.strip()]
    if "*" in origins:
        return default_origins

    return origins


def validate_security_config() -> None:
    if not IS_PRODUCTION:
        return

    if SESSION_SECRET == DEFAULT_DEV_SESSION_SECRET or len(SESSION_SECRET) < 24:
        raise RuntimeError(
            "SESSION_SECRET inseguro para producao. Configure uma chave longa e exclusiva."
        )

    if (
        CERTIFICATE_HASH_SECRET == DEFAULT_DEV_CERTIFICATE_HASH_SECRET
        or len(CERTIFICATE_HASH_SECRET) < 24
    ):
        raise RuntimeError(
            "CERTIFICATE_HASH_SECRET inseguro para producao. Configure uma chave longa e exclusiva."
        )

    if not SESSION_HTTPS_ONLY:
        raise RuntimeError("SESSION_HTTPS_ONLY deve estar como true em producao.")

    cors_raw = os.getenv("CORS_ALLOW_ORIGINS", "").strip()
    if not cors_raw:
        raise RuntimeError(
            "CORS_ALLOW_ORIGINS deve ser configurado explicitamente em producao."
        )
    if "*" in cors_raw:
        raise RuntimeError("CORS_ALLOW_ORIGINS nao pode usar curinga em producao.")
