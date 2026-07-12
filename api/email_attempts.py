from __future__ import annotations

from sqlalchemy.orm import Session

from audit_service import record_audit_event
from common import utc_now
from email_config import EMAIL_STATUS_FAILED, EMAIL_STATUS_SENT
from models import (
    Certificate,
    CertificateEmailAttempt,
    CertificateFormEmailAttempt,
    CertificateFormResponse,
    Usuario,
)


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


def record_form_confirmation_email_attempt(
    db: Session,
    *,
    response: CertificateFormResponse,
    destinatario: str,
    reply_to: str | None,
    status: str,
    erro: str | None = None,
) -> CertificateFormEmailAttempt | None:
    attempt = CertificateFormEmailAttempt(
        formulario_resposta_id=response.id,
        formulario_id=response.formulario_id,
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
            "formulario_email_confirmacao_enviado"
            if status == EMAIL_STATUS_SENT
            else "formulario_email_confirmacao_falhou"
        ),
        descricao=(
            f"Confirmacao de inscricao do formulario {response.formulario.titulo} "
            f"enviada para {destinatario}."
            if status == EMAIL_STATUS_SENT
            else (
                f"Falha ao enviar confirmacao de inscricao do formulario "
                f"{response.formulario.titulo} para {destinatario}: {erro}"
            )
        ),
        secretaria=response.formulario.secretaria,
        entidade_tipo="formulario_email",
        entidade_id=attempt.id,
    )
    db.commit()
    db.refresh(attempt)
    return attempt


def safe_record_form_confirmation_email_attempt(
    db: Session,
    *,
    response: CertificateFormResponse,
    destinatario: str,
    reply_to: str | None,
    status: str,
    erro: str | None = None,
) -> CertificateFormEmailAttempt | None:
    try:
        return record_form_confirmation_email_attempt(
            db,
            response=response,
            destinatario=destinatario,
            reply_to=reply_to,
            status=status,
            erro=erro,
        )
    except Exception:
        db.rollback()
        return None

