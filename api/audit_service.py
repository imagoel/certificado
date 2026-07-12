from __future__ import annotations

from sqlalchemy.orm import Session

from models import AuditEvent, Certificate, Secretaria, Usuario
from schemas import AuditEventResponse


def _sanitize_audit_certificate_code(codigo: str | None) -> str:
    return ''.join(
        char for char in (codigo or '').strip().upper() if char.isalnum() or char == '-'
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
            certificado.codigo if certificado else _sanitize_audit_certificate_code(certificado_codigo)
        )
        or None,
        entidade_tipo=entidade_tipo,
        entidade_id=entidade_id,
    )
    db.add(audit)
    return audit

