import math
from datetime import date, datetime

from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import or_
from sqlalchemy.orm import Session

from common import (
    CODE_REGEX,
    DEFAULT_PREFIX,
    build_certificate_file_response,
    build_code,
    build_file_relative_path,
    code_exists,
    ensure_certificate_access,
    get_accessible_secretarias,
    get_current_user,
    get_last_sequence,
    has_certificate_file,
    is_admin,
    normalize_prefix,
    record_audit_event,
    require_active_secretaria,
    resolve_media_path,
    sanitize_code,
    to_response,
    utc_now,
    validate_png_upload,
)
from database import get_db
from models import Certificate, Secretaria, Usuario
from schemas import (
    CertificateBatchCreate,
    CertificateCreate,
    CertificateResponse,
    PaginatedCertificateResponse,
)
from security import calculate_certificate_hash


router = APIRouter()


@router.get("/api/certificados", response_model=PaginatedCertificateResponse)
def list_certificates(
    request: Request,
    pagina: int = Query(default=1, ge=1, description="Numero da pagina"),
    por_pagina: int = Query(default=20, ge=1, le=100, description="Itens por pagina"),
    busca: str = Query(default="", description="Busca geral por codigo, nome ou curso"),
    codigo: str = Query(default="", description="Filtrar por codigo"),
    nome: str = Query(default="", description="Filtrar por nome"),
    curso: str = Query(default="", description="Filtrar por curso"),
    concluido_de: date | None = Query(default=None, description="Filtrar conclusao a partir de"),
    concluido_ate: date | None = Query(default=None, description="Filtrar conclusao ate"),
    emitido_de: date | None = Query(default=None, description="Filtrar emissao a partir de"),
    emitido_ate: date | None = Query(default=None, description="Filtrar emissao ate"),
    somente_com_arquivo: bool = Query(
        default=False, description="Retornar apenas certificados com PNG salvo"
    ),
    secretaria_id: int | None = Query(default=None, ge=1, description="Filtrar por secretaria"),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> PaginatedCertificateResponse:
    query = db.query(Certificate)

    if busca.strip():
        term = f"%{busca.strip()}%"
        query = query.filter(
            or_(
                Certificate.codigo.ilike(term),
                Certificate.nome.ilike(term),
                Certificate.curso.ilike(term),
            )
        )
    if codigo.strip():
        query = query.filter(Certificate.codigo.ilike(f"%{codigo.strip()}%"))
    if nome.strip():
        query = query.filter(Certificate.nome.ilike(f"%{nome.strip()}%"))
    if curso.strip():
        query = query.filter(Certificate.curso.ilike(f"%{curso.strip()}%"))
    if concluido_de:
        query = query.filter(Certificate.concluido >= concluido_de)
    if concluido_ate:
        query = query.filter(Certificate.concluido <= concluido_ate)
    if emitido_de:
        query = query.filter(Certificate.emitido_em >= datetime.combine(emitido_de, datetime.min.time()))
    if emitido_ate:
        query = query.filter(Certificate.emitido_em < datetime.combine(emitido_ate, datetime.max.time()))
    if somente_com_arquivo:
        query = query.filter(Certificate.arquivo_relpath.isnot(None))

    if is_admin(usuario):
        if secretaria_id:
            query = query.filter(Certificate.secretaria_id == secretaria_id)
    else:
        allowed_secretaria_ids = {secretaria.id for secretaria in get_accessible_secretarias(db, usuario)}
        if not allowed_secretaria_ids:
            return PaginatedCertificateResponse(
                total=0,
                pagina=pagina,
                por_pagina=por_pagina,
                paginas=1,
                itens=[],
            )

        if secretaria_id and secretaria_id not in allowed_secretaria_ids:
            raise HTTPException(status_code=403, detail="Secretaria nao permitida para este usuario.")

        query = query.filter(Certificate.secretaria_id.in_(allowed_secretaria_ids))
        if secretaria_id:
            query = query.filter(Certificate.secretaria_id == secretaria_id)

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


@router.post("/api/certificados", response_model=CertificateResponse, status_code=201)
def create_certificate(
    payload: CertificateCreate,
    request: Request,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
    secretaria: Secretaria = Depends(require_active_secretaria),
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
            detail="Codigo invalido. Use o padrao PREFIXO-AAAA-00001 (ex: ABC-2026-00001).",
        )

    if code_exists(db, codigo):
        raise HTTPException(status_code=409, detail=f"O codigo '{codigo}' ja existe.")

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
        emitido_em=utc_now(),
        hash=cert_hash,
        secretaria_id=secretaria.id,
        emitido_por_usuario_id=usuario.id,
    )

    db.add(cert)
    db.commit()
    db.refresh(cert)
    record_audit_event(
        db,
        evento="certificado_criado",
        descricao=f"Certificado {cert.codigo} emitido para {cert.nome}.",
        usuario=usuario,
        secretaria=secretaria,
        certificado=cert,
        entidade_tipo="certificado",
        entidade_id=cert.id,
    )
    db.commit()
    db.refresh(cert)
    return to_response(cert, request)


@router.post("/api/certificados/lote", response_model=list[CertificateResponse], status_code=201)
def create_certificates_batch(
    payload: CertificateBatchCreate,
    request: Request,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
    secretaria: Secretaria = Depends(require_active_secretaria),
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
                detail=f"Codigo invalido em lote: '{codigo}'. Padrao esperado PREFIXO-AAAA-00001.",
            )

        if codigo in used_codes:
            raise HTTPException(status_code=409, detail=f"Codigo duplicado no lote: '{codigo}'.")
        used_codes.add(codigo)

        if code_exists(db, codigo):
            raise HTTPException(
                status_code=409, detail=f"O codigo '{codigo}' ja existe no banco."
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
            emitido_em=utc_now(),
            hash=cert_hash,
            secretaria_id=secretaria.id,
            emitido_por_usuario_id=usuario.id,
        )
        db.add(cert)
        created.append(cert)

    db.commit()

    responses: list[CertificateResponse] = []
    for cert in created:
        db.refresh(cert)
        responses.append(to_response(cert, request))

    first_code = created[0].codigo if created else "-"
    last_code = created[-1].codigo if created else "-"
    record_audit_event(
        db,
        evento="certificado_lote_criado",
        descricao=(
            f"Lote com {len(created)} certificado(s) emitido. "
            f"Faixa: {first_code} ate {last_code}."
        ),
        usuario=usuario,
        secretaria=secretaria,
        entidade_tipo="certificado_lote",
        entidade_id=len(created),
    )
    db.commit()
    return responses


@router.post(
    "/api/certificados/{codigo}/arquivo",
    response_model=CertificateResponse,
    status_code=201,
)
async def upload_certificate_file(
    codigo: str,
    request: Request,
    arquivo: UploadFile = File(...),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> CertificateResponse:
    normalized_code = sanitize_code(codigo)
    cert = db.query(Certificate).filter(Certificate.codigo == normalized_code).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificado nao encontrado.")

    ensure_certificate_access(db, usuario, cert)

    content = await arquivo.read()
    validate_png_upload(arquivo, content)

    relative_path = build_file_relative_path(cert.codigo)
    file_path = resolve_media_path(relative_path)
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_bytes(content)

    cert.arquivo_relpath = relative_path.replace("\\", "/")
    cert.arquivo_mime = "image/png"
    cert.arquivo_bytes = len(content)
    record_audit_event(
        db,
        evento="certificado_png_enviado",
        descricao=f"PNG do certificado {cert.codigo} enviado ao servidor.",
        usuario=usuario,
        secretaria=cert.secretaria,
        certificado=cert,
        entidade_tipo="certificado",
        entidade_id=cert.id,
    )
    db.commit()
    db.refresh(cert)
    return to_response(cert, request)


@router.get("/api/certificados/{codigo}/arquivo", name="get_certificate_file")
def get_certificate_file(codigo: str, db: Session = Depends(get_db)) -> FileResponse:
    normalized_code = sanitize_code(codigo)
    cert = db.query(Certificate).filter(Certificate.codigo == normalized_code).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Arquivo de certificado nao encontrado.")

    return build_certificate_file_response(cert)


@router.get("/api/certificados/{codigo}/arquivo-interno", name="get_certificate_file_internal")
def get_certificate_file_internal(
    codigo: str,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> FileResponse:
    normalized_code = sanitize_code(codigo)
    cert = db.query(Certificate).filter(Certificate.codigo == normalized_code).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Arquivo de certificado nao encontrado.")

    ensure_certificate_access(db, usuario, cert)
    record_audit_event(
        db,
        evento="certificado_png_acessado",
        descricao=f"Arquivo PNG do certificado {cert.codigo} acessado internamente.",
        usuario=usuario,
        secretaria=cert.secretaria,
        certificado=cert,
        entidade_tipo="certificado",
        entidade_id=cert.id,
    )
    db.commit()
    return build_certificate_file_response(cert)
