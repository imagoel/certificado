import os
import re
from datetime import datetime
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from database import Base, engine, get_db
from models import Certificate
from schemas import (
    CertificateBatchCreate,
    CertificateCreate,
    CertificateResponse,
    ValidationResponse,
)
from security import calculate_certificate_hash, verify_certificate_hash

CODE_REGEX = re.compile(r"^[A-Z0-9]{1,8}-\d{4}-\d{5}$")
DEFAULT_PREFIX = os.getenv("CODE_PREFIX", "ABC")

BASE_DIR = Path(__file__).resolve().parent

app = FastAPI(
    title="Sistema de Certificados - API",
    version="1.0.0",
    description="API para registro e validação de certificados com hash SHA-256.",
)

app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

cors_origins = os.getenv("CORS_ALLOW_ORIGINS", "*")
allowed_origins = [origin.strip() for origin in cors_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event() -> None:
    Base.metadata.create_all(bind=engine)


def normalize_prefix(prefix: str | None) -> str:
    raw = (prefix or DEFAULT_PREFIX).strip().upper()
    clean = re.sub(r"[^A-Z0-9]", "", raw)
    return clean or "ABC"


def build_code(prefix: str, year: int, seq: int) -> str:
    return f"{prefix}-{year}-{seq:05d}"


def build_validation_url(request: Request, codigo: str) -> str:
    base_url = os.getenv("PUBLIC_VALIDATION_BASE_URL", "").strip().rstrip("/")
    if base_url:
        return f"{base_url}/{codigo}"
    return str(request.url_for("validar_html", codigo=codigo))


def get_last_sequence(db: Session, prefix: str, year: int) -> int:
    pattern = f"{prefix}-{year}-%"
    last = (
        db.query(Certificate.codigo)
        .filter(Certificate.codigo.like(pattern))
        .order_by(Certificate.codigo.desc())
        .first()
    )

    if not last:
        return 0

    try:
        return int(last[0].split("-")[-1])
    except (ValueError, IndexError):
        return 0


def code_exists(db: Session, codigo: str) -> bool:
    return db.query(Certificate.id).filter(Certificate.codigo == codigo).first() is not None


def to_response(
    cert: Certificate, request: Request, validation_url: str | None = None
) -> CertificateResponse:
    return CertificateResponse(
        id=cert.id,
        codigo=cert.codigo,
        nome=cert.nome,
        cpf=cert.cpf,
        curso=cert.curso,
        carga_h=cert.carga_h,
        concluido=cert.concluido,
        emitido_em=cert.emitido_em,
        hash=cert.hash,
        url_validacao=validation_url or build_validation_url(request, cert.codigo),
    )


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/certificados", response_model=CertificateResponse, status_code=201)
def create_certificate(
    payload: CertificateCreate,
    request: Request,
    db: Session = Depends(get_db),
) -> CertificateResponse:
    prefix = normalize_prefix(DEFAULT_PREFIX)
    year = payload.concluido.year

    if payload.codigo:
        codigo = payload.codigo
    else:
        next_seq = get_last_sequence(db, prefix, year) + 1
        codigo = build_code(prefix, year, next_seq)

    if not CODE_REGEX.match(codigo):
        raise HTTPException(
            status_code=422,
            detail="Código inválido. Use o padrão PREFIXO-AAAA-00001 (ex: ABC-2026-00001).",
        )

    if code_exists(db, codigo):
        raise HTTPException(status_code=409, detail=f"O código '{codigo}' já existe.")

    cert_hash = calculate_certificate_hash(
        codigo=codigo,
        nome=payload.nome,
        cpf=payload.cpf,
        curso=payload.curso,
        carga_h=payload.carga_h,
        concluido=payload.concluido.isoformat(),
    )

    cert = Certificate(
        codigo=codigo,
        nome=payload.nome,
        cpf=payload.cpf,
        curso=payload.curso,
        carga_h=payload.carga_h,
        concluido=payload.concluido,
        emitido_em=datetime.utcnow(),
        hash=cert_hash,
    )

    db.add(cert)
    db.commit()
    db.refresh(cert)
    return to_response(cert, request)


@app.post("/api/certificados/lote", response_model=list[CertificateResponse], status_code=201)
def create_certificates_batch(
    payload: CertificateBatchCreate,
    request: Request,
    db: Session = Depends(get_db),
) -> list[CertificateResponse]:
    if not payload.itens:
        return []

    prefix = normalize_prefix(payload.prefixo)
    sequence_by_year: dict[int, int] = {}
    used_codes: set[str] = set()
    created: list[Certificate] = []

    for item in payload.itens:
        year = item.concluido.year
        if year not in sequence_by_year:
            sequence_by_year[year] = get_last_sequence(db, prefix, year)

        if item.codigo:
            codigo = item.codigo
        else:
            sequence_by_year[year] += 1
            codigo = build_code(prefix, year, sequence_by_year[year])

        if not CODE_REGEX.match(codigo):
            raise HTTPException(
                status_code=422,
                detail=f"Código inválido em lote: '{codigo}'. Padrão esperado PREFIXO-AAAA-00001.",
            )

        if codigo in used_codes:
            raise HTTPException(status_code=409, detail=f"Código duplicado no lote: '{codigo}'.")
        used_codes.add(codigo)

        if code_exists(db, codigo):
            raise HTTPException(
                status_code=409, detail=f"O código '{codigo}' já existe no banco."
            )

        cert_hash = calculate_certificate_hash(
            codigo=codigo,
            nome=item.nome,
            cpf=item.cpf,
            curso=item.curso,
            carga_h=item.carga_h,
            concluido=item.concluido.isoformat(),
        )

        cert = Certificate(
            codigo=codigo,
            nome=item.nome,
            cpf=item.cpf,
            curso=item.curso,
            carga_h=item.carga_h,
            concluido=item.concluido,
            emitido_em=datetime.utcnow(),
            hash=cert_hash,
        )
        db.add(cert)
        created.append(cert)

    db.commit()

    responses: list[CertificateResponse] = []
    for cert in created:
        db.refresh(cert)
        responses.append(to_response(cert, request))

    return responses


@app.get("/api/validar/{codigo}", response_model=ValidationResponse)
def validate_certificate_json(codigo: str, db: Session = Depends(get_db)) -> ValidationResponse:
    cert = db.query(Certificate).filter(Certificate.codigo == codigo.upper()).first()
    if not cert:
        return ValidationResponse(status="nao_encontrado", codigo=codigo.upper(), valido=False)

    valido = verify_certificate_hash(
        expected_hash=cert.hash,
        codigo=cert.codigo,
        nome=cert.nome,
        cpf=cert.cpf,
        curso=cert.curso,
        carga_h=cert.carga_h,
        concluido=cert.concluido.isoformat(),
    )

    return ValidationResponse(
        status="valido" if valido else "invalido",
        codigo=cert.codigo,
        valido=valido,
        nome=cert.nome,
        curso=cert.curso,
        carga_h=cert.carga_h,
        concluido=cert.concluido,
        hash=cert.hash,
    )


@app.get("/validar/{codigo}", response_class=HTMLResponse, name="validar_html")
def validate_certificate_html(
    request: Request,
    codigo: str,
    db: Session = Depends(get_db),
) -> HTMLResponse:
    cert = db.query(Certificate).filter(Certificate.codigo == codigo.upper()).first()

    if not cert:
        return templates.TemplateResponse(
            "validacao.html",
            {
                "request": request,
                "status": "nao_encontrado",
                "codigo": codigo.upper(),
                "certificado": None,
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

    return templates.TemplateResponse(
        "validacao.html",
        {
            "request": request,
            "status": "valido" if valido else "invalido",
            "codigo": cert.codigo,
            "certificado": cert,
        },
    )
