import os

from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app_config import MAX_TEMPLATE_UPLOAD_BYTES, MAX_UPLOAD_BYTES, ROLE_ADMIN_GLOBAL
from database import get_db
from models import Certificate, CertificateTemplate, Secretaria, SecretariaAsset, Usuario
from reply_email_service import build_secretaria_reply_email_response
from request_security import ensure_csrf_token
from schemas import (
    SecretariaResponse,
    SessionResponse,
    SessionRuntimeConfigResponse,
    UserAdminResponse,
    UserSessionResponse,
)


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


def is_admin(usuario: Usuario) -> bool:
    return usuario.papel == ROLE_ADMIN_GLOBAL


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
