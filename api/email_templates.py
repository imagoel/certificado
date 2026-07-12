from __future__ import annotations

from datetime import date
from email.message import EmailMessage
from email.utils import formataddr
from html import escape
from pathlib import Path

from sqlalchemy.orm import Session

from common import get_default_secretaria_reply_email
from email_config import SmtpConfig
from models import (
    Certificate,
    CertificateForm,
    CertificateFormResponse,
    Secretaria,
    SecretariaReplyEmail,
)


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

    if setor_nome and secretaria_nome:
        return f"{setor_nome} - {secretaria_nome}"
    if setor_nome and sigla:
        return f"{setor_nome} - {sigla}"
    if setor_nome:
        return setor_nome
    if sigla and secretaria_nome:
        return f"{sigla} - {secretaria_nome}"
    return sigla or secretaria_nome


def build_reply_email_issuer_label(
    secretaria: Secretaria | None,
    reply_email: SecretariaReplyEmail | None,
) -> str:
    sigla = (secretaria.sigla if secretaria else "").strip().upper()
    secretaria_nome = (secretaria.nome if secretaria else "").strip()
    setor_nome = (
        ""
        if is_generic_reply_name(reply_email.nome if reply_email else None)
        else (reply_email.nome if reply_email else "").strip()
    )

    if setor_nome and secretaria_nome:
        return f"{setor_nome} - {secretaria_nome}"
    if setor_nome and sigla:
        return f"{setor_nome} - {sigla}"
    if setor_nome:
        return setor_nome
    if sigla and secretaria_nome:
        return f"{sigla} - {secretaria_nome}"
    return sigla or secretaria_nome


def build_form_email_issuer_label(
    db: Session,
    form: CertificateForm,
) -> str:
    reply_email = form.reply_email if form.reply_email and form.reply_email.ativo else None
    if not reply_email and form.secretaria:
        reply_email = get_default_secretaria_reply_email(db, form.secretaria)
    return build_reply_email_issuer_label(form.secretaria, reply_email)


def format_brazilian_date(value: date) -> str:
    months = [
        "janeiro",
        "fevereiro",
        "março",
        "abril",
        "maio",
        "junho",
        "julho",
        "agosto",
        "setembro",
        "outubro",
        "novembro",
        "dezembro",
    ]
    return f"{value.day} de {months[value.month - 1]} de {value.year}"


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


def build_form_confirmation_email_text_body(
    *,
    response: CertificateFormResponse,
    form: CertificateForm,
    institution_name: str,
    issuer_label: str,
) -> str:
    issuer_line = f"\nEmitido por: {issuer_label}" if issuer_label else ""
    carga_text = f"{form.carga_h} hora" if form.carga_h == 1 else f"{form.carga_h} horas"
    return (
        f"Olá, {response.nome}.\n\n"
        f"Sua inscrição no curso {form.curso} foi registrada com sucesso.\n\n"
        f"Data da atividade: {format_brazilian_date(form.concluido)}\n"
        f"Carga horária: {carga_text}\n\n"
        "Guarde este e-mail para consulta futura.\n\n"
        "Caso precise corrigir alguma informação, responda este e-mail para falar "
        "com a equipe responsável.\n\n"
        "Atenciosamente,\n"
        f"{institution_name}\n"
        f"{issuer_line}"
    ).strip()


def build_form_confirmation_email_html_body(
    *,
    response: CertificateFormResponse,
    form: CertificateForm,
    institution_name: str,
    issuer_label: str,
    logo_url: str,
) -> str:
    escaped_logo_url = escape(logo_url, quote=True)
    escaped_institution = escape(institution_name)
    escaped_name = escape(response.nome)
    escaped_course = escape(form.curso)
    escaped_date = escape(format_brazilian_date(form.concluido))
    escaped_hours = escape(f"{form.carga_h} hora" if form.carga_h == 1 else f"{form.carga_h} horas")
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
    <title>Confirmação de inscrição</title>
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
                  Inscrição registrada com sucesso
                </h2>
                <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
                  Olá, {escaped_name}.
                </p>
                <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
                  Sua inscrição no curso <strong>{escaped_course}</strong> foi registrada com sucesso.
                </p>
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 8px; margin: 8px 0 24px; padding: 16px;">
                  <tr>
                    <td style="font-size: 15px; line-height: 1.7; color: #374151;">
                      <strong>Data da atividade:</strong> {escaped_date}<br />
                      <strong>Carga horária:</strong> {escaped_hours}
                    </td>
                  </tr>
                </table>
                <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
                  Guarde este e-mail para consulta futura.
                </p>
                <p style="font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                  Caso precise corrigir alguma informação, responda este e-mail para falar com a equipe responsável.
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


def build_form_confirmation_email_message(
    *,
    config: SmtpConfig,
    response: CertificateFormResponse,
    form: CertificateForm,
    reply_to: str,
    issuer_label: str,
) -> EmailMessage:
    message = EmailMessage()
    message["Subject"] = f"Confirmação de inscrição - {form.curso}"
    message["From"] = formataddr((config.from_name, config.from_email))
    message["To"] = response.email or ""
    message["Reply-To"] = reply_to

    text_body = build_form_confirmation_email_text_body(
        response=response,
        form=form,
        institution_name=config.email_institution_name,
        issuer_label=issuer_label,
    )
    html_body = build_form_confirmation_email_html_body(
        response=response,
        form=form,
        institution_name=config.email_institution_name,
        issuer_label=issuer_label,
        logo_url=config.email_logo_url,
    )
    message.set_content(text_body)
    message.add_alternative(html_body, subtype="html")
    return message


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

