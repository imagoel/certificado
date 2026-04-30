from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Request, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from common import (
    build_template_file_response,
    build_template_relative_path,
    build_template_response,
    ensure_template_access,
    get_accessible_secretarias,
    get_current_user,
    is_admin,
    record_audit_event,
    require_active_secretaria,
    resolve_template_media_path,
    validate_template_upload,
)
from database import get_db
from models import CertificateTemplate, Secretaria, Usuario
from schemas import ActionResponse, CertificateTemplateResponse


router = APIRouter()


def normalize_template_payload(
    *,
    nome: str,
    ativo: bool,
    padrao: bool,
    ordem: int,
) -> tuple[str, bool, bool, int]:
    normalized_name = (nome or "").strip()
    if len(normalized_name) < 2:
        raise HTTPException(status_code=422, detail="Informe um nome com pelo menos 2 caracteres.")

    normalized_order = max(0, int(ordem))
    if padrao and not ativo:
        raise HTTPException(status_code=422, detail="Um molde padrao precisa estar ativo.")
    return normalized_name, bool(ativo), bool(padrao), normalized_order


def clear_other_default_templates(
    db: Session,
    secretaria_id: int,
    current_template_id: int | None,
) -> None:
    query = db.query(CertificateTemplate).filter(CertificateTemplate.secretaria_id == secretaria_id)
    if current_template_id:
        query = query.filter(CertificateTemplate.id != current_template_id)
    query.update({CertificateTemplate.padrao: False}, synchronize_session=False)


def template_query(db: Session):
    return db.query(CertificateTemplate).join(Secretaria, CertificateTemplate.secretaria_id == Secretaria.id)


def get_manageable_secretaria_ids(db: Session, usuario: Usuario) -> set[int] | None:
    if is_admin(usuario):
        return None
    return {secretaria.id for secretaria in get_accessible_secretarias(db, usuario)}


def require_template_manage_secretaria(db: Session, usuario: Usuario, secretaria_id: int) -> Secretaria:
    secretaria = db.query(Secretaria).filter(Secretaria.id == secretaria_id).first()
    if not secretaria:
        raise HTTPException(status_code=404, detail="Secretaria nao encontrada.")

    allowed_ids = get_manageable_secretaria_ids(db, usuario)
    if allowed_ids is not None and secretaria.id not in allowed_ids:
        raise HTTPException(status_code=403, detail="Secretaria nao permitida para este usuario.")
    return secretaria


def require_template_manage_access(db: Session, usuario: Usuario, template: CertificateTemplate) -> None:
    allowed_ids = get_manageable_secretaria_ids(db, usuario)
    if allowed_ids is not None and template.secretaria_id not in allowed_ids:
        raise HTTPException(status_code=403, detail="Acesso negado a este molde.")


@router.get("/api/templates", response_model=list[CertificateTemplateResponse])
def list_templates_for_active_secretaria(
    request: Request,
    secretaria_id: int | None = Query(default=None, ge=1),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
    secretaria_ativa: Secretaria = Depends(require_active_secretaria),
) -> list[CertificateTemplateResponse]:
    target_secretaria_id = secretaria_id or secretaria_ativa.id

    if not is_admin(usuario):
        allowed_secretaria_ids = {secretaria.id for secretaria in usuario.secretarias if secretaria.ativa}
        if target_secretaria_id not in allowed_secretaria_ids:
            raise HTTPException(status_code=403, detail="Secretaria nao permitida para este usuario.")

    templates = (
        template_query(db)
        .filter(
            CertificateTemplate.secretaria_id == target_secretaria_id,
            CertificateTemplate.ativo.is_(True),
        )
        .order_by(
            CertificateTemplate.padrao.desc(),
            CertificateTemplate.ordem.asc(),
            CertificateTemplate.nome.asc(),
            CertificateTemplate.id.asc(),
        )
        .all()
    )
    return [build_template_response(template, request) for template in templates]


@router.get("/api/templates/{template_id}/arquivo", name="get_template_file")
def get_template_file(
    template_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> FileResponse:
    template = db.query(CertificateTemplate).filter(CertificateTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Molde nao encontrado.")

    ensure_template_access(db, usuario, template)
    return build_template_file_response(template)


@router.get("/api/admin/templates", response_model=list[CertificateTemplateResponse])
def admin_list_templates(
    request: Request,
    secretaria_id: int | None = Query(default=None, ge=1),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> list[CertificateTemplateResponse]:
    query = template_query(db)
    allowed_ids = get_manageable_secretaria_ids(db, usuario)
    if allowed_ids is not None:
        if secretaria_id and secretaria_id not in allowed_ids:
            raise HTTPException(status_code=403, detail="Secretaria nao permitida para este usuario.")
        query = query.filter(CertificateTemplate.secretaria_id.in_(allowed_ids))
    if secretaria_id:
        query = query.filter(CertificateTemplate.secretaria_id == secretaria_id)

    templates = (
        query.order_by(
            Secretaria.sigla.asc(),
            CertificateTemplate.padrao.desc(),
            CertificateTemplate.ordem.asc(),
            CertificateTemplate.nome.asc(),
            CertificateTemplate.id.asc(),
        ).all()
    )
    return [build_template_response(template, request) for template in templates]


@router.post("/api/admin/templates", response_model=CertificateTemplateResponse, status_code=201)
async def admin_create_template(
    request: Request,
    secretaria_id: int = Form(..., ge=1),
    nome: str = Form(...),
    ativo: bool = Form(True),
    padrao: bool = Form(False),
    ordem: int = Form(0),
    arquivo: UploadFile = File(...),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> CertificateTemplateResponse:
    secretaria = require_template_manage_secretaria(db, usuario, secretaria_id)

    normalized_name, normalized_active, normalized_default, normalized_order = (
        normalize_template_payload(nome=nome, ativo=ativo, padrao=padrao, ordem=ordem)
    )

    content = await arquivo.read()
    validate_template_upload(arquivo, content)

    relative_path = build_template_relative_path(secretaria.sigla, normalized_name, arquivo.filename)
    file_path = resolve_template_media_path(relative_path)
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_bytes(content)

    template = CertificateTemplate(
        secretaria_id=secretaria.id,
        nome=normalized_name,
        arquivo_relpath=relative_path.replace("\\", "/"),
        arquivo_mime=(arquivo.content_type or "").lower() or None,
        arquivo_bytes=len(content),
        ativo=normalized_active,
        padrao=normalized_default,
        ordem=normalized_order,
        criado_por_usuario_id=usuario.id,
    )
    db.add(template)
    db.flush()

    if template.padrao:
        clear_other_default_templates(db, secretaria.id, template.id)

    record_audit_event(
        db,
        evento="template_criado",
        descricao=f"Molde {template.nome} cadastrado para {secretaria.sigla}.",
        usuario=usuario,
        secretaria=secretaria,
        entidade_tipo="template",
        entidade_id=template.id,
    )
    db.commit()
    db.refresh(template)
    return build_template_response(template, request)


@router.patch("/api/admin/templates/{template_id}", response_model=CertificateTemplateResponse)
async def admin_update_template(
    request: Request,
    template_id: int,
    nome: str | None = Form(default=None),
    ativo: bool | None = Form(default=None),
    padrao: bool | None = Form(default=None),
    ordem: int | None = Form(default=None),
    arquivo: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> CertificateTemplateResponse:
    template = db.query(CertificateTemplate).filter(CertificateTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Molde nao encontrado.")
    require_template_manage_access(db, usuario, template)

    updated_name = template.nome if nome is None else nome
    updated_active = template.ativo if ativo is None else ativo
    updated_default = template.padrao if padrao is None else padrao
    updated_order = template.ordem if ordem is None else ordem
    normalized_name, normalized_active, normalized_default, normalized_order = (
        normalize_template_payload(
            nome=updated_name,
            ativo=updated_active,
            padrao=updated_default,
            ordem=updated_order,
        )
    )

    previous_relpath = template.arquivo_relpath
    if arquivo is not None and arquivo.filename:
        content = await arquivo.read()
        validate_template_upload(arquivo, content)
        relative_path = build_template_relative_path(
            template.secretaria.sigla,
            normalized_name,
            arquivo.filename,
        )
        file_path = resolve_template_media_path(relative_path)
        file_path.parent.mkdir(parents=True, exist_ok=True)
        file_path.write_bytes(content)
        template.arquivo_relpath = relative_path.replace("\\", "/")
        template.arquivo_mime = (arquivo.content_type or "").lower() or None
        template.arquivo_bytes = len(content)

    template.nome = normalized_name
    template.ativo = normalized_active
    template.padrao = normalized_default
    template.ordem = normalized_order

    if template.padrao:
        clear_other_default_templates(db, template.secretaria_id, template.id)

    record_audit_event(
        db,
        evento="template_atualizado",
        descricao=f"Molde {template.nome} atualizado para {template.secretaria.sigla}.",
        usuario=usuario,
        secretaria=template.secretaria,
        entidade_tipo="template",
        entidade_id=template.id,
    )
    db.commit()
    db.refresh(template)

    if previous_relpath != template.arquivo_relpath:
        previous_path = resolve_template_media_path(previous_relpath)
        if previous_path.exists():
            previous_path.unlink()

    return build_template_response(template, request)


@router.delete("/api/admin/templates/{template_id}", response_model=ActionResponse)
def admin_delete_template(
    template_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> ActionResponse:
    template = db.query(CertificateTemplate).filter(CertificateTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Molde nao encontrado.")
    require_template_manage_access(db, usuario, template)

    relative_path = template.arquivo_relpath
    nome = template.nome
    secretaria = template.secretaria

    record_audit_event(
        db,
        evento="template_excluido",
        descricao=f"Molde {nome} excluido de {secretaria.sigla}.",
        usuario=usuario,
        secretaria=secretaria,
        entidade_tipo="template",
        entidade_id=template.id,
    )
    db.delete(template)
    db.commit()

    file_path = resolve_template_media_path(relative_path)
    if file_path.exists():
        file_path.unlink()

    return ActionResponse(message=f"Molde {nome} excluido com sucesso.")
