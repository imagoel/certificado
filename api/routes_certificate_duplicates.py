from datetime import date

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import func
from sqlalchemy.orm import Session

from common import get_current_user, require_active_secretaria, to_response
from database import get_db
from models import Certificate, Secretaria, Usuario
from schemas import CertificateResponse


router = APIRouter()


@router.get("/api/certificados/possiveis-duplicados", response_model=list[CertificateResponse])
def list_possible_duplicate_certificates(
    request: Request,
    nome: str = Query(..., min_length=2, description="Nome completo do participante"),
    curso: str = Query(..., min_length=2, description="Nome do curso"),
    concluido: date = Query(..., description="Data de conclusao"),
    limite: int = Query(default=5, ge=1, le=20, description="Quantidade maxima de itens"),
    db: Session = Depends(get_db),
    _usuario: Usuario = Depends(get_current_user),
    secretaria: Secretaria = Depends(require_active_secretaria),
) -> list[CertificateResponse]:
    nome_normalizado = nome.strip().lower()
    curso_normalizado = curso.strip().lower()

    certificados = (
        db.query(Certificate)
        .filter(
            Certificate.secretaria_id == secretaria.id,
            Certificate.arquivo_pendente.is_(False),
            Certificate.excluido_em.is_(None),
            Certificate.concluido == concluido,
            func.lower(Certificate.nome) == nome_normalizado,
            func.lower(Certificate.curso) == curso_normalizado,
        )
        .order_by(Certificate.id.desc())
        .limit(limite)
        .all()
    )

    return [to_response(cert, request) for cert in certificados]

