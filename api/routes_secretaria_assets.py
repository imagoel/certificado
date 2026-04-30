from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Request, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from common import (
    build_secretaria_asset_file_response,
    build_secretaria_asset_relative_path,
    build_secretaria_asset_response,
    ensure_secretaria_asset_access,
    get_accessible_secretarias,
    get_current_user,
    is_admin,
    normalize_secretaria_asset_type,
    record_audit_event,
    require_active_secretaria,
    resolve_template_media_path,
    validate_template_upload,
)
from database import get_db
from models import Secretaria, SecretariaAsset, Usuario
from schemas import ActionResponse, SecretariaAssetResponse


router = APIRouter()


def normalize_secretaria_asset_payload(
    *,
    tipo: str,
    nome: str,
    ativo: bool,
    padrao: bool,
    ordem: int,
) -> tuple[str, str, bool, bool, int]:
    normalized_type = normalize_secretaria_asset_type(tipo)
    normalized_name = (nome or "").strip()
    if len(normalized_name) < 2:
        raise HTTPException(status_code=422, detail="Informe um nome com pelo menos 2 caracteres.")

    normalized_order = max(0, int(ordem))
    if padrao and not ativo:
        raise HTTPException(status_code=422, detail="Um asset padrao precisa estar ativo.")
    return normalized_type, normalized_name, bool(ativo), bool(padrao), normalized_order


def clear_other_default_assets(
    db: Session,
    secretaria_id: int,
    tipo: str,
    current_asset_id: int | None,
) -> None:
    query = db.query(SecretariaAsset).filter(
        SecretariaAsset.secretaria_id == secretaria_id,
        SecretariaAsset.tipo == tipo,
    )
    if current_asset_id:
        query = query.filter(SecretariaAsset.id != current_asset_id)
    query.update({SecretariaAsset.padrao: False}, synchronize_session=False)


def secretaria_asset_query(db: Session):
    return db.query(SecretariaAsset).join(
        Secretaria,
        SecretariaAsset.secretaria_id == Secretaria.id,
    )


def get_manageable_secretaria_ids(db: Session, usuario: Usuario) -> set[int] | None:
    if is_admin(usuario):
        return None
    return {secretaria.id for secretaria in get_accessible_secretarias(db, usuario)}


def require_asset_manage_secretaria(db: Session, usuario: Usuario, secretaria_id: int) -> Secretaria:
    secretaria = db.query(Secretaria).filter(Secretaria.id == secretaria_id).first()
    if not secretaria:
        raise HTTPException(status_code=404, detail="Secretaria nao encontrada.")

    allowed_ids = get_manageable_secretaria_ids(db, usuario)
    if allowed_ids is not None and secretaria.id not in allowed_ids:
        raise HTTPException(status_code=403, detail="Secretaria nao permitida para este usuario.")
    return secretaria


def require_asset_manage_access(db: Session, usuario: Usuario, asset: SecretariaAsset) -> None:
    allowed_ids = get_manageable_secretaria_ids(db, usuario)
    if allowed_ids is not None and asset.secretaria_id not in allowed_ids:
        raise HTTPException(status_code=403, detail="Acesso negado a este asset da secretaria.")


@router.get("/api/secretaria-assets", response_model=list[SecretariaAssetResponse])
def list_assets_for_active_secretaria(
    request: Request,
    tipo: str = Query(...),
    secretaria_id: int | None = Query(default=None, ge=1),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
    secretaria_ativa: Secretaria = Depends(require_active_secretaria),
) -> list[SecretariaAssetResponse]:
    normalized_type = normalize_secretaria_asset_type(tipo)
    target_secretaria_id = secretaria_id or secretaria_ativa.id

    if not is_admin(usuario):
        allowed_secretaria_ids = {secretaria.id for secretaria in usuario.secretarias if secretaria.ativa}
        if target_secretaria_id not in allowed_secretaria_ids:
            raise HTTPException(status_code=403, detail="Secretaria nao permitida para este usuario.")

    assets = (
        secretaria_asset_query(db)
        .filter(
            SecretariaAsset.secretaria_id == target_secretaria_id,
            SecretariaAsset.tipo == normalized_type,
            SecretariaAsset.ativo.is_(True),
        )
        .order_by(
            SecretariaAsset.padrao.desc(),
            SecretariaAsset.ordem.asc(),
            SecretariaAsset.nome.asc(),
            SecretariaAsset.id.asc(),
        )
        .all()
    )
    return [build_secretaria_asset_response(asset, request) for asset in assets]


@router.get("/api/secretaria-assets/{asset_id}/arquivo", name="get_secretaria_asset_file")
def get_secretaria_asset_file(
    asset_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> FileResponse:
    asset = db.query(SecretariaAsset).filter(SecretariaAsset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset da secretaria nao encontrado.")

    ensure_secretaria_asset_access(db, usuario, asset)
    return build_secretaria_asset_file_response(asset)


@router.get("/api/admin/secretaria-assets", response_model=list[SecretariaAssetResponse])
def admin_list_secretaria_assets(
    request: Request,
    tipo: str | None = Query(default=None),
    secretaria_id: int | None = Query(default=None, ge=1),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> list[SecretariaAssetResponse]:
    query = secretaria_asset_query(db)
    allowed_ids = get_manageable_secretaria_ids(db, usuario)
    if allowed_ids is not None:
        if secretaria_id and secretaria_id not in allowed_ids:
            raise HTTPException(status_code=403, detail="Secretaria nao permitida para este usuario.")
        query = query.filter(SecretariaAsset.secretaria_id.in_(allowed_ids))
    if tipo:
        query = query.filter(SecretariaAsset.tipo == normalize_secretaria_asset_type(tipo))
    if secretaria_id:
        query = query.filter(SecretariaAsset.secretaria_id == secretaria_id)

    assets = (
        query.order_by(
            Secretaria.sigla.asc(),
            SecretariaAsset.tipo.asc(),
            SecretariaAsset.padrao.desc(),
            SecretariaAsset.ordem.asc(),
            SecretariaAsset.nome.asc(),
            SecretariaAsset.id.asc(),
        ).all()
    )
    return [build_secretaria_asset_response(asset, request) for asset in assets]


@router.post("/api/admin/secretaria-assets", response_model=SecretariaAssetResponse, status_code=201)
async def admin_create_secretaria_asset(
    request: Request,
    secretaria_id: int = Form(..., ge=1),
    tipo: str = Form(...),
    nome: str = Form(...),
    ativo: bool = Form(True),
    padrao: bool = Form(False),
    ordem: int = Form(0),
    arquivo: UploadFile = File(...),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> SecretariaAssetResponse:
    secretaria = require_asset_manage_secretaria(db, usuario, secretaria_id)

    normalized_type, normalized_name, normalized_active, normalized_default, normalized_order = (
        normalize_secretaria_asset_payload(
            tipo=tipo,
            nome=nome,
            ativo=ativo,
            padrao=padrao,
            ordem=ordem,
        )
    )

    content = await arquivo.read()
    validate_template_upload(arquivo, content)

    relative_path = build_secretaria_asset_relative_path(
        secretaria.sigla,
        normalized_type,
        normalized_name,
        arquivo.filename,
    )
    file_path = resolve_template_media_path(relative_path)
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_bytes(content)

    asset = SecretariaAsset(
        secretaria_id=secretaria.id,
        tipo=normalized_type,
        nome=normalized_name,
        arquivo_relpath=relative_path.replace("\\", "/"),
        arquivo_mime=(arquivo.content_type or "").lower() or None,
        arquivo_bytes=len(content),
        ativo=normalized_active,
        padrao=normalized_default,
        ordem=normalized_order,
        criado_por_usuario_id=usuario.id,
    )
    db.add(asset)
    db.flush()

    if asset.padrao:
        clear_other_default_assets(db, secretaria.id, asset.tipo, asset.id)

    record_audit_event(
        db,
        evento=f"secretaria_asset_{asset.tipo}_criado",
        descricao=f"{asset.tipo.title()} {asset.nome} cadastrada para {secretaria.sigla}.",
        usuario=usuario,
        secretaria=secretaria,
        entidade_tipo=f"secretaria_asset_{asset.tipo}",
        entidade_id=asset.id,
    )
    db.commit()
    db.refresh(asset)
    return build_secretaria_asset_response(asset, request)


@router.patch("/api/admin/secretaria-assets/{asset_id}", response_model=SecretariaAssetResponse)
async def admin_update_secretaria_asset(
    request: Request,
    asset_id: int,
    nome: str | None = Form(default=None),
    ativo: bool | None = Form(default=None),
    padrao: bool | None = Form(default=None),
    ordem: int | None = Form(default=None),
    arquivo: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> SecretariaAssetResponse:
    asset = db.query(SecretariaAsset).filter(SecretariaAsset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset da secretaria nao encontrado.")
    require_asset_manage_access(db, usuario, asset)

    updated_name = asset.nome if nome is None else nome
    updated_active = asset.ativo if ativo is None else ativo
    updated_default = asset.padrao if padrao is None else padrao
    updated_order = asset.ordem if ordem is None else ordem
    normalized_type, normalized_name, normalized_active, normalized_default, normalized_order = (
        normalize_secretaria_asset_payload(
            tipo=asset.tipo,
            nome=updated_name,
            ativo=updated_active,
            padrao=updated_default,
            ordem=updated_order,
        )
    )

    previous_relpath = asset.arquivo_relpath
    if arquivo is not None and arquivo.filename:
        content = await arquivo.read()
        validate_template_upload(arquivo, content)
        relative_path = build_secretaria_asset_relative_path(
            asset.secretaria.sigla,
            normalized_type,
            normalized_name,
            arquivo.filename,
        )
        file_path = resolve_template_media_path(relative_path)
        file_path.parent.mkdir(parents=True, exist_ok=True)
        file_path.write_bytes(content)
        asset.arquivo_relpath = relative_path.replace("\\", "/")
        asset.arquivo_mime = (arquivo.content_type or "").lower() or None
        asset.arquivo_bytes = len(content)

    asset.nome = normalized_name
    asset.ativo = normalized_active
    asset.padrao = normalized_default
    asset.ordem = normalized_order

    if asset.padrao:
        clear_other_default_assets(db, asset.secretaria_id, asset.tipo, asset.id)

    record_audit_event(
        db,
        evento=f"secretaria_asset_{asset.tipo}_atualizado",
        descricao=f"{asset.tipo.title()} {asset.nome} atualizada para {asset.secretaria.sigla}.",
        usuario=usuario,
        secretaria=asset.secretaria,
        entidade_tipo=f"secretaria_asset_{asset.tipo}",
        entidade_id=asset.id,
    )
    db.commit()
    db.refresh(asset)

    if previous_relpath != asset.arquivo_relpath:
        previous_path = resolve_template_media_path(previous_relpath)
        if previous_path.exists():
            previous_path.unlink()

    return build_secretaria_asset_response(asset, request)


@router.delete("/api/admin/secretaria-assets/{asset_id}", response_model=ActionResponse)
def admin_delete_secretaria_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> ActionResponse:
    asset = db.query(SecretariaAsset).filter(SecretariaAsset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset da secretaria nao encontrado.")
    require_asset_manage_access(db, usuario, asset)

    relative_path = asset.arquivo_relpath
    nome = asset.nome
    tipo = asset.tipo
    secretaria = asset.secretaria

    record_audit_event(
        db,
        evento=f"secretaria_asset_{tipo}_excluido",
        descricao=f"{tipo.title()} {nome} excluida de {secretaria.sigla}.",
        usuario=usuario,
        secretaria=secretaria,
        entidade_tipo=f"secretaria_asset_{tipo}",
        entidade_id=asset.id,
    )
    db.delete(asset)
    db.commit()

    file_path = resolve_template_media_path(relative_path)
    if file_path.exists():
        file_path.unlink()

    return ActionResponse(message=f"{tipo.title()} {nome} excluida com sucesso.")
