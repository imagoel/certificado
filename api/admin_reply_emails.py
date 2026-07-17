from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from audit_service import record_audit_event
from common import get_accessible_secretarias, get_current_user, is_admin, require_admin_user
from database import get_db
from models import Certificate, Secretaria, SecretariaReplyEmail, Usuario
from reply_email_service import (
    build_secretaria_reply_email_response,
    ensure_secretaria_has_reply_to,
    get_default_secretaria_reply_email,
    normalize_secretaria_reply_defaults,
)
from schemas import (
    ActionResponse,
    SecretariaReplyEmailCreate,
    SecretariaReplyEmailResponse,
    SecretariaReplyEmailUpdate,
)


router = APIRouter()


def require_reply_email_secretaria_access(
    db: Session,
    usuario: Usuario,
    secretaria_id: int,
) -> Secretaria:
    secretaria = db.query(Secretaria).filter(Secretaria.id == secretaria_id).first()
    if not secretaria:
        raise HTTPException(status_code=404, detail="Secretaria nao encontrada.")

    if is_admin(usuario):
        return secretaria

    allowed_ids = {item.id for item in get_accessible_secretarias(db, usuario)}
    if secretaria.id not in allowed_ids:
        raise HTTPException(status_code=403, detail="Secretaria nao permitida para este usuario.")
    return secretaria


def require_reply_email_access(
    db: Session,
    usuario: Usuario,
    reply_email: SecretariaReplyEmail,
) -> None:
    if is_admin(usuario):
        return

    allowed_ids = {item.id for item in get_accessible_secretarias(db, usuario)}
    if reply_email.secretaria_id not in allowed_ids:
        raise HTTPException(status_code=403, detail="Acesso negado a este email de resposta.")


def create_secretaria_reply_email_for_user(
    secretaria_id: int,
    payload: SecretariaReplyEmailCreate,
    db: Session,
    usuario: Usuario,
) -> SecretariaReplyEmailResponse:
    secretaria = require_reply_email_secretaria_access(db, usuario, secretaria_id)

    duplicate = (
        db.query(SecretariaReplyEmail)
        .filter(
            SecretariaReplyEmail.secretaria_id == secretaria.id,
            SecretariaReplyEmail.email == payload.email,
        )
        .first()
    )
    if duplicate:
        raise HTTPException(
            status_code=409,
            detail="Ja existe um email de resposta cadastrado com este endereco.",
        )

    should_be_default = payload.padrao or not get_default_secretaria_reply_email(db, secretaria)
    reply_email = SecretariaReplyEmail(
        secretaria_id=secretaria.id,
        nome=payload.nome.strip(),
        email=payload.email,
        ativo=payload.ativo,
        padrao=should_be_default and payload.ativo,
    )
    db.add(reply_email)
    db.flush()
    if reply_email.padrao:
        db.query(SecretariaReplyEmail).filter(
            SecretariaReplyEmail.secretaria_id == secretaria.id,
            SecretariaReplyEmail.id != reply_email.id,
        ).update(
            {SecretariaReplyEmail.padrao: False},
            synchronize_session=False,
        )
    normalize_secretaria_reply_defaults(db, secretaria)
    ensure_secretaria_has_reply_to(db, secretaria)
    record_audit_event(
        db,
        evento="secretaria_reply_email_criado",
        descricao=f"Email de resposta {reply_email.nome} criado para {secretaria.sigla}.",
        usuario=usuario,
        secretaria=secretaria,
        entidade_tipo="secretaria_reply_email",
        entidade_id=reply_email.id,
    )
    db.commit()
    db.refresh(reply_email)
    return build_secretaria_reply_email_response(reply_email)


def update_secretaria_reply_email_for_user(
    reply_email_id: int,
    payload: SecretariaReplyEmailUpdate,
    db: Session,
    usuario: Usuario,
) -> SecretariaReplyEmailResponse:
    reply_email = (
        db.query(SecretariaReplyEmail)
        .filter(SecretariaReplyEmail.id == reply_email_id)
        .first()
    )
    if not reply_email:
        raise HTTPException(status_code=404, detail="Email de resposta nao encontrado.")
    require_reply_email_access(db, usuario, reply_email)

    secretaria = reply_email.secretaria
    if payload.email is not None and payload.email != reply_email.email:
        duplicate = (
            db.query(SecretariaReplyEmail)
            .filter(
                SecretariaReplyEmail.secretaria_id == reply_email.secretaria_id,
                SecretariaReplyEmail.email == payload.email,
                SecretariaReplyEmail.id != reply_email.id,
            )
            .first()
        )
        if duplicate:
            raise HTTPException(
                status_code=409,
                detail="Ja existe um email de resposta cadastrado com este endereco.",
            )
        reply_email.email = payload.email

    if payload.nome is not None:
        reply_email.nome = payload.nome.strip()
    if payload.ativo is not None:
        reply_email.ativo = payload.ativo
    if payload.padrao is not None:
        if payload.padrao and not reply_email.ativo:
            raise HTTPException(
                status_code=422,
                detail="Somente emails ativos podem ser definidos como padrao.",
            )
        reply_email.padrao = payload.padrao

    db.flush()
    if reply_email.padrao:
        db.query(SecretariaReplyEmail).filter(
            SecretariaReplyEmail.secretaria_id == reply_email.secretaria_id,
            SecretariaReplyEmail.id != reply_email.id,
        ).update(
            {SecretariaReplyEmail.padrao: False},
            synchronize_session=False,
        )
    normalize_secretaria_reply_defaults(db, secretaria)
    ensure_secretaria_has_reply_to(db, secretaria)
    record_audit_event(
        db,
        evento="secretaria_reply_email_atualizado",
        descricao=f"Email de resposta {reply_email.nome} atualizado para {secretaria.sigla}.",
        usuario=usuario,
        secretaria=secretaria,
        entidade_tipo="secretaria_reply_email",
        entidade_id=reply_email.id,
    )
    db.commit()
    db.refresh(reply_email)
    return build_secretaria_reply_email_response(reply_email)


def delete_secretaria_reply_email_for_user(
    reply_email_id: int,
    db: Session,
    usuario: Usuario,
) -> ActionResponse:
    reply_email = (
        db.query(SecretariaReplyEmail)
        .filter(SecretariaReplyEmail.id == reply_email_id)
        .first()
    )
    if not reply_email:
        raise HTTPException(status_code=404, detail="Email de resposta nao encontrado.")
    require_reply_email_access(db, usuario, reply_email)

    secretaria = reply_email.secretaria
    if secretaria.ativa:
        active_count = (
            db.query(SecretariaReplyEmail)
            .filter(
                SecretariaReplyEmail.secretaria_id == secretaria.id,
                SecretariaReplyEmail.ativo.is_(True),
                SecretariaReplyEmail.id != reply_email.id,
            )
            .count()
        )
        if active_count == 0:
            raise HTTPException(
                status_code=422,
                detail="Secretaria ativa precisa manter pelo menos um email de resposta.",
            )

    reply_name = reply_email.nome
    db.query(Certificate).filter(Certificate.reply_email_id == reply_email.id).update(
        {Certificate.reply_email_id: None},
        synchronize_session=False,
    )
    db.delete(reply_email)
    db.flush()
    normalize_secretaria_reply_defaults(db, secretaria)
    record_audit_event(
        db,
        evento="secretaria_reply_email_excluido",
        descricao=f"Email de resposta {reply_name} excluido de {secretaria.sigla}.",
        usuario=usuario,
        secretaria=secretaria,
        entidade_tipo="secretaria_reply_email",
        entidade_id=reply_email_id,
    )
    db.commit()
    return ActionResponse(message=f"Email de resposta {reply_name} excluido com sucesso.")


@router.post(
    "/api/admin/secretarias/{secretaria_id}/reply-emails",
    response_model=SecretariaReplyEmailResponse,
    status_code=201,
)
def admin_create_secretaria_reply_email(
    secretaria_id: int,
    payload: SecretariaReplyEmailCreate,
    db: Session = Depends(get_db),
    admin_user: Usuario = Depends(require_admin_user),
) -> SecretariaReplyEmailResponse:
    return create_secretaria_reply_email_for_user(secretaria_id, payload, db, admin_user)


@router.patch(
    "/api/admin/secretaria-reply-emails/{reply_email_id}",
    response_model=SecretariaReplyEmailResponse,
)
def admin_update_secretaria_reply_email(
    reply_email_id: int,
    payload: SecretariaReplyEmailUpdate,
    db: Session = Depends(get_db),
    admin_user: Usuario = Depends(require_admin_user),
) -> SecretariaReplyEmailResponse:
    return update_secretaria_reply_email_for_user(reply_email_id, payload, db, admin_user)


@router.delete("/api/admin/secretaria-reply-emails/{reply_email_id}", response_model=ActionResponse)
def admin_delete_secretaria_reply_email(
    reply_email_id: int,
    db: Session = Depends(get_db),
    admin_user: Usuario = Depends(require_admin_user),
) -> ActionResponse:
    return delete_secretaria_reply_email_for_user(reply_email_id, db, admin_user)


@router.get(
    "/api/secretarias/{secretaria_id}/reply-emails",
    response_model=list[SecretariaReplyEmailResponse],
)
def list_secretaria_reply_emails(
    secretaria_id: int,
    incluir_inativos: bool = Query(default=True),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> list[SecretariaReplyEmailResponse]:
    secretaria = require_reply_email_secretaria_access(db, usuario, secretaria_id)
    query = db.query(SecretariaReplyEmail).filter(
        SecretariaReplyEmail.secretaria_id == secretaria.id
    )
    if not incluir_inativos:
        query = query.filter(SecretariaReplyEmail.ativo.is_(True))

    items = (
        query.order_by(
            SecretariaReplyEmail.padrao.desc(),
            SecretariaReplyEmail.ativo.desc(),
            SecretariaReplyEmail.nome.asc(),
            SecretariaReplyEmail.id.asc(),
        ).all()
    )
    return [build_secretaria_reply_email_response(item) for item in items]


@router.post(
    "/api/secretarias/{secretaria_id}/reply-emails",
    response_model=SecretariaReplyEmailResponse,
    status_code=201,
)
def create_secretaria_reply_email(
    secretaria_id: int,
    payload: SecretariaReplyEmailCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> SecretariaReplyEmailResponse:
    return create_secretaria_reply_email_for_user(secretaria_id, payload, db, usuario)


@router.patch(
    "/api/secretaria-reply-emails/{reply_email_id}",
    response_model=SecretariaReplyEmailResponse,
)
def update_secretaria_reply_email(
    reply_email_id: int,
    payload: SecretariaReplyEmailUpdate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> SecretariaReplyEmailResponse:
    return update_secretaria_reply_email_for_user(reply_email_id, payload, db, usuario)


@router.delete("/api/secretaria-reply-emails/{reply_email_id}", response_model=ActionResponse)
def delete_secretaria_reply_email(
    reply_email_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> ActionResponse:
    return delete_secretaria_reply_email_for_user(reply_email_id, db, usuario)

