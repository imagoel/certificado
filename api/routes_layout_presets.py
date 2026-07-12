from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import func
from sqlalchemy.orm import Session

from audit_service import record_audit_event
from common import (
    build_layout_preset_response,
    get_accessible_secretarias,
    get_current_user,
    is_admin,
    require_active_secretaria,
    utc_now,
)
from database import get_db
from models import CertificateLayoutPreset, Secretaria, Usuario
from schemas import (
    CertificateLayoutPresetCreate,
    CertificateLayoutPresetResponse,
    CertificateLayoutPresetUpdate,
)


router = APIRouter()


def normalize_layout_preset_name(nome: str) -> str:
    normalized = (nome or "").strip()
    if len(normalized) < 2:
        raise HTTPException(status_code=422, detail="Informe um nome com pelo menos 2 caracteres.")
    if len(normalized) > 120:
        raise HTTPException(status_code=422, detail="O nome do layout deve ter ate 120 caracteres.")
    return normalized


def normalize_layout_payload(payload: dict) -> dict:
    if not isinstance(payload, dict):
        raise HTTPException(status_code=422, detail="O layout salvo deve ser um objeto JSON.")
    if not payload:
        raise HTTPException(status_code=422, detail="O layout salvo nao pode ficar vazio.")
    return payload


def get_allowed_secretaria_ids(db: Session, usuario: Usuario) -> set[int] | None:
    if is_admin(usuario):
        return None
    return {secretaria.id for secretaria in get_accessible_secretarias(db, usuario)}


def ensure_layout_secretaria_access(db: Session, usuario: Usuario, secretaria_id: int) -> None:
    allowed_ids = get_allowed_secretaria_ids(db, usuario)
    if allowed_ids is not None and secretaria_id not in allowed_ids:
        raise HTTPException(status_code=403, detail="Secretaria nao permitida para este usuario.")


def get_layout_preset_or_404(db: Session, preset_id: int) -> CertificateLayoutPreset:
    preset = db.query(CertificateLayoutPreset).filter(CertificateLayoutPreset.id == preset_id).first()
    if not preset:
        raise HTTPException(status_code=404, detail="Layout salvo nao encontrado.")
    return preset


def find_layout_preset_by_name(
    db: Session,
    secretaria_id: int,
    nome: str,
) -> CertificateLayoutPreset | None:
    return (
        db.query(CertificateLayoutPreset)
        .filter(
            CertificateLayoutPreset.secretaria_id == secretaria_id,
            func.lower(CertificateLayoutPreset.nome) == nome.lower(),
        )
        .first()
    )


@router.get("/api/layout-presets", response_model=list[CertificateLayoutPresetResponse])
def list_layout_presets(
    secretaria_id: int | None = Query(default=None, ge=1),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
    secretaria_ativa: Secretaria = Depends(require_active_secretaria),
) -> list[CertificateLayoutPresetResponse]:
    target_secretaria_id = secretaria_id or secretaria_ativa.id
    ensure_layout_secretaria_access(db, usuario, target_secretaria_id)

    presets = (
        db.query(CertificateLayoutPreset)
        .filter(CertificateLayoutPreset.secretaria_id == target_secretaria_id)
        .order_by(CertificateLayoutPreset.nome.asc(), CertificateLayoutPreset.id.asc())
        .all()
    )
    return [build_layout_preset_response(preset) for preset in presets]


@router.post("/api/layout-presets", response_model=CertificateLayoutPresetResponse)
def save_layout_preset(
    payload: CertificateLayoutPresetCreate,
    response: Response,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
    secretaria_ativa: Secretaria = Depends(require_active_secretaria),
) -> CertificateLayoutPresetResponse:
    nome = normalize_layout_preset_name(payload.nome)
    layout_payload = normalize_layout_payload(payload.payload)
    preset = find_layout_preset_by_name(db, secretaria_ativa.id, nome)

    if preset:
        preset.nome = nome
        preset.payload = layout_payload
        preset.atualizado_em = utc_now()
        audit_event = "layout_preset_atualizado"
        audit_description = f"Layout {preset.nome} atualizado para {secretaria_ativa.sigla}."
    else:
        preset = CertificateLayoutPreset(
            secretaria_id=secretaria_ativa.id,
            nome=nome,
            payload=layout_payload,
            criado_por_usuario_id=usuario.id,
            atualizado_em=utc_now(),
        )
        db.add(preset)
        db.flush()
        response.status_code = 201
        audit_event = "layout_preset_criado"
        audit_description = f"Layout {preset.nome} salvo para {secretaria_ativa.sigla}."

    record_audit_event(
        db,
        evento=audit_event,
        descricao=audit_description,
        usuario=usuario,
        secretaria=secretaria_ativa,
        entidade_tipo="layout_preset",
        entidade_id=preset.id,
    )
    db.commit()
    db.refresh(preset)
    return build_layout_preset_response(preset)


@router.patch("/api/layout-presets/{preset_id}", response_model=CertificateLayoutPresetResponse)
def update_layout_preset(
    preset_id: int,
    payload: CertificateLayoutPresetUpdate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> CertificateLayoutPresetResponse:
    preset = get_layout_preset_or_404(db, preset_id)
    ensure_layout_secretaria_access(db, usuario, preset.secretaria_id)

    if payload.nome is not None:
        next_name = normalize_layout_preset_name(payload.nome)
        existing = find_layout_preset_by_name(db, preset.secretaria_id, next_name)
        if existing and existing.id != preset.id:
            raise HTTPException(
                status_code=409,
                detail="Ja existe um layout salvo com esse nome nesta secretaria.",
            )
        preset.nome = next_name

    if payload.payload is not None:
        preset.payload = normalize_layout_payload(payload.payload)

    preset.atualizado_em = utc_now()
    record_audit_event(
        db,
        evento="layout_preset_atualizado",
        descricao=f"Layout {preset.nome} atualizado.",
        usuario=usuario,
        secretaria=preset.secretaria,
        entidade_tipo="layout_preset",
        entidade_id=preset.id,
    )
    db.commit()
    db.refresh(preset)
    return build_layout_preset_response(preset)
