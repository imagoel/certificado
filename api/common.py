import json
import os
import re
import secrets
import time
from datetime import datetime, timedelta, timezone
from io import BytesIO
from pathlib import Path
from threading import Lock
from uuid import uuid4

from fastapi import Depends, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse
from fastapi.templating import Jinja2Templates
from PIL import Image, UnidentifiedImageError
from sqlalchemy.orm import Session, object_session

from bootstrap import run_startup_bootstrap
from database import SessionLocal, get_db
from migrations import ensure_database_schema
from models import (
    AuditEvent,
    Certificate,
    CertificateEmailAttempt,
    CertificateLayoutPreset,
    CertificateTemplate,
    Secretaria,
    SecretariaAsset,
    SecretariaReplyEmail,
    Usuario,
)
from schemas import (
    AuditEventResponse,
    CertificateLayoutPresetResponse,
    CertificateResponse,
    CertificateTemplateResponse,
    SecretariaAssetResponse,
    SecretariaReplyEmailResponse,
    SecretariaResponse,
    SessionRuntimeConfigResponse,
    SessionResponse,
    UserAdminResponse,
    UserSessionResponse,
)
from security import (
    DEFAULT_DEV_CERTIFICATE_HASH_SECRET,
    get_certificate_hash_secret,
)


CODE_REGEX = re.compile(r"^[A-Z0-9]{1,8}-\d{4}-\d{5}$")
DEFAULT_PREFIX = os.getenv("CODE_PREFIX", "ABC")
DEFAULT_MEDIA_DIR = str((Path(__file__).resolve().parent / "data" / "certificados"))
CERTIFICADOS_MEDIA_DIR = Path(os.getenv("CERTIFICADOS_MEDIA_DIR", DEFAULT_MEDIA_DIR)).resolve()
MAX_UPLOAD_BYTES = int(os.getenv("CERTIFICADOS_MAX_UPLOAD_BYTES", "8388608"))
CERTIFICATE_TRASH_RETENTION_DAYS = max(
    1,
    int(os.getenv("CERTIFICATE_TRASH_RETENTION_DAYS", "30")),
)
DEFAULT_TEMPLATES_MEDIA_DIR = str((Path(__file__).resolve().parent / "data" / "templates"))
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

BASE_DIR = Path(__file__).resolve().parent
Image.MAX_IMAGE_PIXELS = MAX_IMAGE_PIXELS

if SESSION_SAME_SITE not in {"lax", "strict", "none"}:
    SESSION_SAME_SITE = "lax"


templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

LOGIN_ATTEMPTS_LOCK = Lock()
LOGIN_ATTEMPTS: dict[str, dict[str, float | int]] = {}


def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


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


def get_request_ip(request: Request) -> str:
    if TRUST_PROXY_HEADERS:
        forwarded = request.headers.get("x-forwarded-for", "").strip()
        if forwarded:
            return forwarded.split(",")[0].strip()

    client = request.client
    return client.host if client else "desconhecido"


def build_login_attempt_key(username: str, request: Request) -> str:
    return f"{username}|{get_request_ip(request)}"


def get_login_block_remaining_seconds(username: str, request: Request) -> int:
    key = build_login_attempt_key(username, request)
    now = time.time()

    with LOGIN_ATTEMPTS_LOCK:
        data = LOGIN_ATTEMPTS.get(key)
        if not data:
            return 0

        blocked_until = float(data.get("blocked_until", 0.0))
        if blocked_until <= now:
            return 0

        return max(1, int(blocked_until - now))


def register_failed_login_attempt(username: str, request: Request) -> int:
    key = build_login_attempt_key(username, request)
    now = time.time()

    with LOGIN_ATTEMPTS_LOCK:
        data = LOGIN_ATTEMPTS.get(key)
        if not data or float(data.get("window_started_at", 0.0)) + LOGIN_WINDOW_SECONDS < now:
            data = {
                "count": 0,
                "window_started_at": now,
                "blocked_until": 0.0,
            }

        data["count"] = int(data.get("count", 0)) + 1

        if int(data["count"]) >= LOGIN_MAX_ATTEMPTS:
            data["blocked_until"] = now + LOGIN_BLOCK_SECONDS
            data["count"] = 0
            data["window_started_at"] = now

        LOGIN_ATTEMPTS[key] = data
        blocked_until = float(data.get("blocked_until", 0.0))
        if blocked_until > now:
            return max(1, int(blocked_until - now))
        return 0


def clear_login_attempts(username: str, request: Request) -> None:
    key = build_login_attempt_key(username, request)
    with LOGIN_ATTEMPTS_LOCK:
        LOGIN_ATTEMPTS.pop(key, None)


def clear_all_login_attempts_for_username(username: str) -> None:
    normalized = (username or "").strip().lower()
    if not normalized:
        return

    prefix = f"{normalized}|"
    with LOGIN_ATTEMPTS_LOCK:
        keys_to_remove = [key for key in LOGIN_ATTEMPTS if key.startswith(prefix)]
        for key in keys_to_remove:
            LOGIN_ATTEMPTS.pop(key, None)


def ensure_csrf_token(request: Request) -> str:
    token = request.session.get("csrf_token")
    if not token:
        token = secrets.token_urlsafe(32)
        request.session["csrf_token"] = token
    return token


def require_csrf_protection(request: Request) -> None:
    if request.method.upper() in {"GET", "HEAD", "OPTIONS"}:
        return

    if request.url.path == "/api/auth/login":
        return

    if request.url.path.startswith("/api/formularios/publico/"):
        return

    if not request.session.get("user_id"):
        return

    expected_token = request.session.get("csrf_token")
    received_token = request.headers.get("x-csrf-token", "")
    if not expected_token or not received_token:
        raise HTTPException(status_code=403, detail="Token de seguranca ausente.")

    if not secrets.compare_digest(str(expected_token), received_token):
        raise HTTPException(status_code=403, detail="Token de seguranca invalido.")


def run_startup_tasks() -> None:
    validate_security_config()
    ensure_database_schema()
    CERTIFICADOS_MEDIA_DIR.mkdir(parents=True, exist_ok=True)
    TEMPLATES_MEDIA_DIR.mkdir(parents=True, exist_ok=True)
    db = SessionLocal()
    try:
        messages = run_startup_bootstrap(db)
        purged_count = purge_expired_deleted_certificates(db)
        if messages or purged_count:
            db.commit()
            for message in messages:
                print(message)
    finally:
        db.close()


def normalize_prefix(prefix: str | None) -> str:
    raw = (prefix or DEFAULT_PREFIX).strip().upper()
    clean = re.sub(r"[^A-Z0-9]", "", raw)
    return clean or "ABC"


def build_code(prefix: str, year: int, seq: int) -> str:
    return f"{prefix}-{year}-{seq:05d}"


def build_validation_url(request: Request, codigo: str) -> str:
    base_url = os.getenv("PUBLIC_VALIDATION_BASE_URL", "").strip().rstrip("/")
    if base_url:
        return f"{base_url}/{codigo}"
    return str(request.url_for("validar_html", codigo=codigo))


def sanitize_code(codigo: str) -> str:
    return (codigo or "").strip().upper()


def build_file_relative_path(codigo: str) -> str:
    normalized = sanitize_code(codigo)
    year = utc_now().year
    parts = normalized.split("-")
    if len(parts) >= 2 and parts[1].isdigit():
        year = int(parts[1])
    return f"{year}/{normalized}.png"


def sanitize_template_name(value: str, fallback: str = "molde") -> str:
    normalized = re.sub(r"[^a-z0-9]+", "-", (value or "").strip().lower())
    normalized = normalized.strip("-")
    return normalized or fallback


def build_template_relative_path(secretaria_sigla: str, template_name: str, filename: str) -> str:
    suffix = Path(filename or "").suffix.lower()
    if suffix not in {".png", ".jpg", ".jpeg", ".webp"}:
        suffix = ".png"
    folder = normalize_secretaria_sigla(secretaria_sigla) or "SECRETARIA"
    base_name = sanitize_template_name(template_name)
    unique_suffix = uuid4().hex[:10]
    return f"{folder}/{base_name}-{unique_suffix}{suffix}"


def normalize_secretaria_asset_type(value: str | None) -> str:
    normalized = (value or "").strip().lower()
    if normalized not in {"logo", "assinatura", "instituicao", "selo"}:
        raise HTTPException(
            status_code=422,
            detail="Tipo de asset invalido. Use logo, assinatura, instituicao ou selo.",
        )
    return normalized


def build_secretaria_asset_relative_path(
    secretaria_sigla: str,
    asset_type: str,
    asset_name: str,
    filename: str,
) -> str:
    suffix = Path(filename or "").suffix.lower()
    if suffix not in {".png", ".jpg", ".jpeg", ".webp"}:
        suffix = ".png"
    folder = normalize_secretaria_sigla(secretaria_sigla) or "SECRETARIA"
    type_folder = normalize_secretaria_asset_type(asset_type)
    base_name = sanitize_template_name(asset_name, type_folder)
    unique_suffix = uuid4().hex[:10]
    return f"{folder}/{type_folder}/{base_name}-{unique_suffix}{suffix}"


def resolve_media_path(relative_path: str) -> Path:
    candidate = (CERTIFICADOS_MEDIA_DIR / relative_path).resolve()
    if not str(candidate).startswith(str(CERTIFICADOS_MEDIA_DIR)):
        raise HTTPException(status_code=400, detail="Caminho de arquivo invalido.")
    return candidate


class CertificatePngReplacement:
    def __init__(
        self,
        *,
        relative_path: str,
        final_path: Path,
        temp_path: Path,
        backup_path: Path | None,
        old_path: Path | None,
    ) -> None:
        self.relative_path = relative_path
        self.final_path = final_path
        self.temp_path = temp_path
        self.backup_path = backup_path
        self.old_path = old_path

    def rollback(self) -> None:
        if self.temp_path.exists():
            self.temp_path.unlink(missing_ok=True)

        if self.final_path.exists():
            self.final_path.unlink(missing_ok=True)

        if self.backup_path and self.backup_path.exists():
            self.backup_path.replace(self.final_path)

    def commit(self) -> None:
        try:
            if self.backup_path and self.backup_path.exists():
                self.backup_path.unlink(missing_ok=True)

            if (
                self.old_path
                and self.old_path != self.final_path
                and self.old_path.exists()
                and self.old_path.is_file()
            ):
                self.old_path.unlink(missing_ok=True)
        except OSError:
            pass


def parse_render_snapshot_payload(raw_value: str | dict | None) -> dict | None:
    if raw_value is None:
        return None

    if isinstance(raw_value, dict):
        return raw_value

    raw_text = str(raw_value).strip()
    if not raw_text:
        return None

    try:
        payload = json.loads(raw_text)
    except json.JSONDecodeError as error:
        raise HTTPException(status_code=422, detail="Snapshot de renderizacao invalido.") from error

    if not isinstance(payload, dict):
        raise HTTPException(status_code=422, detail="Snapshot de renderizacao deve ser um objeto.")

    return payload


def verify_uploaded_image_content(
    content: bytes,
    *,
    allowed_formats: set[str],
    invalid_detail: str,
) -> str:
    try:
        with Image.open(BytesIO(content)) as image:
            image_format = (image.format or "").upper()
            width, height = image.size
            total_pixels = width * height

            if image_format not in allowed_formats:
                raise HTTPException(status_code=415, detail=invalid_detail)
            if width <= 0 or height <= 0:
                raise HTTPException(status_code=415, detail=invalid_detail)
            if total_pixels > MAX_IMAGE_PIXELS:
                raise HTTPException(
                    status_code=413,
                    detail=(
                        "Imagem muito grande em dimensoes. "
                        f"Limite atual: {MAX_IMAGE_PIXELS} pixels."
                    ),
                )

            image.verify()
            return image_format
    except HTTPException:
        raise
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise HTTPException(status_code=415, detail=invalid_detail) from exc


def replace_certificate_png_safely(cert: Certificate, content: bytes) -> CertificatePngReplacement:
    relative_path = build_file_relative_path(cert.codigo).replace("\\", "/")
    final_path = resolve_media_path(relative_path)
    final_path.parent.mkdir(parents=True, exist_ok=True)

    old_path = None
    if cert.arquivo_relpath:
        try:
            old_path = resolve_media_path(cert.arquivo_relpath)
        except HTTPException:
            old_path = None

    temp_path = final_path.with_name(f".{final_path.name}.{uuid4().hex}.tmp")
    backup_path = final_path.with_name(f".{final_path.name}.{uuid4().hex}.bak")
    active_backup_path = None

    try:
        temp_path.write_bytes(content)
        if final_path.exists():
            final_path.replace(backup_path)
            active_backup_path = backup_path
        temp_path.replace(final_path)
    except OSError as error:
        temp_path.unlink(missing_ok=True)
        if active_backup_path and active_backup_path.exists():
            if final_path.exists():
                final_path.unlink(missing_ok=True)
            active_backup_path.replace(final_path)
        raise HTTPException(
            status_code=500,
            detail=f"Nao foi possivel substituir o PNG do certificado: {error}",
        ) from error

    return CertificatePngReplacement(
        relative_path=relative_path,
        final_path=final_path,
        temp_path=temp_path,
        backup_path=active_backup_path,
        old_path=old_path,
    )


def resolve_template_media_path(relative_path: str) -> Path:
    candidate = (TEMPLATES_MEDIA_DIR / relative_path).resolve()
    if not str(candidate).startswith(str(TEMPLATES_MEDIA_DIR)):
        raise HTTPException(status_code=400, detail="Caminho de arquivo de molde invalido.")
    return candidate


def has_certificate_file(cert: Certificate) -> bool:
    if not cert.arquivo_relpath:
        return False
    try:
        file_path = resolve_media_path(cert.arquivo_relpath)
    except HTTPException:
        return False
    return file_path.exists() and file_path.is_file()


def is_certificate_deleted(cert: Certificate) -> bool:
    return bool(cert.excluido_em)


def is_certificate_ready(cert: Certificate) -> bool:
    return not bool(cert.arquivo_pendente) and not is_certificate_deleted(cert) and has_certificate_file(cert)


def build_certificate_trash_expiration(deleted_at: datetime) -> datetime:
    return deleted_at + timedelta(days=CERTIFICATE_TRASH_RETENTION_DAYS)


def build_route_path(request: Request, route_name: str, **params) -> str:
    return str(request.app.url_path_for(route_name, **params))


def build_certificate_file_url(request: Request, codigo: str) -> str:
    return build_route_path(request, "get_certificate_file", codigo=sanitize_code(codigo))


def build_template_file_url(request: Request, template_id: int) -> str:
    return build_route_path(request, "get_template_file", template_id=str(template_id))


def build_secretaria_asset_file_url(request: Request, asset_id: int) -> str:
    return build_route_path(request, "get_secretaria_asset_file", asset_id=str(asset_id))


def build_secretaria_response(secretaria: Secretaria) -> SecretariaResponse:
    return SecretariaResponse(
        id=secretaria.id,
        sigla=secretaria.sigla,
        nome=secretaria.nome,
        email_resposta=secretaria.email_resposta,
        reply_emails=[
            build_secretaria_reply_email_response(reply_email)
            for reply_email in sorted(
                secretaria.reply_emails,
                key=lambda item: (not item.padrao, not item.ativo, item.nome.lower(), item.id),
            )
        ],
        ativa=secretaria.ativa,
    )


def build_secretaria_reply_email_response(
    reply_email: SecretariaReplyEmail,
) -> SecretariaReplyEmailResponse:
    return SecretariaReplyEmailResponse(
        id=reply_email.id,
        secretaria_id=reply_email.secretaria_id,
        nome=reply_email.nome,
        email=reply_email.email,
        ativo=reply_email.ativo,
        padrao=reply_email.padrao,
        criado_em=reply_email.criado_em,
    )


def get_default_secretaria_reply_email(
    db: Session,
    secretaria: Secretaria,
) -> SecretariaReplyEmail | None:
    default_reply = (
        db.query(SecretariaReplyEmail)
        .filter(
            SecretariaReplyEmail.secretaria_id == secretaria.id,
            SecretariaReplyEmail.ativo.is_(True),
            SecretariaReplyEmail.padrao.is_(True),
        )
        .order_by(SecretariaReplyEmail.nome.asc(), SecretariaReplyEmail.id.asc())
        .first()
    )
    if default_reply:
        return default_reply

    return (
        db.query(SecretariaReplyEmail)
        .filter(
            SecretariaReplyEmail.secretaria_id == secretaria.id,
            SecretariaReplyEmail.ativo.is_(True),
        )
        .order_by(SecretariaReplyEmail.nome.asc(), SecretariaReplyEmail.id.asc())
        .first()
    )


def normalize_secretaria_reply_defaults(db: Session, secretaria: Secretaria) -> None:
    active_replies = (
        db.query(SecretariaReplyEmail)
        .filter(
            SecretariaReplyEmail.secretaria_id == secretaria.id,
            SecretariaReplyEmail.ativo.is_(True),
        )
        .order_by(SecretariaReplyEmail.padrao.desc(), SecretariaReplyEmail.nome.asc())
        .all()
    )
    if not active_replies:
        secretaria.email_resposta = None
        return

    default_reply = next((reply for reply in active_replies if reply.padrao), active_replies[0])
    for reply in active_replies:
        reply.padrao = reply.id == default_reply.id

    inactive_replies = (
        db.query(SecretariaReplyEmail)
        .filter(
            SecretariaReplyEmail.secretaria_id == secretaria.id,
            SecretariaReplyEmail.ativo.is_(False),
        )
        .all()
    )
    for reply in inactive_replies:
        reply.padrao = False

    secretaria.email_resposta = default_reply.email


def resolve_secretaria_reply_choice(
    db: Session,
    secretaria: Secretaria,
    reply_email_id: int | None = None,
) -> tuple[int | None, str | None, str | None]:
    if reply_email_id:
        selected = (
            db.query(SecretariaReplyEmail)
            .filter(
                SecretariaReplyEmail.id == reply_email_id,
                SecretariaReplyEmail.secretaria_id == secretaria.id,
                SecretariaReplyEmail.ativo.is_(True),
            )
            .first()
        )
        if not selected:
            raise HTTPException(
                status_code=422,
                detail="Email de resposta selecionado nao pertence a secretaria ativa.",
            )
        return selected.id, selected.nome, selected.email

    default_reply = get_default_secretaria_reply_email(db, secretaria)
    if default_reply:
        return default_reply.id, default_reply.nome, default_reply.email

    if secretaria.email_resposta:
        return None, "Email principal", secretaria.email_resposta

    return None, None, None


def ensure_secretaria_has_reply_to(db: Session, secretaria: Secretaria) -> None:
    if not secretaria.ativa:
        return
    if secretaria.email_resposta:
        return
    if get_default_secretaria_reply_email(db, secretaria):
        return
    raise HTTPException(
        status_code=422,
        detail="Email de resposta e obrigatorio para secretaria ativa.",
    )


def sync_secretaria_reply_from_legacy_email(db: Session, secretaria: Secretaria) -> None:
    if not secretaria.email_resposta:
        normalize_secretaria_reply_defaults(db, secretaria)
        return

    reply = (
        db.query(SecretariaReplyEmail)
        .filter(
            SecretariaReplyEmail.secretaria_id == secretaria.id,
            SecretariaReplyEmail.email == secretaria.email_resposta,
        )
        .first()
    )
    if not reply:
        reply = SecretariaReplyEmail(
            secretaria_id=secretaria.id,
            nome="Email principal",
            email=secretaria.email_resposta,
            ativo=True,
            padrao=True,
        )
        db.add(reply)
        db.flush()
    else:
        reply.ativo = True
        reply.padrao = True
        if not reply.nome:
            reply.nome = "Email principal"

    db.query(SecretariaReplyEmail).filter(
        SecretariaReplyEmail.secretaria_id == secretaria.id,
        SecretariaReplyEmail.id != reply.id,
    ).update(
        {SecretariaReplyEmail.padrao: False},
        synchronize_session=False,
    )
    normalize_secretaria_reply_defaults(db, secretaria)


def build_template_response(
    template: CertificateTemplate,
    request: Request,
) -> CertificateTemplateResponse:
    return CertificateTemplateResponse(
        id=template.id,
        secretaria_id=template.secretaria_id,
        secretaria_sigla=template.secretaria.sigla if template.secretaria else None,
        secretaria_nome=template.secretaria.nome if template.secretaria else None,
        nome=template.nome,
        ativo=template.ativo,
        padrao=template.padrao,
        ocultar_titulo_certificado=template.ocultar_titulo_certificado,
        ordem=template.ordem,
        arquivo_url=build_template_file_url(request, template.id),
        criado_em=template.criado_em,
        criado_por_usuario_id=template.criado_por_usuario_id,
        criado_por_username=template.criado_por.username if template.criado_por else None,
    )


def build_secretaria_asset_response(
    asset: SecretariaAsset,
    request: Request,
) -> SecretariaAssetResponse:
    return SecretariaAssetResponse(
        id=asset.id,
        secretaria_id=asset.secretaria_id,
        secretaria_sigla=asset.secretaria.sigla if asset.secretaria else None,
        secretaria_nome=asset.secretaria.nome if asset.secretaria else None,
        tipo=asset.tipo,
        nome=asset.nome,
        ativo=asset.ativo,
        padrao=asset.padrao,
        ordem=asset.ordem,
        arquivo_url=build_secretaria_asset_file_url(request, asset.id),
        criado_em=asset.criado_em,
        criado_por_usuario_id=asset.criado_por_usuario_id,
        criado_por_username=asset.criado_por.username if asset.criado_por else None,
    )


def build_layout_preset_response(preset: CertificateLayoutPreset) -> CertificateLayoutPresetResponse:
    return CertificateLayoutPresetResponse(
        id=preset.id,
        secretaria_id=preset.secretaria_id,
        secretaria_sigla=preset.secretaria.sigla if preset.secretaria else None,
        secretaria_nome=preset.secretaria.nome if preset.secretaria else None,
        nome=preset.nome,
        payload=preset.payload or {},
        criado_em=preset.criado_em,
        atualizado_em=preset.atualizado_em,
        criado_por_usuario_id=preset.criado_por_usuario_id,
        criado_por_username=preset.criado_por.username if preset.criado_por else None,
    )


def build_user_session_response(usuario: Usuario) -> UserSessionResponse:
    return UserSessionResponse(
        id=usuario.id,
        nome=usuario.nome,
        username=usuario.username,
        papel=usuario.papel,
    )


def build_user_admin_response(usuario: Usuario) -> UserAdminResponse:
    secretarias = sorted(usuario.secretarias, key=lambda item: item.sigla)
    return UserAdminResponse(
        id=usuario.id,
        nome=usuario.nome,
        username=usuario.username,
        papel=usuario.papel,
        ativo=usuario.ativo,
        ultimo_login_em=usuario.ultimo_login_em,
        criado_em=usuario.criado_em,
        secretarias=[build_secretaria_response(secretaria) for secretaria in secretarias],
    )


def build_audit_response(event: AuditEvent) -> AuditEventResponse:
    return AuditEventResponse(
        id=event.id,
        evento=event.evento,
        descricao=event.descricao,
        criado_em=event.criado_em,
        entidade_tipo=event.entidade_tipo,
        entidade_id=event.entidade_id,
        usuario_id=event.usuario_id,
        usuario_nome=event.usuario.nome if event.usuario else None,
        usuario_username=event.usuario.username if event.usuario else None,
        secretaria_id=event.secretaria_id,
        secretaria_sigla=event.secretaria.sigla if event.secretaria else None,
        certificado_id=event.certificado_id,
        certificado_codigo=(
            event.certificado.codigo
            if event.certificado
            else event.certificado_codigo_snapshot
        ),
    )


def is_admin(usuario: Usuario) -> bool:
    return usuario.papel == ROLE_ADMIN_GLOBAL


def normalize_secretaria_sigla(value: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", (value or "").strip().upper())


def build_internal_certificate_file_url(request: Request, codigo: str) -> str:
    return build_route_path(
        request,
        "get_certificate_file_internal",
        codigo=sanitize_code(codigo),
    )


def get_accessible_secretarias(db: Session, usuario: Usuario) -> list[Secretaria]:
    if is_admin(usuario):
        return (
            db.query(Secretaria)
            .filter(Secretaria.ativa.is_(True))
            .order_by(Secretaria.sigla.asc())
            .all()
        )

    return sorted(
        [secretaria for secretaria in usuario.secretarias if secretaria.ativa],
        key=lambda item: item.sigla,
    )


def resolve_active_secretaria(
    request: Request, db: Session, usuario: Usuario
) -> tuple[Secretaria | None, list[Secretaria]]:
    secretarias = get_accessible_secretarias(db, usuario)
    if not secretarias:
        request.session.pop("secretaria_id", None)
        return None, []

    current_secretaria_id = request.session.get("secretaria_id")
    active = next(
        (secretaria for secretaria in secretarias if secretaria.id == current_secretaria_id),
        None,
    )
    if active:
        return active, secretarias

    active = secretarias[0]
    request.session["secretaria_id"] = active.id
    return active, secretarias


def build_session_response(request: Request, db: Session, usuario: Usuario) -> SessionResponse:
    secretaria_ativa, secretarias = resolve_active_secretaria(request, db, usuario)
    return SessionResponse(
        autenticado=True,
        usuario=build_user_session_response(usuario),
        secretarias=[build_secretaria_response(secretaria) for secretaria in secretarias],
        secretaria_ativa_id=secretaria_ativa.id if secretaria_ativa else None,
        csrf_token=ensure_csrf_token(request),
        configuracoes=SessionRuntimeConfigResponse(
            certificados_max_upload_bytes=MAX_UPLOAD_BYTES,
            certificados_max_batch_items=max(
                1, int(os.getenv("CERTIFICADOS_MAX_BATCH_ITEMS", "800"))
            ),
            templates_max_upload_bytes=MAX_TEMPLATE_UPLOAD_BYTES,
        ),
    )


def get_current_user(request: Request, db: Session = Depends(get_db)) -> Usuario:
    user_id = request.session.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Autenticacao necessaria.")

    usuario = db.query(Usuario).filter(Usuario.id == int(user_id)).first()
    if not usuario or not usuario.ativo:
        request.session.clear()
        raise HTTPException(status_code=401, detail="Sessao invalida. Faca login novamente.")

    return usuario


def require_admin_user(usuario: Usuario = Depends(get_current_user)) -> Usuario:
    if not is_admin(usuario):
        raise HTTPException(status_code=403, detail="Acesso restrito ao administrador.")
    return usuario


def require_active_secretaria(
    request: Request,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> Secretaria:
    secretaria_ativa, _secretarias = resolve_active_secretaria(request, db, usuario)
    if not secretaria_ativa:
        raise HTTPException(
            status_code=403,
            detail="Nenhuma secretaria vinculada ao usuario.",
        )
    return secretaria_ativa


def ensure_certificate_access(db: Session, usuario: Usuario, cert: Certificate) -> None:
    if is_admin(usuario):
        return

    allowed_secretaria_ids = {secretaria.id for secretaria in get_accessible_secretarias(db, usuario)}
    if cert.secretaria_id is None or cert.secretaria_id not in allowed_secretaria_ids:
        raise HTTPException(status_code=403, detail="Acesso negado a este certificado.")


def ensure_template_access(db: Session, usuario: Usuario, template: CertificateTemplate) -> None:
    if is_admin(usuario):
        return

    allowed_secretaria_ids = {secretaria.id for secretaria in get_accessible_secretarias(db, usuario)}
    if template.secretaria_id not in allowed_secretaria_ids:
        raise HTTPException(status_code=403, detail="Acesso negado a este molde.")


def ensure_secretaria_asset_access(db: Session, usuario: Usuario, asset: SecretariaAsset) -> None:
    if is_admin(usuario):
        return

    allowed_secretaria_ids = {secretaria.id for secretaria in get_accessible_secretarias(db, usuario)}
    if asset.secretaria_id not in allowed_secretaria_ids:
        raise HTTPException(status_code=403, detail="Acesso negado a este asset da secretaria.")


def get_secretarias_by_ids(db: Session, secretaria_ids: list[int]) -> list[Secretaria]:
    unique_ids = sorted({int(secretaria_id) for secretaria_id in secretaria_ids if secretaria_id})
    if not unique_ids:
        return []

    secretarias = (
        db.query(Secretaria)
        .filter(Secretaria.id.in_(unique_ids))
        .order_by(Secretaria.sigla.asc())
        .all()
    )
    if len(secretarias) != len(unique_ids):
        raise HTTPException(status_code=422, detail="Uma ou mais secretarias informadas nao existem.")
    return secretarias


def validate_role_and_secretarias(papel: str, secretarias: list[Secretaria]) -> None:
    normalized_role = (papel or "").strip().lower()
    if normalized_role not in {"admin_global", "operador"}:
        raise HTTPException(status_code=422, detail="Papel invalido. Use admin_global ou operador.")

    if normalized_role != ROLE_ADMIN_GLOBAL and not secretarias:
        raise HTTPException(
            status_code=422,
            detail="Usuarios operadores precisam ter pelo menos uma secretaria vinculada.",
        )

    if normalized_role != ROLE_ADMIN_GLOBAL:
        inactive_secretarias = [secretaria.sigla for secretaria in secretarias if not secretaria.ativa]
        if inactive_secretarias:
            raise HTTPException(
                status_code=422,
                detail=(
                    "Usuarios operadores so podem ser vinculados a secretarias ativas. "
                    f"Remova: {', '.join(inactive_secretarias)}."
                ),
            )


def record_audit_event(
    db: Session,
    *,
    evento: str,
    descricao: str | None = None,
    usuario: Usuario | None = None,
    secretaria: Secretaria | None = None,
    certificado: Certificate | None = None,
    certificado_codigo: str | None = None,
    entidade_tipo: str | None = None,
    entidade_id: int | None = None,
) -> AuditEvent:
    audit = AuditEvent(
        evento=evento,
        descricao=descricao,
        usuario_id=usuario.id if usuario else None,
        secretaria_id=secretaria.id if secretaria else None,
        certificado_id=certificado.id if certificado else None,
        certificado_codigo_snapshot=(
            certificado.codigo if certificado else sanitize_code(certificado_codigo or "")
        )
        or None,
        entidade_tipo=entidade_tipo,
        entidade_id=entidade_id,
    )
    db.add(audit)
    return audit


def delete_certificate_permanently(
    db: Session,
    cert: Certificate,
    *,
    usuario: Usuario | None = None,
    evento: str = "certificado_exclusao_definitiva",
    descricao: str | None = None,
    record_event: bool = True,
) -> None:
    cert_id = cert.id
    cert_code = cert.codigo
    cert_secretaria = cert.secretaria

    if cert.arquivo_relpath:
        try:
            file_path = resolve_media_path(cert.arquivo_relpath)
        except HTTPException:
            file_path = None
        if file_path and file_path.exists():
            try:
                file_path.unlink()
            except OSError as error:
                raise HTTPException(
                    status_code=500,
                    detail=f"Nao foi possivel remover o arquivo do certificado: {error}",
                ) from error

    db.query(AuditEvent).filter(AuditEvent.certificado_id == cert_id).update(
        {
            AuditEvent.certificado_codigo_snapshot: cert_code,
            AuditEvent.certificado_id: None,
        },
        synchronize_session=False,
    )
    db.query(CertificateEmailAttempt).filter(
        CertificateEmailAttempt.certificado_id == cert_id
    ).update(
        {CertificateEmailAttempt.certificado_id: None},
        synchronize_session=False,
    )
    db.delete(cert)
    db.flush()

    if record_event:
        record_audit_event(
            db,
            evento=evento,
            descricao=descricao
            or f"Certificado {cert_code} removido definitivamente da lixeira.",
            usuario=usuario,
            secretaria=cert_secretaria,
            certificado_codigo=cert_code,
            entidade_tipo="certificado",
            entidade_id=cert_id,
        )


def purge_expired_deleted_certificates(db: Session, now: datetime | None = None) -> int:
    reference_time = now or utc_now()
    expired_certificates = (
        db.query(Certificate)
        .filter(
            Certificate.excluido_em.isnot(None),
            Certificate.exclusao_expira_em.isnot(None),
            Certificate.exclusao_expira_em <= reference_time,
        )
        .all()
    )

    for cert in expired_certificates:
        delete_certificate_permanently(
            db,
            cert,
            evento="certificado_exclusao_definitiva",
            descricao=(
                f"Certificado {cert.codigo} removido definitivamente apos "
                f"{CERTIFICATE_TRASH_RETENTION_DAYS} dias na lixeira."
            ),
        )

    return len(expired_certificates)


def code_exists(db: Session, codigo: str) -> bool:
    return db.query(Certificate.id).filter(Certificate.codigo == codigo).first() is not None


_EMAIL_ATTEMPT_NOT_PROVIDED = object()


def get_latest_certificate_email_attempts(
    db: Session, certificate_ids: list[int]
) -> dict[int, CertificateEmailAttempt]:
    if not certificate_ids:
        return {}

    attempts = (
        db.query(CertificateEmailAttempt)
        .filter(CertificateEmailAttempt.certificado_id.in_(certificate_ids))
        .order_by(
            CertificateEmailAttempt.certificado_id.asc(),
            CertificateEmailAttempt.criado_em.desc(),
            CertificateEmailAttempt.id.desc(),
        )
        .all()
    )
    latest_by_certificate_id: dict[int, CertificateEmailAttempt] = {}
    for attempt in attempts:
        if attempt.certificado_id not in latest_by_certificate_id:
            latest_by_certificate_id[attempt.certificado_id] = attempt
    return latest_by_certificate_id


def to_response(
    cert: Certificate,
    request: Request,
    validation_url: str | None = None,
    last_email_attempt: CertificateEmailAttempt | None | object = _EMAIL_ATTEMPT_NOT_PROVIDED,
) -> CertificateResponse:
    file_available = is_certificate_ready(cert)
    internal_file_available = not bool(cert.arquivo_pendente) and has_certificate_file(cert)
    if last_email_attempt is _EMAIL_ATTEMPT_NOT_PROVIDED:
        db = object_session(cert)
        last_email_attempt = (
            db.query(CertificateEmailAttempt)
            .filter(CertificateEmailAttempt.certificado_id == cert.id)
            .order_by(CertificateEmailAttempt.criado_em.desc(), CertificateEmailAttempt.id.desc())
            .first()
            if db is not None
            else None
        )
    return CertificateResponse(
        id=cert.id,
        codigo=cert.codigo,
        nome=cert.nome,
        cpf=cert.cpf,
        email=cert.email,
        curso=cert.curso,
        carga_h=cert.carga_h,
        concluido=cert.concluido,
        emitido_em=cert.emitido_em,
        hash=cert.hash,
        url_validacao=validation_url or build_validation_url(request, cert.codigo),
        secretaria_id=cert.secretaria_id,
        secretaria_sigla=cert.secretaria.sigla if cert.secretaria else None,
        secretaria_nome=cert.secretaria.nome if cert.secretaria else None,
        reply_email_id=cert.reply_email_id,
        reply_to_nome=cert.reply_to_nome,
        reply_to_email=cert.reply_to_email,
        emitido_por_usuario_id=cert.emitido_por_usuario_id,
        emitido_por_username=cert.emitido_por.username if cert.emitido_por else None,
        render_snapshot=cert.render_snapshot,
        atualizado_em=cert.atualizado_em,
        atualizado_por_usuario_id=cert.atualizado_por_usuario_id,
        atualizado_por_username=cert.atualizado_por.username if cert.atualizado_por else None,
        excluido_em=cert.excluido_em,
        exclusao_expira_em=cert.exclusao_expira_em,
        excluido_por_usuario_id=cert.excluido_por_usuario_id,
        excluido_por_username=cert.excluido_por.username if cert.excluido_por else None,
        email_envio_status=last_email_attempt.status if last_email_attempt else None,
        email_tentativa_em=last_email_attempt.criado_em if last_email_attempt else None,
        email_enviado_em=last_email_attempt.enviado_em if last_email_attempt else None,
        email_reply_to=last_email_attempt.reply_to if last_email_attempt else None,
        email_erro=last_email_attempt.erro if last_email_attempt else None,
        arquivo_disponivel=file_available,
        arquivo_url=build_certificate_file_url(request, cert.codigo) if file_available else None,
        arquivo_admin_url=build_internal_certificate_file_url(request, cert.codigo)
        if internal_file_available
        else None,
    )


def validate_png_upload(uploaded: UploadFile, content: bytes) -> None:
    if not uploaded.filename:
        raise HTTPException(status_code=400, detail="Arquivo PNG e obrigatorio.")

    if not content:
        raise HTTPException(status_code=400, detail="Arquivo enviado esta vazio.")

    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"Arquivo muito grande. Limite atual: {MAX_UPLOAD_BYTES} bytes.",
        )

    content_type = (uploaded.content_type or "").lower()
    if content_type and content_type not in ("image/png", "application/octet-stream"):
        raise HTTPException(status_code=415, detail="Somente arquivos PNG sao aceitos.")

    if not content.startswith(b"\x89PNG\r\n\x1a\n"):
        raise HTTPException(status_code=415, detail="Arquivo invalido. Envie um PNG valido.")

    verify_uploaded_image_content(
        content,
        allowed_formats={"PNG"},
        invalid_detail="Arquivo invalido. Envie um PNG valido.",
    )


def validate_template_upload(uploaded: UploadFile, content: bytes) -> None:
    if not uploaded.filename:
        raise HTTPException(status_code=400, detail="Arquivo de molde e obrigatorio.")

    if not content:
        raise HTTPException(status_code=400, detail="Arquivo de molde enviado esta vazio.")

    if len(content) > MAX_TEMPLATE_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=(
                f"Arquivo de molde muito grande. Limite atual: {MAX_TEMPLATE_UPLOAD_BYTES} bytes."
            ),
        )

    suffix = Path(uploaded.filename).suffix.lower()
    allowed_suffixes = {".png", ".jpg", ".jpeg", ".webp"}
    if suffix not in allowed_suffixes:
        raise HTTPException(
            status_code=415,
            detail="Formato invalido para molde. Use PNG, JPG, JPEG ou WEBP.",
        )

    content_type = (uploaded.content_type or "").lower()
    if content_type and not content_type.startswith("image/"):
        raise HTTPException(
            status_code=415,
            detail="Somente imagens podem ser usadas como molde.",
        )

    verify_uploaded_image_content(
        content,
        allowed_formats={"PNG", "JPEG", "WEBP"},
        invalid_detail="Arquivo de imagem invalido. Use PNG, JPG, JPEG ou WEBP.",
    )


def build_certificate_file_response(
    cert: Certificate,
    *,
    allow_deleted: bool = False,
) -> FileResponse:
    if is_certificate_deleted(cert) and not allow_deleted:
        raise HTTPException(status_code=404, detail="Arquivo de certificado nao encontrado.")

    if cert.arquivo_pendente or not cert.arquivo_relpath:
        raise HTTPException(status_code=404, detail="Arquivo de certificado nao encontrado.")

    file_path = resolve_media_path(cert.arquivo_relpath)
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="Arquivo de certificado nao encontrado.")

    return FileResponse(
        path=file_path,
        media_type=cert.arquivo_mime or "image/png",
        filename=f"{cert.codigo}.png",
    )


def build_template_file_response(template: CertificateTemplate) -> FileResponse:
    file_path = resolve_template_media_path(template.arquivo_relpath)
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="Arquivo de molde nao encontrado.")

    suffix = Path(template.arquivo_relpath).suffix or ".png"
    filename = f"{sanitize_template_name(template.nome, 'molde')}{suffix}"
    return FileResponse(
        path=file_path,
        media_type=template.arquivo_mime or "application/octet-stream",
        filename=filename,
    )


def build_secretaria_asset_file_response(asset: SecretariaAsset) -> FileResponse:
    file_path = resolve_template_media_path(asset.arquivo_relpath)
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="Arquivo do asset nao encontrado.")

    suffix = Path(asset.arquivo_relpath).suffix or ".png"
    filename = f"{sanitize_template_name(asset.nome, asset.tipo)}{suffix}"
    return FileResponse(
        path=file_path,
        media_type=asset.arquivo_mime or "application/octet-stream",
        filename=filename,
    )
