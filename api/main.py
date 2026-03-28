import math
import os
import re
from datetime import date, datetime
from io import BytesIO
from pathlib import Path

import qrcode
from fastapi import Depends, FastAPI, File, HTTPException, Query, Request, UploadFile
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.openapi.utils import get_openapi
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy import inspect, or_, text
from sqlalchemy.orm import Session
from starlette.middleware.sessions import SessionMiddleware

from database import Base, engine, get_db
from models import AuditEvent, Certificate, Secretaria, Usuario
from schemas import (
    AuditEventResponse,
    CertificateBatchCreate,
    CertificateCreate,
    CertificateResponse,
    LoginRequest,
    PaginatedAuditEventResponse,
    PaginatedCertificateResponse,
    SecretariaAdminCreate,
    SecretariaAdminUpdate,
    SecretariaResponse,
    SecretariaSelectionRequest,
    SessionResponse,
    UserAdminCreate,
    UserAdminResponse,
    UserAdminUpdate,
    UserSessionResponse,
    ValidationResponse,
)
from security import (
    calculate_certificate_hash,
    hash_password,
    normalize_username,
    verify_certificate_hash,
    verify_password,
)

CODE_REGEX = re.compile(r"^[A-Z0-9]{1,8}-\d{4}-\d{5}$")
DEFAULT_PREFIX = os.getenv("CODE_PREFIX", "ABC")
DEFAULT_MEDIA_DIR = str((Path(__file__).resolve().parent / "data" / "certificados"))
CERTIFICADOS_MEDIA_DIR = Path(os.getenv("CERTIFICADOS_MEDIA_DIR", DEFAULT_MEDIA_DIR)).resolve()
MAX_UPLOAD_BYTES = int(os.getenv("CERTIFICADOS_MAX_UPLOAD_BYTES", "5242880"))
SESSION_SECRET = os.getenv("SESSION_SECRET", "troque-esta-chave-de-sessao")
ROLE_ADMIN_GLOBAL = "admin_global"

BASE_DIR = Path(__file__).resolve().parent


def resolve_allowed_origins() -> list[str]:
    raw = os.getenv("CORS_ALLOW_ORIGINS", "").strip()
    default_origins = [
        "http://localhost:28754",
        "http://127.0.0.1:28754",
    ]

    if not raw or raw == "*":
        return default_origins

    origins = [origin.strip() for origin in raw.split(",") if origin.strip()]
    if "*" in origins:
        return default_origins

    return origins


app = FastAPI(
    title="Sistema de Certificados - API",
    version="1.1.0",
    description="API para registro, autenticacao e validacao de certificados.",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)

app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

app.add_middleware(
    SessionMiddleware,
    secret_key=SESSION_SECRET,
    session_cookie="certificado_session",
    same_site="lax",
    https_only=False,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=resolve_allowed_origins(),
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
    if "secretaria_id" not in columns:
        statements.append("ALTER TABLE certificados ADD COLUMN secretaria_id INTEGER")
    if "emitido_por_usuario_id" not in columns:
        statements.append("ALTER TABLE certificados ADD COLUMN emitido_por_usuario_id INTEGER")

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
        raise HTTPException(status_code=400, detail="Caminho de arquivo invalido.")
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


def build_secretaria_response(secretaria: Secretaria) -> SecretariaResponse:
    return SecretariaResponse(
        id=secretaria.id,
        sigla=secretaria.sigla,
        nome=secretaria.nome,
        ativa=secretaria.ativa,
    )


def build_user_session_response(usuario: Usuario) -> UserSessionResponse:
    return UserSessionResponse(
        id=usuario.id,
        nome=usuario.nome,
        username=usuario.username,
        papel=usuario.papel,
    )


def build_user_admin_response(usuario: Usuario) -> UserAdminResponse:
    secretarias = sorted(usuario.secretarias, key=lambda item: item.sigla)
    return UserAdminResponse(
        id=usuario.id,
        nome=usuario.nome,
        username=usuario.username,
        papel=usuario.papel,
        ativo=usuario.ativo,
        ultimo_login_em=usuario.ultimo_login_em,
        criado_em=usuario.criado_em,
        secretarias=[build_secretaria_response(secretaria) for secretaria in secretarias],
    )


def build_audit_response(event: AuditEvent) -> AuditEventResponse:
    return AuditEventResponse(
        id=event.id,
        evento=event.evento,
        descricao=event.descricao,
        criado_em=event.criado_em,
        entidade_tipo=event.entidade_tipo,
        entidade_id=event.entidade_id,
        usuario_id=event.usuario_id,
        usuario_nome=event.usuario.nome if event.usuario else None,
        usuario_username=event.usuario.username if event.usuario else None,
        secretaria_id=event.secretaria_id,
        secretaria_sigla=event.secretaria.sigla if event.secretaria else None,
        certificado_id=event.certificado_id,
        certificado_codigo=event.certificado.codigo if event.certificado else None,
    )


def is_admin(usuario: Usuario) -> bool:
    return usuario.papel == ROLE_ADMIN_GLOBAL


def normalize_secretaria_sigla(value: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", (value or "").strip().upper())


def build_internal_certificate_file_url(request: Request, codigo: str) -> str:
    return str(request.url_for("get_certificate_file_internal", codigo=sanitize_code(codigo)))


def get_accessible_secretarias(db: Session, usuario: Usuario) -> list[Secretaria]:
    if is_admin(usuario):
        return (
            db.query(Secretaria)
            .filter(Secretaria.ativa.is_(True))
            .order_by(Secretaria.sigla.asc())
            .all()
        )

    return sorted(
        [secretaria for secretaria in usuario.secretarias if secretaria.ativa],
        key=lambda item: item.sigla,
    )


def resolve_active_secretaria(
    request: Request, db: Session, usuario: Usuario
) -> tuple[Secretaria | None, list[Secretaria]]:
    secretarias = get_accessible_secretarias(db, usuario)
    if not secretarias:
        request.session.pop("secretaria_id", None)
        return None, []

    current_secretaria_id = request.session.get("secretaria_id")
    active = next(
        (secretaria for secretaria in secretarias if secretaria.id == current_secretaria_id),
        None,
    )
    if active:
        return active, secretarias

    active = secretarias[0]
    request.session["secretaria_id"] = active.id
    return active, secretarias


def build_session_response(request: Request, db: Session, usuario: Usuario) -> SessionResponse:
    secretaria_ativa, secretarias = resolve_active_secretaria(request, db, usuario)
    return SessionResponse(
        autenticado=True,
        usuario=build_user_session_response(usuario),
        secretarias=[build_secretaria_response(secretaria) for secretaria in secretarias],
        secretaria_ativa_id=secretaria_ativa.id if secretaria_ativa else None,
    )


def get_current_user(request: Request, db: Session = Depends(get_db)) -> Usuario:
    user_id = request.session.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Autenticacao necessaria.")

    usuario = db.query(Usuario).filter(Usuario.id == int(user_id)).first()
    if not usuario or not usuario.ativo:
        request.session.clear()
        raise HTTPException(status_code=401, detail="Sessao invalida. Faca login novamente.")

    return usuario


def require_admin_user(usuario: Usuario = Depends(get_current_user)) -> Usuario:
    if not is_admin(usuario):
        raise HTTPException(status_code=403, detail="Acesso restrito ao administrador.")
    return usuario


def require_active_secretaria(
    request: Request,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> Secretaria:
    secretaria_ativa, _secretarias = resolve_active_secretaria(request, db, usuario)
    if not secretaria_ativa:
        raise HTTPException(
            status_code=403,
            detail="Nenhuma secretaria vinculada ao usuario.",
        )
    return secretaria_ativa


def ensure_certificate_access(db: Session, usuario: Usuario, cert: Certificate) -> None:
    if is_admin(usuario):
        return

    allowed_secretaria_ids = {secretaria.id for secretaria in get_accessible_secretarias(db, usuario)}
    if cert.secretaria_id is None or cert.secretaria_id not in allowed_secretaria_ids:
        raise HTTPException(status_code=403, detail="Acesso negado a este certificado.")


def get_secretarias_by_ids(db: Session, secretaria_ids: list[int]) -> list[Secretaria]:
    unique_ids = sorted({int(secretaria_id) for secretaria_id in secretaria_ids if secretaria_id})
    if not unique_ids:
        return []

    secretarias = (
        db.query(Secretaria)
        .filter(Secretaria.id.in_(unique_ids))
        .order_by(Secretaria.sigla.asc())
        .all()
    )
    if len(secretarias) != len(unique_ids):
        raise HTTPException(status_code=422, detail="Uma ou mais secretarias informadas nao existem.")
    return secretarias


def validate_role_and_secretarias(papel: str, secretarias: list[Secretaria]) -> None:
    normalized_role = (papel or "").strip().lower()
    if normalized_role not in {"admin_global", "operador"}:
        raise HTTPException(status_code=422, detail="Papel invalido. Use admin_global ou operador.")

    if normalized_role != ROLE_ADMIN_GLOBAL and not secretarias:
        raise HTTPException(
            status_code=422,
            detail="Usuarios operadores precisam ter pelo menos uma secretaria vinculada.",
        )


def record_audit_event(
    db: Session,
    *,
    evento: str,
    descricao: str | None = None,
    usuario: Usuario | None = None,
    secretaria: Secretaria | None = None,
    certificado: Certificate | None = None,
    entidade_tipo: str | None = None,
    entidade_id: int | None = None,
) -> AuditEvent:
    audit = AuditEvent(
        evento=evento,
        descricao=descricao,
        usuario_id=usuario.id if usuario else None,
        secretaria_id=secretaria.id if secretaria else None,
        certificado_id=certificado.id if certificado else None,
        entidade_tipo=entidade_tipo,
        entidade_id=entidade_id,
    )
    db.add(audit)
    return audit


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
        secretaria_id=cert.secretaria_id,
        secretaria_sigla=cert.secretaria.sigla if cert.secretaria else None,
        secretaria_nome=cert.secretaria.nome if cert.secretaria else None,
        emitido_por_usuario_id=cert.emitido_por_usuario_id,
        emitido_por_username=cert.emitido_por.username if cert.emitido_por else None,
        arquivo_disponivel=file_available,
        arquivo_url=build_certificate_file_url(request, cert.codigo) if file_available else None,
        arquivo_admin_url=build_internal_certificate_file_url(request, cert.codigo)
        if file_available
        else None,
    )


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/openapi.json", include_in_schema=False)
def openapi_json(_usuario: Usuario = Depends(require_admin_user)) -> JSONResponse:
    return JSONResponse(
        get_openapi(
            title=app.title,
            version=app.version,
            description=app.description,
            routes=app.routes,
        )
    )


@app.get("/docs", include_in_schema=False)
def swagger_ui(_usuario: Usuario = Depends(require_admin_user)) -> HTMLResponse:
    return get_swagger_ui_html(
        openapi_url="/openapi.json",
        title=f"{app.title} - Docs",
    )


@app.get("/api/auth/me", response_model=SessionResponse)
def auth_me(request: Request, db: Session = Depends(get_db)) -> SessionResponse:
    usuario = get_current_user(request, db)
    return build_session_response(request, db, usuario)


@app.post("/api/auth/login", response_model=SessionResponse)
def auth_login(
    payload: LoginRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> SessionResponse:
    username = normalize_username(payload.username)
    usuario = db.query(Usuario).filter(Usuario.username == username).first()

    if not usuario or not usuario.ativo or not verify_password(payload.password, usuario.senha_hash):
        raise HTTPException(status_code=401, detail="Usuario ou senha invalidos.")

    request.session.clear()
    request.session["user_id"] = usuario.id
    usuario.ultimo_login_em = datetime.utcnow()
    secretaria_ativa, _secretarias = resolve_active_secretaria(request, db, usuario)
    record_audit_event(
        db,
        evento="auth_login",
        descricao=f"Login realizado por {usuario.username}.",
        usuario=usuario,
        secretaria=secretaria_ativa,
        entidade_tipo="usuario",
        entidade_id=usuario.id,
    )
    db.commit()
    db.refresh(usuario)
    return build_session_response(request, db, usuario)


@app.post("/api/auth/logout", response_model=SessionResponse)
def auth_logout(request: Request) -> SessionResponse:
    request.session.clear()
    return SessionResponse(autenticado=False)


@app.post("/api/auth/select-secretaria", response_model=SessionResponse)
def auth_select_secretaria(
    payload: SecretariaSelectionRequest,
    request: Request,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> SessionResponse:
    secretarias = get_accessible_secretarias(db, usuario)
    selected = next(
        (secretaria for secretaria in secretarias if secretaria.id == payload.secretaria_id),
        None,
    )
    if not selected:
        raise HTTPException(status_code=403, detail="Secretaria nao permitida para este usuario.")

    request.session["secretaria_id"] = selected.id
    record_audit_event(
        db,
        evento="troca_secretaria",
        descricao=f"Secretaria ativa alterada para {selected.sigla}.",
        usuario=usuario,
        secretaria=selected,
        entidade_tipo="secretaria",
        entidade_id=selected.id,
    )
    db.commit()
    return build_session_response(request, db, usuario)


@app.get("/api/admin/secretarias", response_model=list[SecretariaResponse])
def admin_list_secretarias(
    db: Session = Depends(get_db),
    _usuario: Usuario = Depends(require_admin_user),
) -> list[SecretariaResponse]:
    secretarias = db.query(Secretaria).order_by(Secretaria.sigla.asc()).all()
    return [build_secretaria_response(secretaria) for secretaria in secretarias]


@app.post("/api/admin/secretarias", response_model=SecretariaResponse, status_code=201)
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


@app.patch("/api/admin/secretarias/{secretaria_id}", response_model=SecretariaResponse)
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


@app.get("/api/admin/usuarios", response_model=list[UserAdminResponse])
def admin_list_users(
    db: Session = Depends(get_db),
    _usuario: Usuario = Depends(require_admin_user),
) -> list[UserAdminResponse]:
    usuarios = db.query(Usuario).order_by(Usuario.nome.asc()).all()
    return [build_user_admin_response(usuario) for usuario in usuarios]


@app.post("/api/admin/usuarios", response_model=UserAdminResponse, status_code=201)
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


@app.patch("/api/admin/usuarios/{usuario_id}", response_model=UserAdminResponse)
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


@app.get("/api/admin/auditoria", response_model=PaginatedAuditEventResponse)
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


@app.post("/api/certificados", response_model=CertificateResponse, status_code=201)
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
        emitido_em=datetime.utcnow(),
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


@app.post("/api/certificados/lote", response_model=list[CertificateResponse], status_code=201)
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
            emitido_em=datetime.utcnow(),
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


def validate_png_upload(uploaded: UploadFile, content: bytes) -> None:
    if not uploaded.filename:
        raise HTTPException(status_code=400, detail="Arquivo PNG e obrigatorio.")

    if not content:
        raise HTTPException(status_code=400, detail="Arquivo enviado esta vazio.")

    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"Arquivo muito grande. Limite atual: {MAX_UPLOAD_BYTES} bytes.",
        )

    content_type = (uploaded.content_type or "").lower()
    if content_type and content_type not in ("image/png", "application/octet-stream"):
        raise HTTPException(status_code=415, detail="Somente arquivos PNG sao aceitos.")

    if not content.startswith(b"\x89PNG\r\n\x1a\n"):
        raise HTTPException(status_code=415, detail="Arquivo invalido. Envie um PNG valido.")


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


def build_certificate_file_response(cert: Certificate) -> FileResponse:
    if not cert.arquivo_relpath:
        raise HTTPException(status_code=404, detail="Arquivo de certificado nao encontrado.")

    file_path = resolve_media_path(cert.arquivo_relpath)
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="Arquivo de certificado nao encontrado.")

    return FileResponse(
        path=file_path,
        media_type=cert.arquivo_mime or "image/png",
        filename=f"{cert.codigo}.png",
    )


@app.get("/api/certificados/{codigo}/arquivo", name="get_certificate_file")
def get_certificate_file(codigo: str, db: Session = Depends(get_db)) -> FileResponse:
    normalized_code = sanitize_code(codigo)
    cert = db.query(Certificate).filter(Certificate.codigo == normalized_code).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Arquivo de certificado nao encontrado.")

    return build_certificate_file_response(cert)


@app.get("/api/certificados/{codigo}/arquivo-interno", name="get_certificate_file_internal")
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
