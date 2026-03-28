import math
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from common import (
    build_audit_response,
    build_secretaria_response,
    build_user_admin_response,
    get_secretarias_by_ids,
    normalize_secretaria_sigla,
    record_audit_event,
    require_admin_user,
    resolve_media_path,
    sanitize_code,
    validate_role_and_secretarias,
)
from database import get_db
from models import AuditEvent, Certificate, Secretaria, Usuario
from schemas import (
    ActionResponse,
    CertificateAdminDeleteRequest,
    PaginatedAuditEventResponse,
    SecretariaAdminCreate,
    SecretariaAdminUpdate,
    SecretariaResponse,
    UserAdminCreate,
    UserAdminResponse,
    UserAdminUpdate,
)
from security import hash_password, normalize_username, verify_password


router = APIRouter()


@router.get("/api/admin/secretarias", response_model=list[SecretariaResponse])
def admin_list_secretarias(
    db: Session = Depends(get_db),
    _usuario: Usuario = Depends(require_admin_user),
) -> list[SecretariaResponse]:
    secretarias = db.query(Secretaria).order_by(Secretaria.sigla.asc()).all()
    return [build_secretaria_response(secretaria) for secretaria in secretarias]


@router.post("/api/admin/secretarias", response_model=SecretariaResponse, status_code=201)
def admin_create_secretaria(
    payload: SecretariaAdminCreate,
    db: Session = Depends(get_db),
    admin_user: Usuario = Depends(require_admin_user),
) -> SecretariaResponse:
    sigla = normalize_secretaria_sigla(payload.sigla)
    if not sigla:
        raise HTTPException(status_code=422, detail="Sigla invalida.")

    existing = db.query(Secretaria).filter(Secretaria.sigla == sigla).first()
    if existing:
        raise HTTPException(status_code=409, detail="Ja existe uma secretaria com esta sigla.")

    secretaria = Secretaria(
        sigla=sigla,
        nome=payload.nome.strip(),
        ativa=payload.ativa,
    )
    db.add(secretaria)
    db.flush()
    record_audit_event(
        db,
        evento="secretaria_criada",
        descricao=f"Secretaria {secretaria.sigla} criada.",
        usuario=admin_user,
        secretaria=secretaria,
        entidade_tipo="secretaria",
        entidade_id=secretaria.id,
    )
    db.commit()
    db.refresh(secretaria)
    return build_secretaria_response(secretaria)


@router.patch("/api/admin/secretarias/{secretaria_id}", response_model=SecretariaResponse)
def admin_update_secretaria(
    secretaria_id: int,
    payload: SecretariaAdminUpdate,
    db: Session = Depends(get_db),
    admin_user: Usuario = Depends(require_admin_user),
) -> SecretariaResponse:
    secretaria = db.query(Secretaria).filter(Secretaria.id == secretaria_id).first()
    if not secretaria:
        raise HTTPException(status_code=404, detail="Secretaria nao encontrada.")

    if payload.sigla is not None:
        sigla = normalize_secretaria_sigla(payload.sigla)
        if not sigla:
            raise HTTPException(status_code=422, detail="Sigla invalida.")

        duplicate = (
            db.query(Secretaria)
            .filter(Secretaria.sigla == sigla, Secretaria.id != secretaria_id)
            .first()
        )
        if duplicate:
            raise HTTPException(status_code=409, detail="Ja existe outra secretaria com esta sigla.")
        secretaria.sigla = sigla

    if payload.nome is not None:
        secretaria.nome = payload.nome.strip()
    if payload.ativa is not None:
        secretaria.ativa = payload.ativa

    record_audit_event(
        db,
        evento="secretaria_atualizada",
        descricao=f"Secretaria {secretaria.sigla} atualizada.",
        usuario=admin_user,
        secretaria=secretaria,
        entidade_tipo="secretaria",
        entidade_id=secretaria.id,
    )
    db.commit()
    db.refresh(secretaria)
    return build_secretaria_response(secretaria)


@router.get("/api/admin/usuarios", response_model=list[UserAdminResponse])
def admin_list_users(
    db: Session = Depends(get_db),
    _usuario: Usuario = Depends(require_admin_user),
) -> list[UserAdminResponse]:
    usuarios = db.query(Usuario).order_by(Usuario.nome.asc()).all()
    return [build_user_admin_response(usuario) for usuario in usuarios]


@router.post("/api/admin/usuarios", response_model=UserAdminResponse, status_code=201)
def admin_create_user(
    payload: UserAdminCreate,
    db: Session = Depends(get_db),
    admin_user: Usuario = Depends(require_admin_user),
) -> UserAdminResponse:
    username = normalize_username(payload.username)
    if not username:
        raise HTTPException(status_code=422, detail="Username invalido.")

    existing = db.query(Usuario).filter(Usuario.username == username).first()
    if existing:
        raise HTTPException(status_code=409, detail="Ja existe um usuario com este username.")

    secretarias = get_secretarias_by_ids(db, payload.secretaria_ids)
    validate_role_and_secretarias(payload.papel, secretarias)

    usuario = Usuario(
        nome=payload.nome.strip(),
        username=username,
        senha_hash=hash_password(payload.password),
        papel=payload.papel,
        ativo=payload.ativo,
    )
    usuario.secretarias = secretarias
    db.add(usuario)
    db.flush()
    record_audit_event(
        db,
        evento="usuario_criado",
        descricao=f"Usuario {usuario.username} criado com papel {usuario.papel}.",
        usuario=admin_user,
        secretaria=secretarias[0] if secretarias else None,
        entidade_tipo="usuario",
        entidade_id=usuario.id,
    )
    db.commit()
    db.refresh(usuario)
    return build_user_admin_response(usuario)


@router.patch("/api/admin/usuarios/{usuario_id}", response_model=UserAdminResponse)
def admin_update_user(
    usuario_id: int,
    payload: UserAdminUpdate,
    db: Session = Depends(get_db),
    admin_user: Usuario = Depends(require_admin_user),
) -> UserAdminResponse:
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario nao encontrado.")

    if payload.nome is not None:
        usuario.nome = payload.nome.strip()
    if payload.password is not None and payload.password.strip():
        usuario.senha_hash = hash_password(payload.password)
    if payload.ativo is not None:
        usuario.ativo = payload.ativo

    papel = payload.papel if payload.papel is not None else usuario.papel
    secretarias = (
        get_secretarias_by_ids(db, payload.secretaria_ids)
        if payload.secretaria_ids is not None
        else list(usuario.secretarias)
    )
    validate_role_and_secretarias(papel, secretarias)

    usuario.papel = papel
    usuario.secretarias = secretarias
    record_audit_event(
        db,
        evento="usuario_atualizado",
        descricao=f"Usuario {usuario.username} atualizado.",
        usuario=admin_user,
        secretaria=secretarias[0] if secretarias else None,
        entidade_tipo="usuario",
        entidade_id=usuario.id,
    )
    db.commit()
    db.refresh(usuario)
    return build_user_admin_response(usuario)


@router.get("/api/admin/auditoria", response_model=PaginatedAuditEventResponse)
def admin_list_audit_events(
    pagina: int = Query(default=1, ge=1, description="Numero da pagina"),
    por_pagina: int = Query(default=20, ge=1, le=100, description="Itens por pagina"),
    busca: str = Query(default="", description="Busca por descricao, usuario ou codigo"),
    evento: str = Query(default="", description="Filtrar por tipo de evento"),
    secretaria_id: int | None = Query(default=None, ge=1, description="Filtrar por secretaria"),
    db: Session = Depends(get_db),
    _usuario: Usuario = Depends(require_admin_user),
) -> PaginatedAuditEventResponse:
    query = db.query(AuditEvent)

    if busca.strip():
        term = f"%{busca.strip()}%"
        query = query.filter(
            or_(
                AuditEvent.descricao.ilike(term),
                AuditEvent.evento.ilike(term),
                AuditEvent.usuario.has(Usuario.nome.ilike(term)),
                AuditEvent.usuario.has(Usuario.username.ilike(term)),
                AuditEvent.certificado.has(Certificate.codigo.ilike(term)),
            )
        )

    if evento.strip():
        query = query.filter(AuditEvent.evento == evento.strip())

    if secretaria_id:
        query = query.filter(AuditEvent.secretaria_id == secretaria_id)

    total = query.count()
    paginas = max(1, math.ceil(total / por_pagina))
    offset = (pagina - 1) * por_pagina

    events = (
        query.order_by(AuditEvent.criado_em.desc(), AuditEvent.id.desc())
        .offset(offset)
        .limit(por_pagina)
        .all()
    )

    return PaginatedAuditEventResponse(
        total=total,
        pagina=pagina,
        por_pagina=por_pagina,
        paginas=paginas,
        itens=[build_audit_response(event) for event in events],
    )


@router.delete("/api/admin/certificados/{codigo}", response_model=ActionResponse)
def admin_delete_certificate(
    codigo: str,
    payload: CertificateAdminDeleteRequest,
    db: Session = Depends(get_db),
    admin_user: Usuario = Depends(require_admin_user),
) -> ActionResponse:
    normalized_code = sanitize_code(codigo)
    if payload.confirmacao_codigo != normalized_code:
        raise HTTPException(
            status_code=422,
            detail="Codigo de confirmacao divergente. Digite o codigo exato do certificado.",
        )

    if not verify_password(payload.password, admin_user.senha_hash):
        raise HTTPException(status_code=401, detail="Senha do administrador invalida.")

    cert = db.query(Certificate).filter(Certificate.codigo == normalized_code).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificado nao encontrado.")

    cert_id = cert.id
    cert_code = cert.codigo
    cert_name = cert.nome
    cert_secretaria = cert.secretaria

    file_path: Path | None = None
    if cert.arquivo_relpath:
        try:
            file_path = resolve_media_path(cert.arquivo_relpath)
        except HTTPException:
            file_path = None

    if file_path and file_path.exists():
        try:
            file_path.unlink()
        except OSError as error:
            raise HTTPException(
                status_code=500,
                detail=f"Nao foi possivel remover o arquivo do certificado: {error}",
            ) from error

    db.query(AuditEvent).filter(AuditEvent.certificado_id == cert_id).delete(
        synchronize_session=False
    )
    db.delete(cert)
    db.flush()
    record_audit_event(
        db,
        evento="certificado_excluido",
        descricao=f"Certificado {cert_code} ({cert_name}) excluido por {admin_user.username}.",
        usuario=admin_user,
        secretaria=cert_secretaria,
        entidade_tipo="certificado",
        entidade_id=cert_id,
    )
    db.commit()

    return ActionResponse(
        message=f"Certificado {cert_code} excluido com sucesso.",
        codigo=cert_code,
    )
