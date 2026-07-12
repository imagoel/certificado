from __future__ import annotations

from fastapi import HTTPException
from sqlalchemy.orm import Session

from models import Secretaria, SecretariaReplyEmail
from schemas import SecretariaReplyEmailResponse


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

