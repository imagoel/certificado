from io import BytesIO

import qrcode
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import HTMLResponse, Response
from sqlalchemy.orm import Session

from common import (
    build_certificate_file_url,
    is_certificate_ready,
    sanitize_code,
    templates,
)
from database import get_db
from models import Certificate
from schemas import ValidationResponse
from security import verify_certificate_hash


router = APIRouter()


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/api/qrcode")
def generate_qr_code(
    texto: str = Query(..., min_length=1, max_length=2048, description="Conteudo do QR Code"),
) -> Response:
    content = texto.strip()
    if not content:
        raise HTTPException(status_code=422, detail="O texto do QR Code e obrigatorio.")

    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=1,
    )
    qr.add_data(content)
    qr.make(fit=True)

    image = qr.make_image(fill_color="#112031", back_color="white")
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    return Response(content=buffer.getvalue(), media_type="image/png")


@router.get("/api/validar/{codigo}", response_model=ValidationResponse)
def validate_certificate_json(
    codigo: str,
    request: Request,
    db: Session = Depends(get_db),
) -> ValidationResponse:
    normalized_code = sanitize_code(codigo)
    cert = db.query(Certificate).filter(Certificate.codigo == normalized_code).first()
    if not cert or cert.arquivo_pendente:
        return ValidationResponse(status="nao_encontrado", codigo=normalized_code, valido=False)

    valido = verify_certificate_hash(
        expected_hash=cert.hash,
        codigo=cert.codigo,
        nome=cert.nome,
        cpf=cert.cpf,
        curso=cert.curso,
        carga_h=cert.carga_h,
        concluido=cert.concluido.isoformat(),
    )
    file_available = is_certificate_ready(cert)

    return ValidationResponse(
        status="valido" if valido else "invalido",
        codigo=cert.codigo,
        valido=valido,
        nome=cert.nome,
        curso=cert.curso,
        carga_h=cert.carga_h,
        concluido=cert.concluido,
        hash=cert.hash,
        arquivo_disponivel=file_available,
        arquivo_url=build_certificate_file_url(request, cert.codigo) if file_available else None,
    )


@router.get("/validar/{codigo}", response_class=HTMLResponse, name="validar_html")
def validate_certificate_html(
    request: Request,
    codigo: str,
    db: Session = Depends(get_db),
) -> HTMLResponse:
    normalized_code = sanitize_code(codigo)
    cert = db.query(Certificate).filter(Certificate.codigo == normalized_code).first()

    if not cert or cert.arquivo_pendente:
        return templates.TemplateResponse(
            "validacao.html",
            {
                "request": request,
                "status": "nao_encontrado",
                "codigo": normalized_code,
                "certificado": None,
                "arquivo_url": None,
            },
        )

    valido = verify_certificate_hash(
        expected_hash=cert.hash,
        codigo=cert.codigo,
        nome=cert.nome,
        cpf=cert.cpf,
        curso=cert.curso,
        carga_h=cert.carga_h,
        concluido=cert.concluido.isoformat(),
    )
    file_available = is_certificate_ready(cert)

    return templates.TemplateResponse(
        "validacao.html",
        {
            "request": request,
            "status": "valido" if valido else "invalido",
            "codigo": cert.codigo,
            "certificado": cert,
            "arquivo_url": build_certificate_file_url(request, cert.codigo) if file_available else None,
        },
    )
