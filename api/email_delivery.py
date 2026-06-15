from __future__ import annotations

import os
import smtplib
import ssl
from dataclasses import dataclass
from email.message import EmailMessage
from email.utils import formataddr
from pathlib import Path

from fastapi import HTTPException, Request
from sqlalchemy.orm import Session

from common import (
    build_validation_url,
    get_default_secretaria_reply_email,
    record_audit_event,
    resolve_media_path,
    utc_now,
)
from models import Certificate, CertificateEmailAttempt, Usuario


EMAIL_STATUS_SENT = "enviado"
EMAIL_STATUS_FAILED = "falhou"
MAX_EMAIL_ERROR_LENGTH = 1000


@dataclass(frozen=True)
class SmtpConfig:
    enabled: bool
    host: str
    port: int
    username: str
    password: str
    from_email: str
    from_name: str
    starttls: bool
    timeout_seconds: int


def env_bool(name: str, default: str = "false") -> bool:
    return os.getenv(name, default).strip().lower() in {"1", "true", "yes", "on"}


def env_int(name: str, default: int) -> int:
    raw = os.getenv(name, "").strip()
    if not raw:
        return default
    try:
        return int(raw)
    except ValueError:
        return default


def load_smtp_config() -> SmtpConfig:
    return SmtpConfig(
        enabled=env_bool("SMTP_ENABLED", "false"),
        host=os.getenv("SMTP_HOST", "").strip(),
        port=env_int("SMTP_PORT", 587),
        username=os.getenv("SMTP_USERNAME", "").strip(),
        password=os.getenv("SMTP_PASSWORD", ""),
        from_email=os.getenv("SMTP_FROM_EMAIL", "").strip(),
        from_name=os.getenv("SMTP_FROM_NAME", "Gerador de Certificados").strip()
        or "Gerador de Certificados",
        starttls=env_bool("SMTP_STARTTLS", "true"),
        timeout_seconds=max(1, env_int("SMTP_TIMEOUT_SECONDS", 15)),
    )


def validate_smtp_config(config: SmtpConfig) -> str | None:
    if not config.host:
        return "SMTP_HOST nao configurado."
    if not config.from_email:
        return "SMTP_FROM_EMAIL nao configurado."
    if config.username and not config.password:
        return "SMTP_PASSWORD nao configurado."
    return None


def summarize_email_error(error: object) -> str:
    text = str(error or "Falha desconhecida no envio de email.").strip()
    if len(text) > MAX_EMAIL_ERROR_LENGTH:
        return f"{text[:MAX_EMAIL_ERROR_LENGTH - 3]}..."
    return text


def build_certificate_email_message(
    *,
    config: SmtpConfig,
    cert: Certificate,
    reply_to: str,
    validation_url: str,
    attachment_path: Path,
) -> EmailMessage:
    message = EmailMessage()
    message["Subject"] = f"Certificado {cert.codigo} - {cert.curso}"
    message["From"] = formataddr((config.from_name, config.from_email))
    message["To"] = cert.email or ""
    message["Reply-To"] = reply_to

    body = (
        f"Ola, {cert.nome}.\n\n"
        f"Seu certificado do curso {cert.curso} foi emitido.\n\n"
        f"Codigo: {cert.codigo}\n"
        f"Link de validacao: {validation_url}\n\n"
        "O arquivo do certificado esta anexado a esta mensagem.\n"
        "Caso identifique alguma informacao incorreta, responda este email para contato com a secretaria responsavel.\n"
    )
    message.set_content(body)
    message.add_attachment(
        attachment_path.read_bytes(),
        maintype="image",
        subtype="png",
        filename=f"{cert.codigo}.png",
    )
    return message


def send_smtp_message(config: SmtpConfig, message: EmailMessage) -> None:
    with smtplib.SMTP(config.host, config.port, timeout=config.timeout_seconds) as smtp:
        if config.starttls:
            smtp.ehlo()
            smtp.starttls(context=ssl.create_default_context())
            smtp.ehlo()
        if config.username:
            smtp.login(config.username, config.password)
        smtp.send_message(message)


def record_email_attempt(
    db: Session,
    *,
    cert: Certificate,
    usuario: Usuario | None,
    destinatario: str,
    reply_to: str | None,
    status: str,
    erro: str | None = None,
) -> CertificateEmailAttempt | None:
    attempt = CertificateEmailAttempt(
        certificado_id=cert.id,
        certificado_codigo=cert.codigo,
        destinatario=destinatario,
        reply_to=reply_to,
        status=status,
        erro=erro,
        criado_em=utc_now(),
        enviado_em=utc_now() if status == EMAIL_STATUS_SENT else None,
    )
    db.add(attempt)
    db.flush()
    record_audit_event(
        db,
        evento=(
            "certificado_email_enviado"
            if status == EMAIL_STATUS_SENT
            else "certificado_email_falhou"
        ),
        descricao=(
            f"Email do certificado {cert.codigo} enviado para {destinatario}."
            if status == EMAIL_STATUS_SENT
            else f"Falha ao enviar email do certificado {cert.codigo} para {destinatario}: {erro}"
        ),
        usuario=usuario,
        secretaria=cert.secretaria,
        certificado=cert,
        entidade_tipo="certificado_email",
        entidade_id=attempt.id,
    )
    db.commit()
    db.refresh(attempt)
    return attempt


def safe_record_email_attempt(
    db: Session,
    *,
    cert: Certificate,
    usuario: Usuario | None,
    destinatario: str,
    reply_to: str | None,
    status: str,
    erro: str | None = None,
) -> CertificateEmailAttempt | None:
    try:
        return record_email_attempt(
            db,
            cert=cert,
            usuario=usuario,
            destinatario=destinatario,
            reply_to=reply_to,
            status=status,
            erro=erro,
        )
    except Exception:
        db.rollback()
        return None


def send_certificate_email_if_needed(
    db: Session,
    *,
    cert: Certificate,
    request: Request,
    usuario: Usuario | None,
) -> CertificateEmailAttempt | None:
    if not cert.email:
        return None

    config = load_smtp_config()
    if not config.enabled:
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
