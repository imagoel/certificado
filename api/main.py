import math
import os
import re
from datetime import datetime
from io import BytesIO
from pathlib import Path

import qrcode
from fastapi import Depends, FastAPI, File, HTTPException, Query, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, Response
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from database import Base, engine, get_db
from models import Certificate
from schemas import (
    CertificateBatchCreate,
    CertificateCreate,
    CertificateResponse,
    PaginatedCertificateResponse,
    ValidationResponse,
)
from security import calculate_certificate_hash, verify_certificate_hash

CODE_REGEX = re.compile(r"^[A-Z0-9]{1,8}-\d{4}-\d{5}$")
DEFAULT_PREFIX = os.getenv("CODE_PREFIX", "ABC")
DEFAULT_MEDIA_DIR = str((Path(__file__).resolve().parent / "data" / "certificados"))
CERTIFICADOS_MEDIA_DIR = Path(os.getenv("CERTIFICADOS_MEDIA_DIR", DEFAULT_MEDIA_DIR)).resolve()
MAX_UPLOAD_BYTES = int(os.getenv("CERTIFICADOS_MAX_UPLOAD_BYTES", "5242880"))

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
    ensure_certificate_schema()
    CERTIFICADOS_MEDIA_DIR.mkdir(parents=True, exist_ok=True)


def ensure_certificate_schema() -> None:
    try:
        inspector = inspect(engine)
        columns = {column["name"] for column in inspector.get_columns("certificados")}
    except Exception:
        return

    statements: list[str] = []
    if "arquivo_relpath" not in columns:
        statements.append("ALTER TABLE certificados ADD COLUMN arquivo_relpath VARCHAR(255)")
    if "arquivo_mime" not in columns:
        statements.append("ALTER TABLE certificados ADD COLUMN arquivo_mime VARCHAR(100)")
    if "arquivo_bytes" not in columns:
        statements.append("ALTER TABLE certificados ADD COLUMN arquivo_bytes INTEGER")

    if not statements:
        return

    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))


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


def sanitize_code(codigo: str) -> str:
    return (codigo or "").strip().upper()


def build_file_relative_path(codigo: str) -> str:
    normalized = sanitize_code(codigo)
    year = datetime.utcnow().year
    parts = normalized.split("-")
    if len(parts) >= 2 and parts[1].isdigit():
        year = int(parts[1])
    return f"{year}/{normalized}.png"


def resolve_media_path(relative_path: str) -> Path:
    candidate = (CERTIFICADOS_MEDIA_DIR / relative_path).resolve()
    if not str(candidate).startswith(str(CERTIFICADOS_MEDIA_DIR)):
        raise HTTPException(status_code=400, detail="Caminho de arquivo inválido.")
    return candidate


def has_certificate_file(cert: Certificate) -> bool:
    if not cert.arquivo_relpath:
        return False
    try:
        file_path = resolve_media_path(cert.arquivo_relpath)
    except HTTPException:
        return False
    return file_path.exists() and file_path.is_file()


def build_certificate_file_url(request: Request, codigo: str) -> str:
    return str(request.url_for("get_certificate_file", codigo=sanitize_code(codigo)))


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
    file_available = has_certificate_file(cert)
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
        arquivo_disponivel=file_available,
        arquivo_url=build_certificate_file_url(request, cert.codigo) if file_available else None,
    )


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/qrcode")
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



@app.get("/api/certificados", response_model=PaginatedCertificateResponse)
def list_certificates(
    request: Request,
    pagina: int = Query(default=1, ge=1, description="Número da página"),
    por_pagina: int = Query(default=20, ge=1, le=100, description="Itens por página"),
    nome: str = Query(default="", description="Filtrar por nome (busca parcial)"),
    curso: str = Query(default="", description="Filtrar por curso (busca parcial)"),
    db: Session = Depends(get_db),
) -> PaginatedCertificateResponse:
    query = db.query(Certificate)

    if nome.strip():
        query = query.filter(Certificate.nome.ilike(f"%{nome.strip()}%"))
    if curso.strip():
        query = query.filter(Certificate.curso.ilike(f"%{curso.strip()}%"))

    total = query.count()
    paginas = max(1, math.ceil(total / por_pagina))
    offset = (pagina - 1) * por_pagina

    certificates = (
        query.order_by(Certificate.id.desc())
        .offset(offset)
        .limit(por_pagina)
        .all()
    )

    return PaginatedCertificateResponse(
        total=total,
        pagina=pagina,
        por_pagina=por_pagina,
        paginas=paginas,
        itens=[to_response(cert, request) for cert in certificates],
    )


@app.post("/api/certificados", response_model=CertificateResponse, status_code=201)
def create_certificate(
    payload: CertificateCreate,
    request: Request,
    db: Session = Depends(get_db),
) -> CertificateResponse:
    prefix = normalize_prefix(DEFAULT_PREFIX)
    year = payload.concluido.year

    if payload.codigo:
        codigo = sanitize_code(payload.codigo)
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
            codigo = sanitize_code(item.codigo)
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


def validate_png_upload(uploaded: UploadFile, content: bytes) -> None:
    if not uploaded.filename:
        raise HTTPException(status_code=400, detail="Arquivo PNG é obrigatório.")

    if not content:
        raise HTTPException(status_code=400, detail="Arquivo enviado está vazio.")

    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"Arquivo muito grande. Limite atual: {MAX_UPLOAD_BYTES} bytes.",
        )

    content_type = (uploaded.content_type or "").lower()
    if content_type and content_type not in ("image/png", "application/octet-stream"):
        raise HTTPException(status_code=415, detail="Somente arquivos PNG são aceitos.")

    if not content.startswith(b"\x89PNG\r\n\x1a\n"):
        raise HTTPException(status_code=415, detail="Arquivo inválido. Envie um PNG válido.")


@app.post(
    "/api/certificados/{codigo}/arquivo",
    response_model=CertificateResponse,
    status_code=201,
)
async def upload_certificate_file(
    codigo: str,
    request: Request,
    arquivo: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> CertificateResponse:
    normalized_code = sanitize_code(codigo)
    cert = db.query(Certificate).filter(Certificate.codigo == normalized_code).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificado não encontrado.")

    content = await arquivo.read()
    validate_png_upload(arquivo, content)

    relative_path = build_file_relative_path(cert.codigo)
    file_path = resolve_media_path(relative_path)
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_bytes(content)

    cert.arquivo_relpath = relative_path.replace("\\", "/")
    cert.arquivo_mime = "image/png"
    cert.arquivo_bytes = len(content)
    db.commit()
    db.refresh(cert)
    return to_response(cert, request)


@app.get("/api/certificados/{codigo}/arquivo", name="get_certificate_file")
def get_certificate_file(codigo: str, db: Session = Depends(get_db)) -> FileResponse:
    normalized_code = sanitize_code(codigo)
    cert = db.query(Certificate).filter(Certificate.codigo == normalized_code).first()
    if not cert or not cert.arquivo_relpath:
        raise HTTPException(status_code=404, detail="Arquivo de certificado não encontrado.")

    file_path = resolve_media_path(cert.arquivo_relpath)
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="Arquivo de certificado não encontrado.")

    return FileResponse(
        path=file_path,
        media_type=cert.arquivo_mime or "image/png",
        filename=f"{cert.codigo}.png",
    )


@app.get("/api/validar/{codigo}", response_model=ValidationResponse)
def validate_certificate_json(
    codigo: str,
    request: Request,
    db: Session = Depends(get_db),
) -> ValidationResponse:
    normalized_code = sanitize_code(codigo)
    cert = db.query(Certificate).filter(Certificate.codigo == normalized_code).first()
    if not cert:
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
    file_available = has_certificate_file(cert)

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


@app.get("/validar/{codigo}", response_class=HTMLResponse, name="validar_html")
def validate_certificate_html(
    request: Request,
    codigo: str,
    db: Session = Depends(get_db),
) -> HTMLResponse:
    normalized_code = sanitize_code(codigo)
    cert = db.query(Certificate).filter(Certificate.codigo == normalized_code).first()

    if not cert:
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
    file_available = has_certificate_file(cert)

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
