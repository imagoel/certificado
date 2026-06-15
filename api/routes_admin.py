import math
from datetime import date, datetime

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Request, UploadFile
from sqlalchemy import or_
from sqlalchemy.orm import Session

from common import (
    build_audit_response,
    build_certificate_trash_expiration,
    build_secretaria_response,
    build_secretaria_reply_email_response,
    build_user_admin_response,
    clear_all_login_attempts_for_username,
    delete_certificate_permanently,
    ensure_secretaria_has_reply_to,
    get_default_secretaria_reply_email,
    get_secretarias_by_ids,
    normalize_secretaria_reply_defaults,
    normalize_secretaria_sigla,
    parse_render_snapshot_payload,
    purge_expired_deleted_certificates,
    record_audit_event,
    require_admin_user,
    replace_certificate_png_safely,
    resolve_secretaria_reply_choice,
    resolve_template_media_path,
    sanitize_code,
    sync_secretaria_reply_from_legacy_email,
    to_response,
    utc_now,
    validate_png_upload,
    validate_role_and_secretarias,
)
from database import get_db
from email_utils import normalize_optional_email
from models import (
    AuditEvent,
    Certificate,
    CertificateLayoutPreset,
    CertificateTemplate,
    Secretaria,
    SecretariaAsset,
    SecretariaReplyEmail,
    Usuario,
)
from schemas import (
    ActionResponse,
    CertificateAdminDeleteRequest,
    CertificateResponse,
    CertificateTrashClearRequest,
    PaginatedAuditEventResponse,
    SecretariaAdminCreate,
    SecretariaAdminUpdate,
    SecretariaReplyEmailCreate,
    SecretariaReplyEmailResponse,
    SecretariaReplyEmailUpdate,
    SecretariaResponse,
    UserAdminCreate,
    UserAdminResponse,
    UserAdminUpdate,
)
from security import calculate_certificate_hash, hash_password, normalize_username, verify_password


router = APIRouter()

LOW_SIGNAL_AUDIT_EVENTS = (
    "auth_login",
    "auth_logout",
    "troca_secretaria",
    "certificado_png_acessado",
)


def normalize_certificate_form_text(value: str, field_label: str) -> str:
    text = (value or "").strip()
    if len(text) < 2 or len(text) > 200:
        raise HTTPException(
            status_code=422,
            detail=f"{field_label} deve ter entre 2 e 200 caracteres.",
        )
    return text


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
        email_resposta=payload.email_resposta,
        ativa=payload.ativa,
    )
    db.add(secretaria)
    db.flush()
    sync_secretaria_reply_from_legacy_email(db, secretaria)
    ensure_secretaria_has_reply_to(db, secretaria)
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
    if "email_resposta" in payload.model_fields_set:
        secretaria.email_resposta = payload.email_resposta
        sync_secretaria_reply_from_legacy_email(db, secretaria)
    if payload.ativa is not None:
        secretaria.ativa = payload.ativa

    ensure_secretaria_has_reply_to(db, secretaria)

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
    secretaria = db.query(Secretaria).filter(Secretaria.id == secretaria_id).first()
    if not secretaria:
        raise HTTPException(status_code=404, detail="Secretaria nao encontrada.")

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
        usuario=admin_user,
        secretaria=secretaria,
        entidade_tipo="secretaria_reply_email",
        entidade_id=reply_email.id,
    )
    db.commit()
    db.refresh(reply_email)
    return build_secretaria_reply_email_response(reply_email)


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
    reply_email = (
        db.query(SecretariaReplyEmail)
        .filter(SecretariaReplyEmail.id == reply_email_id)
        .first()
    )
    if not reply_email:
        raise HTTPException(status_code=404, detail="Email de resposta nao encontrado.")

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
        usuario=admin_user,
        secretaria=secretaria,
        entidade_tipo="secretaria_reply_email",
        entidade_id=reply_email.id,
    )
    db.commit()
    db.refresh(reply_email)
    return build_secretaria_reply_email_response(reply_email)


@router.delete("/api/admin/secretaria-reply-emails/{reply_email_id}", response_model=ActionResponse)
def admin_delete_secretaria_reply_email(
    reply_email_id: int,
    db: Session = Depends(get_db),
    admin_user: Usuario = Depends(require_admin_user),
) -> ActionResponse:
    reply_email = (
        db.query(SecretariaReplyEmail)
        .filter(SecretariaReplyEmail.id == reply_email_id)
        .first()
    )
    if not reply_email:
        raise HTTPException(status_code=404, detail="Email de resposta nao encontrado.")

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
        usuario=admin_user,
        secretaria=secretaria,
        entidade_tipo="secretaria_reply_email",
        entidade_id=reply_email_id,
    )
    db.commit()
    return ActionResponse(message=f"Email de resposta {reply_name} excluido com sucesso.")


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

    secretarias = [] if payload.papel == "admin_global" else get_secretarias_by_ids(db, payload.secretaria_ids)
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
    clear_all_login_attempts_for_username(usuario.username)
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
        clear_all_login_attempts_for_username(usuario.username)
    if payload.ativo is not None:
        usuario.ativo = payload.ativo

    papel = payload.papel if payload.papel is not None else usuario.papel
    secretarias = (
        get_secretarias_by_ids(db, payload.secretaria_ids)
        if payload.secretaria_ids is not None
        else list(usuario.secretarias)
    )
    if papel == "admin_global":
        secretarias = []
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


@router.delete("/api/admin/usuarios/{usuario_id}", response_model=ActionResponse)
def admin_delete_user(
    usuario_id: int,
    db: Session = Depends(get_db),
    admin_user: Usuario = Depends(require_admin_user),
) -> ActionResponse:
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario nao encontrado.")

    if usuario.id == admin_user.id:
        raise HTTPException(
            status_code=422,
            detail="Nao e permitido excluir o usuario atualmente autenticado.",
        )

    username = usuario.username
    user_id = usuario.id
    user_secretaria = usuario.secretarias[0] if usuario.secretarias else None
    clear_all_login_attempts_for_username(username)

    db.query(Certificate).filter(Certificate.emitido_por_usuario_id == user_id).update(
        {Certificate.emitido_por_usuario_id: None},
        synchronize_session=False,
    )
    db.query(CertificateTemplate).filter(
        CertificateTemplate.criado_por_usuario_id == user_id
    ).update(
        {CertificateTemplate.criado_por_usuario_id: None},
        synchronize_session=False,
    )
    db.query(SecretariaAsset).filter(
        SecretariaAsset.criado_por_usuario_id == user_id
    ).update(
        {SecretariaAsset.criado_por_usuario_id: None},
        synchronize_session=False,
    )
    db.query(AuditEvent).filter(AuditEvent.usuario_id == user_id).update(
        {AuditEvent.usuario_id: None},
        synchronize_session=False,
    )

    usuario.secretarias.clear()
    db.delete(usuario)
    db.flush()
    record_audit_event(
        db,
        evento="usuario_excluido",
        descricao=f"Usuario {username} excluido por {admin_user.username}.",
        usuario=admin_user,
        secretaria=user_secretaria,
        entidade_tipo="usuario",
        entidade_id=user_id,
    )
    db.commit()

    return ActionResponse(message=f"Usuario {username} excluido com sucesso.")


@router.delete("/api/admin/secretarias/{secretaria_id}", response_model=ActionResponse)
def admin_delete_secretaria(
    secretaria_id: int,
    db: Session = Depends(get_db),
    admin_user: Usuario = Depends(require_admin_user),
) -> ActionResponse:
    secretaria = db.query(Secretaria).filter(Secretaria.id == secretaria_id).first()
    if not secretaria:
        raise HTTPException(status_code=404, detail="Secretaria nao encontrada.")

    cert_count = (
        db.query(Certificate.id)
        .filter(Certificate.secretaria_id == secretaria.id)
        .count()
    )
    if cert_count > 0:
        raise HTTPException(
            status_code=409,
            detail=(
                f"A secretaria {secretaria.sigla} possui {cert_count} certificado(s) emitido(s). "
                "Por seguranca, ela nao pode ser excluida; use desativacao."
            ),
        )

    sigla = secretaria.sigla
    secretaria_id_original = secretaria.id
    templates = list(secretaria.moldes)
    assets = list(secretaria.assets)
    layout_presets = (
        db.query(CertificateLayoutPreset)
        .filter(CertificateLayoutPreset.secretaria_id == secretaria.id)
        .all()
    )

    for template in templates:
        file_path = None
        if template.arquivo_relpath:
            try:
                file_path = resolve_template_media_path(template.arquivo_relpath)
            except HTTPException:
                file_path = None
        if file_path and file_path.exists():
            try:
                file_path.unlink()
            except OSError as error:
                raise HTTPException(
                    status_code=500,
                    detail=f"Nao foi possivel remover um arquivo de molde: {error}",
                ) from error
        db.delete(template)

    for asset in assets:
        file_path = None
        if asset.arquivo_relpath:
            try:
                file_path = resolve_template_media_path(asset.arquivo_relpath)
            except HTTPException:
                file_path = None
        if file_path and file_path.exists():
            try:
                file_path.unlink()
            except OSError as error:
                raise HTTPException(
                    status_code=500,
                    detail=f"Nao foi possivel remover um arquivo de asset da secretaria: {error}",
                ) from error
        db.delete(asset)

    for preset in layout_presets:
        db.delete(preset)

    secretaria.usuarios.clear()
    db.query(AuditEvent).filter(AuditEvent.secretaria_id == secretaria.id).update(
        {AuditEvent.secretaria_id: None},
        synchronize_session=False,
    )
    db.delete(secretaria)
    db.flush()
    record_audit_event(
        db,
        evento="secretaria_excluida",
        descricao=f"Secretaria {sigla} excluida por {admin_user.username}.",
        usuario=admin_user,
        entidade_tipo="secretaria",
        entidade_id=secretaria_id_original,
    )
    db.commit()

    return ActionResponse(message=f"Secretaria {sigla} excluida com sucesso.")


@router.get("/api/admin/auditoria", response_model=PaginatedAuditEventResponse)
def admin_list_audit_events(
    pagina: int = Query(default=1, ge=1, description="Numero da pagina"),
    por_pagina: int = Query(default=20, ge=1, le=100, description="Itens por pagina"),
    busca: str = Query(default="", description="Busca por descricao, usuario ou codigo"),
    evento: str = Query(default="", description="Filtrar por tipo de evento"),
    secretaria_id: int | None = Query(default=None, ge=1, description="Filtrar por secretaria"),
    criado_de: date | None = Query(default=None, description="Filtrar eventos a partir de"),
    criado_ate: date | None = Query(default=None, description="Filtrar eventos ate"),
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
                AuditEvent.certificado_codigo_snapshot.ilike(term),
            )
        )

    normalized_event = evento.strip()
    if normalized_event:
        query = query.filter(AuditEvent.evento == normalized_event)
    else:
        query = query.filter(~AuditEvent.evento.in_(LOW_SIGNAL_AUDIT_EVENTS))

    if secretaria_id:
        query = query.filter(AuditEvent.secretaria_id == secretaria_id)

    if criado_de:
        query = query.filter(AuditEvent.criado_em >= datetime.combine(criado_de, datetime.min.time()))

    if criado_ate:
        query = query.filter(AuditEvent.criado_em <= datetime.combine(criado_ate, datetime.max.time()))

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


@router.patch("/api/admin/certificados/{codigo}", response_model=CertificateResponse)
async def admin_update_certificate(
    codigo: str,
    request: Request,
    nome: str = Form(...),
    curso: str = Form(...),
    concluido: date = Form(...),
    carga_h: int = Form(...),
    email: str | None = Form(default=None),
    reply_email_id: int | None = Form(default=None),
    render_snapshot: str | None = Form(default=None),
    password: str = Form(...),
    confirmacao_codigo: str = Form(...),
    arquivo: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin_user: Usuario = Depends(require_admin_user),
) -> CertificateResponse:
    normalized_code = sanitize_code(codigo)
    confirmation_code = sanitize_code(confirmacao_codigo)
    if confirmation_code != normalized_code:
        raise HTTPException(
            status_code=422,
            detail="Codigo de confirmacao divergente. Digite o codigo exato do certificado.",
        )

    if not verify_password(password, admin_user.senha_hash):
        raise HTTPException(status_code=401, detail="Senha do administrador invalida.")

    cert = db.query(Certificate).filter(Certificate.codigo == normalized_code).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificado nao encontrado.")

    if cert.excluido_em:
        raise HTTPException(status_code=409, detail="Certificado na lixeira nao pode ser editado.")

    if cert.arquivo_pendente:
        raise HTTPException(status_code=409, detail="Certificado pendente nao pode ser editado.")

    clean_nome = normalize_certificate_form_text(nome, "Nome")
    clean_curso = normalize_certificate_form_text(curso, "Curso")
    if carga_h < 0 or carga_h > 2000:
        raise HTTPException(
            status_code=422,
            detail="Carga horaria deve estar entre 0 e 2000 horas.",
        )

    try:
        clean_email = cert.email if email is None else normalize_optional_email(email)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    snapshot = parse_render_snapshot_payload(render_snapshot)
    selected_reply_email_id = reply_email_id or cert.reply_email_id
    reply_id, reply_nome, reply_email = (
        resolve_secretaria_reply_choice(db, cert.secretaria, selected_reply_email_id)
        if cert.secretaria
        else (None, None, None)
    )
    content = await arquivo.read()
    validate_png_upload(arquivo, content)
    replacement = replace_certificate_png_safely(cert, content)

    try:
        cert.nome = clean_nome
        cert.curso = clean_curso
        cert.email = clean_email
        cert.reply_email_id = reply_id
        cert.reply_to_nome = reply_nome
        cert.reply_to_email = reply_email
        cert.concluido = concluido
        cert.carga_h = carga_h
        cert.hash = calculate_certificate_hash(
            codigo=cert.codigo,
            nome=cert.nome,
            cpf=cert.cpf,
            curso=cert.curso,
            carga_h=cert.carga_h,
            concluido=cert.concluido.isoformat(),
        )
        cert.render_snapshot = snapshot
        cert.atualizado_em = utc_now()
        cert.atualizado_por_usuario_id = admin_user.id
        cert.arquivo_relpath = replacement.relative_path
        cert.arquivo_mime = "image/png"
        cert.arquivo_bytes = len(content)
        cert.arquivo_pendente = False

        record_audit_event(
            db,
            evento="certificado_atualizado",
            descricao=(
                f"Certificado {cert.codigo} atualizado por {admin_user.username}. "
                "Dados principais e PNG foram regenerados."
            ),
            usuario=admin_user,
            secretaria=cert.secretaria,
            certificado=cert,
            entidade_tipo="certificado",
            entidade_id=cert.id,
        )
        db.commit()
    except Exception:
        db.rollback()
        replacement.rollback()
        raise

    replacement.commit()
    db.refresh(cert)
    return to_response(cert, request)


@router.delete("/api/admin/certificados/lixeira", response_model=ActionResponse)
def admin_clear_certificate_trash(
    payload: CertificateTrashClearRequest,
    db: Session = Depends(get_db),
    admin_user: Usuario = Depends(require_admin_user),
) -> ActionResponse:
    purged_count = purge_expired_deleted_certificates(db)
    if purged_count:
        db.commit()

    if payload.confirmacao != "LIMPAR LIXEIRA":
        raise HTTPException(
            status_code=422,
            detail="Digite LIMPAR LIXEIRA para confirmar a exclusao definitiva.",
        )

    if not verify_password(payload.password, admin_user.senha_hash):
        raise HTTPException(status_code=401, detail="Senha do administrador invalida.")

    deleted_certificates = (
        db.query(Certificate)
        .filter(Certificate.excluido_em.isnot(None))
        .order_by(Certificate.excluido_em.asc(), Certificate.id.asc())
        .all()
    )
    removed_count = len(deleted_certificates)

    for cert in deleted_certificates:
        delete_certificate_permanently(db, cert, record_event=False)

    record_audit_event(
        db,
        evento="certificado_lixeira_limpa",
        descricao=(
            f"Lixeira de certificados limpa por {admin_user.username}. "
            f"{removed_count} certificado(s) removido(s) definitivamente."
        ),
        usuario=admin_user,
        entidade_tipo="certificado_lixeira",
        entidade_id=removed_count,
    )
    db.commit()

    return ActionResponse(
        message=f"Lixeira limpa. {removed_count} certificado(s) removido(s) definitivamente."
    )


@router.post("/api/admin/certificados/{codigo}/restaurar", response_model=ActionResponse)
def admin_restore_certificate(
    codigo: str,
    db: Session = Depends(get_db),
    admin_user: Usuario = Depends(require_admin_user),
) -> ActionResponse:
    purged_count = purge_expired_deleted_certificates(db)
    if purged_count:
        db.commit()

    normalized_code = sanitize_code(codigo)
    cert = db.query(Certificate).filter(Certificate.codigo == normalized_code).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificado nao encontrado.")

    if not cert.excluido_em:
        raise HTTPException(status_code=409, detail="Certificado nao esta na lixeira.")

    cert.excluido_em = None
    cert.exclusao_expira_em = None
    cert.excluido_por_usuario_id = None
    record_audit_event(
        db,
        evento="certificado_restaurado",
        descricao=f"Certificado {cert.codigo} ({cert.nome}) restaurado por {admin_user.username}.",
        usuario=admin_user,
        secretaria=cert.secretaria,
        certificado=cert,
        entidade_tipo="certificado",
        entidade_id=cert.id,
    )
    db.commit()

    return ActionResponse(
        message=f"Certificado {cert.codigo} restaurado com sucesso.",
        codigo=cert.codigo,
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

    if cert.excluido_em:
        raise HTTPException(status_code=409, detail="Certificado ja esta na lixeira.")

    deleted_at = utc_now()
    cert.excluido_em = deleted_at
    cert.exclusao_expira_em = build_certificate_trash_expiration(deleted_at)
    cert.excluido_por_usuario_id = admin_user.id

    record_audit_event(
        db,
        evento="certificado_excluido",
        descricao=(
            f"Certificado {cert.codigo} ({cert.nome}) movido para a lixeira por "
            f"{admin_user.username}."
        ),
        usuario=admin_user,
        secretaria=cert.secretaria,
        certificado=cert,
        entidade_tipo="certificado",
        entidade_id=cert.id,
    )
    db.commit()

    return ActionResponse(
        message=f"Certificado {cert.codigo} movido para a lixeira com sucesso.",
        codigo=cert.codigo,
    )
