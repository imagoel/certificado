from __future__ import annotations

from fastapi import HTTPException, Request
from sqlalchemy.orm import Session

from common import (
    build_validation_url,
    get_default_secretaria_reply_email,
    resolve_media_path,
)
from email_attempts import (
    record_email_attempt,
    record_form_confirmation_email_attempt,
    safe_record_email_attempt,
    safe_record_form_confirmation_email_attempt,
)
from email_config import (
    EMAIL_STATUS_FAILED,
    EMAIL_STATUS_SENT,
    MAX_EMAIL_ERROR_LENGTH,
    SmtpConfig,
    env_bool,
    env_int,
    load_smtp_config,
    summarize_email_error,
    validate_smtp_config,
)
from email_templates import (
    build_certificate_email_html_body,
    build_certificate_email_message,
    build_certificate_email_text_body,
    build_email_issuer_label,
    build_form_confirmation_email_html_body,
    build_form_confirmation_email_message,
    build_form_confirmation_email_text_body,
    build_form_email_issuer_label,
    build_reply_email_issuer_label,
    format_brazilian_date,
    is_generic_reply_name,
)
from models import (
    Certificate,
    CertificateEmailAttempt,
    CertificateForm,
    CertificateFormEmailAttempt,
    Usuario,
)
from smtp_sender import send_smtp_message, smtplib


def resolve_form_confirmation_reply_to(
    db: Session,
    form: CertificateForm,
) -> str | None:
    if form.reply_email and form.reply_email.ativo:
        return form.reply_email.email
    default_reply = get_default_secretaria_reply_email(db, form.secretaria) if form.secretaria else None
    return (
        (default_reply.email if default_reply else None)
        or (form.secretaria.email_resposta if form.secretaria else None)
    )


def send_form_confirmation_email_if_needed(
    db: Session,
    *,
    response: CertificateFormResponse,
) -> CertificateFormEmailAttempt | None:
    if not response.email:
        return None

    config = load_smtp_config()
    destinatario = response.email
    reply_to = resolve_form_confirmation_reply_to(db, response.formulario)

    if not config.enabled:
        return safe_record_form_confirmation_email_attempt(
            db,
            response=response,
            destinatario=destinatario,
            reply_to=reply_to,
            status=EMAIL_STATUS_FAILED,
            erro="Envio por email desativado no sistema.",
        )

    config_error = validate_smtp_config(config)
    if config_error:
        return safe_record_form_confirmation_email_attempt(
            db,
            response=response,
            destinatario=destinatario,
            reply_to=reply_to,
            status=EMAIL_STATUS_FAILED,
            erro=config_error,
        )
    if not reply_to:
        return safe_record_form_confirmation_email_attempt(
            db,
            response=response,
            destinatario=destinatario,
            reply_to=None,
            status=EMAIL_STATUS_FAILED,
            erro="Secretaria sem email de resposta cadastrado.",
        )

    try:
        message = build_form_confirmation_email_message(
            config=config,
            response=response,
            form=response.formulario,
            reply_to=reply_to,
            issuer_label=build_form_email_issuer_label(db, response.formulario),
        )
        send_smtp_message(config, message)
    except Exception as exc:
        return safe_record_form_confirmation_email_attempt(
            db,
            response=response,
            destinatario=destinatario,
            reply_to=reply_to,
            status=EMAIL_STATUS_FAILED,
            erro=summarize_email_error(exc),
        )

    return safe_record_form_confirmation_email_attempt(
        db,
        response=response,
        destinatario=destinatario,
        reply_to=reply_to,
        status=EMAIL_STATUS_SENT,
    )


def send_certificate_email_if_needed(
    db: Session,
    *,
    cert: Certificate,
    request: Request,
    usuario: Usuario | None,
    record_disabled_attempt: bool = False,
) -> CertificateEmailAttempt | None:
    if not cert.email:
        return None

    config = load_smtp_config()
    if not config.enabled:
        if record_disabled_attempt:
            return safe_record_email_attempt(
                db,
                cert=cert,
                usuario=usuario,
                destinatario=cert.email,
                reply_to=cert.reply_to_email,
                status=EMAIL_STATUS_FAILED,
                erro="Envio por email desativado no sistema.",
            )
        return None

    destinatario = cert.email
    default_reply = get_default_secretaria_reply_email(db, cert.secretaria) if cert.secretaria else None
    reply_to = (
        cert.reply_to_email
        or (default_reply.email if default_reply else None)
        or (cert.secretaria.email_resposta if cert.secretaria else None)
    )
    config_error = validate_smtp_config(config)
    if config_error:
        return safe_record_email_attempt(
            db,
            cert=cert,
            usuario=usuario,
            destinatario=destinatario,
            reply_to=reply_to,
            status=EMAIL_STATUS_FAILED,
            erro=config_error,
        )
    if not reply_to:
        return safe_record_email_attempt(
            db,
            cert=cert,
            usuario=usuario,
            destinatario=destinatario,
            reply_to=None,
            status=EMAIL_STATUS_FAILED,
            erro="Secretaria sem email de resposta cadastrado.",
        )
    if not cert.arquivo_relpath:
        return safe_record_email_attempt(
            db,
            cert=cert,
            usuario=usuario,
            destinatario=destinatario,
            reply_to=reply_to,
            status=EMAIL_STATUS_FAILED,
            erro="Certificado sem arquivo PNG salvo.",
        )

    try:
        attachment_path = resolve_media_path(cert.arquivo_relpath)
    except HTTPException as exc:
        return safe_record_email_attempt(
            db,
            cert=cert,
            usuario=usuario,
            destinatario=destinatario,
            reply_to=reply_to,
            status=EMAIL_STATUS_FAILED,
            erro=summarize_email_error(exc.detail),
        )

    if not attachment_path.exists():
        return safe_record_email_attempt(
            db,
            cert=cert,
            usuario=usuario,
            destinatario=destinatario,
            reply_to=reply_to,
            status=EMAIL_STATUS_FAILED,
            erro="Arquivo PNG do certificado nao encontrado.",
        )

    try:
        message = build_certificate_email_message(
            config=config,
            cert=cert,
            reply_to=reply_to,
            validation_url=build_validation_url(request, cert.codigo),
            attachment_path=attachment_path,
        )
        send_smtp_message(config, message)
    except Exception as exc:
        return safe_record_email_attempt(
            db,
            cert=cert,
            usuario=usuario,
            destinatario=destinatario,
            reply_to=reply_to,
            status=EMAIL_STATUS_FAILED,
            erro=summarize_email_error(exc),
        )

    return safe_record_email_attempt(
        db,
        cert=cert,
        usuario=usuario,
        destinatario=destinatario,
        reply_to=reply_to,
        status=EMAIL_STATUS_SENT,
    )
