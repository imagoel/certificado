from __future__ import annotations

import os
import smtplib
import ssl
from dataclasses import dataclass
from email.message import EmailMessage
from email.utils import formataddr
from html import escape
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
    email_logo_url: str
    email_institution_name: str
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
        email_logo_url=os.getenv("EMAIL_LOGO_URL", "").strip(),
        email_institution_name=(
            os.getenv("EMAIL_INSTITUTION_NAME", "Prefeitura Municipal de Amargosa").strip()
            or "Prefeitura Municipal de Amargosa"
        ),
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


def is_generic_reply_name(value: str | None) -> bool:
    normalized = (value or "").strip().lower()
    return normalized in {"", "email principal", "e-mail principal", "principal"}


def build_email_issuer_label(cert: Certificate) -> str:
    secretaria = cert.secretaria
    sigla = (secretaria.sigla if secretaria else "").strip().upper()
    secretaria_nome = (secretaria.nome if secretaria else "").strip()
    setor_nome = (
        ""
        if is_generic_reply_name(cert.reply_to_nome)
        else (cert.reply_to_nome or "").strip()
    )

    if setor_nome and sigla:
        return f"{setor_nome} - {sigla}"
    if setor_nome:
        return setor_nome
    if sigla and secretaria_nome:
        return f"{sigla} - {secretaria_nome}"
    return sigla or secretaria_nome


def build_certificate_email_text_body(
    *,
    cert: Certificate,
    validation_url: str,
    institution_name: str,
    issuer_label: str,
) -> str:
    issuer_line = f"\nEmitido por: {issuer_label}" if issuer_label else ""
    return (
        f"Olá, {cert.nome}.\n\n"
        f"Parabéns pela conclusão do curso {cert.curso}.\n\n"
        "Seu certificado foi emitido com sucesso e está disponível em anexo neste e-mail.\n\n"
        "A autenticidade do certificado pode ser verificada por meio do QR Code presente "
        "no documento ou pelo link abaixo:\n"
        f"{validation_url}\n\n"
        "Em caso de dúvidas, responda este e-mail. Sua mensagem será encaminhada para "
        "a secretaria responsável pela emissão do certificado.\n\n"
        "Atenciosamente,\n"
        f"{institution_name}\n"
        f"{issuer_line}"
    ).strip()


def build_certificate_email_html_body(
    *,
    cert: Certificate,
    validation_url: str,
    institution_name: str,
    issuer_label: str,
    logo_url: str,
) -> str:
    escaped_logo_url = escape(logo_url, quote=True)
    escaped_institution = escape(institution_name)
    escaped_name = escape(cert.nome)
    escaped_course = escape(cert.curso)
    escaped_validation_url = escape(validation_url, quote=True)
    escaped_issuer = escape(issuer_label)
    logo_html = ""
    if escaped_logo_url:
        logo_html = f"""
            <tr>
              <td align="center" style="padding-bottom: 24px;">
                <img
                  src="{escaped_logo_url}"
                  alt="{escaped_institution}"
                  width="160"
                  style="display: block; max-width: 160px; height: auto; border: 0;"
                />
              </td>
            </tr>"""

    issuer_html = ""
    if escaped_issuer:
        issuer_html = f"""
                <p style="font-size: 15px; line-height: 1.6; margin: 20px 0 0; color: #374151;">
                  <strong>Emitido por:</strong> {escaped_issuer}
                </p>"""

    return f"""<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <title>Certificado disponível</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: Arial, Helvetica, sans-serif; color: #333333;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f6f8; padding: 24px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; padding: 32px; max-width: 600px;">
{logo_html}
            <tr>
              <td>
                <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 22px; text-align: center;">
                  Seu certificado está disponível
                </h2>
                <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
                  Olá, {escaped_name}.
                </p>
                <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
                  Parabéns pela conclusão do curso <strong>{escaped_course}</strong>.
                </p>
                <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
                  Seu certificado foi emitido com sucesso e está disponível em anexo neste e-mail.
                </p>
                <p style="font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                  A autenticidade do certificado pode ser verificada por meio do QR Code presente no documento ou pelo link abaixo:
                </p>
                <p style="margin: 0 0 24px; text-align: center;">
                  <a
                    href="{escaped_validation_url}"
                    style="background-color: #1f6feb; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 6px; display: inline-block; font-size: 15px; font-weight: bold;"
                  >
                    Validar certificado
                  </a>
                </p>
                <p style="font-size: 14px; line-height: 1.6; margin: 0 0 24px; color: #555555;">
                  Caso o botão não funcione, copie e cole o link abaixo no navegador:<br />
                  <a href="{escaped_validation_url}" style="color: #1f6feb; word-break: break-all;">
                    {escaped_validation_url}
                  </a>
                </p>
                <p style="font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                  Em caso de dúvidas, responda este e-mail. Sua mensagem será encaminhada para a secretaria responsável pela emissão do certificado.
                </p>
                <p style="font-size: 16px; line-height: 1.6; margin: 0;">
                  Atenciosamente,<br />
                  <strong>{escaped_institution}</strong>
                </p>{issuer_html}
              </td>
            </tr>
          </table>
          <p style="font-size: 12px; color: #777777; margin: 16px 0 0; text-align: center;">
            Este é um e-mail automático. Responda apenas se precisar falar com a secretaria responsável.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>"""


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

    issuer_label = build_email_issuer_label(cert)
    text_body = build_certificate_email_text_body(
        cert=cert,
        validation_url=validation_url,
        institution_name=config.email_institution_name,
        issuer_label=issuer_label,
    )
    html_body = build_certificate_email_html_body(
        cert=cert,
        validation_url=validation_url,
        institution_name=config.email_institution_name,
        issuer_label=issuer_label,
        logo_url=config.email_logo_url,
    )
    message.set_content(text_body)
    message.add_alternative(html_body, subtype="html")
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
