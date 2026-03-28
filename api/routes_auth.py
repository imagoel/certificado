from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from common import (
    build_session_response,
    clear_login_attempts,
    get_accessible_secretarias,
    get_current_user,
    get_login_block_remaining_seconds,
    record_audit_event,
    register_failed_login_attempt,
    resolve_active_secretaria,
    utc_now,
)
from database import get_db
from models import Usuario
from schemas import LoginRequest, SecretariaSelectionRequest, SessionResponse
from security import normalize_username, verify_password


router = APIRouter()


@router.get("/api/auth/me", response_model=SessionResponse)
def auth_me(request: Request, db: Session = Depends(get_db)) -> SessionResponse:
    usuario = get_current_user(request, db)
    return build_session_response(request, db, usuario)


@router.post("/api/auth/login", response_model=SessionResponse)
def auth_login(
    payload: LoginRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> SessionResponse:
    username = normalize_username(payload.username)
    blocked_seconds = get_login_block_remaining_seconds(username, request)
    if blocked_seconds > 0:
        record_audit_event(
            db,
            evento="auth_login_bloqueado",
            descricao=(
                f"Tentativa bloqueada para username '{username or 'desconhecido'}'. "
                f"Tente novamente em {blocked_seconds}s."
            ),
            entidade_tipo="usuario",
        )
        db.commit()
        raise HTTPException(
            status_code=429,
            detail=f"Muitas tentativas de login. Tente novamente em {blocked_seconds} segundos.",
        )

    usuario = db.query(Usuario).filter(Usuario.username == username).first()

    if not usuario or not usuario.ativo or not verify_password(payload.password, usuario.senha_hash):
        blocked_seconds = register_failed_login_attempt(username, request)
        record_audit_event(
            db,
            evento="auth_login_falhou",
            descricao=(
                f"Tentativa de login sem sucesso para username '{username or 'desconhecido'}'."
                + (
                    f" Bloqueado por {blocked_seconds}s apos excesso de tentativas."
                    if blocked_seconds > 0
                    else ""
                )
            ),
            usuario=usuario if usuario and usuario.ativo else None,
            entidade_tipo="usuario",
            entidade_id=usuario.id if usuario else None,
        )
        db.commit()
        if blocked_seconds > 0:
            raise HTTPException(
                status_code=429,
                detail=(
                    "Muitas tentativas de login. "
                    f"Tente novamente em {blocked_seconds} segundos."
                ),
            )
        raise HTTPException(status_code=401, detail="Usuario ou senha invalidos.")

    request.session.clear()
    request.session["user_id"] = usuario.id
    clear_login_attempts(username, request)
    usuario.ultimo_login_em = utc_now()
    secretaria_ativa, _secretarias = resolve_active_secretaria(request, db, usuario)
    record_audit_event(
        db,
        evento="auth_login",
        descricao=f"Login realizado por {usuario.username}.",
        usuario=usuario,
        secretaria=secretaria_ativa,
        entidade_tipo="usuario",
        entidade_id=usuario.id,
    )
    db.commit()
    db.refresh(usuario)
    return build_session_response(request, db, usuario)


@router.post("/api/auth/logout", response_model=SessionResponse)
def auth_logout(request: Request) -> SessionResponse:
    request.session.clear()
    return SessionResponse(autenticado=False)


@router.post("/api/auth/select-secretaria", response_model=SessionResponse)
def auth_select_secretaria(
    payload: SecretariaSelectionRequest,
    request: Request,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> SessionResponse:
    secretarias = get_accessible_secretarias(db, usuario)
    selected = next(
        (secretaria for secretaria in secretarias if secretaria.id == payload.secretaria_id),
        None,
    )
    if not selected:
        raise HTTPException(status_code=403, detail="Secretaria nao permitida para este usuario.")

    request.session["secretaria_id"] = selected.id
    record_audit_event(
        db,
        evento="troca_secretaria",
        descricao=f"Secretaria ativa alterada para {selected.sigla}.",
        usuario=usuario,
        secretaria=selected,
        entidade_tipo="secretaria",
        entidade_id=selected.id,
    )
    db.commit()
    return build_session_response(request, db, usuario)
