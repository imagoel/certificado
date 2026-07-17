import os
import re
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, Request
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session, object_session

from bootstrap import run_startup_bootstrap
from auth_context import (
    build_secretaria_response,
    build_session_response,
    build_user_admin_response,
    build_user_session_response,
    ensure_certificate_access,
    ensure_secretaria_asset_access,
    ensure_template_access,
    get_accessible_secretarias,
    get_current_user,
    get_secretarias_by_ids,
    is_admin,
    require_active_secretaria,
    require_admin_user,
    resolve_active_secretaria,
    validate_role_and_secretarias,
)
from database import SessionLocal
from migrations import ensure_database_schema
from app_config import (
    BASE_DIR,
    CERTIFICATE_TRASH_RETENTION_DAYS,
    CERTIFICADOS_MEDIA_DIR,
    CODE_REGEX,
    DEFAULT_PREFIX,
    ENABLE_ADMIN_DOCS,
    MAX_IMAGE_PIXELS,
    MAX_TEMPLATE_UPLOAD_BYTES,
    MAX_UPLOAD_BYTES,
    ROLE_ADMIN_GLOBAL,
    SESSION_COOKIE_NAME,
    SESSION_HTTPS_ONLY,
    SESSION_MAX_AGE_SECONDS,
    SESSION_SAME_SITE,
    SESSION_SECRET,
    TEMPLATES_MEDIA_DIR,
    resolve_allowed_origins,
    validate_security_config,
)
from certificate_files import (
    CertificatePngReplacement,
    build_certificate_file_response,
    build_file_relative_path,
    build_secretaria_asset_file_response,
    build_secretaria_asset_relative_path,
    build_template_file_response,
    build_template_relative_path,
    has_certificate_file,
    normalize_secretaria_asset_type,
    parse_render_snapshot_payload,
    replace_certificate_png_safely,
    resolve_media_path,
    resolve_template_media_path,
    sanitize_code,
    sanitize_template_name,
    validate_png_upload,
    validate_template_upload,
    verify_uploaded_image_content,
)
from request_security import (
    clear_all_login_attempts_for_username,
    clear_login_attempts,
    ensure_csrf_token,
    get_login_block_remaining_seconds,
    get_request_ip,
    register_failed_login_attempt,
    require_csrf_protection,
)
from models import (
    AuditEvent,
    Certificate,
    CertificateEmailAttempt,
    CertificateLayoutPreset,
    CertificateTemplate,
    Secretaria,
    SecretariaAsset,
    Usuario,
)
from schemas import (
    CertificateLayoutPresetResponse,
    CertificateResponse,
    CertificateTemplateResponse,
    SecretariaAssetResponse,
)


templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))


def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


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


from audit_service import build_audit_response, record_audit_event


def normalize_secretaria_sigla(value: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", (value or "").strip().upper())


def build_internal_certificate_file_url(request: Request, codigo: str) -> str:
    return build_route_path(
        request,
        "get_certificate_file_internal",
        codigo=sanitize_code(codigo),
    )


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
