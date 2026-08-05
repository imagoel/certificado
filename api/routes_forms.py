import csv
import hashlib
import re
import secrets
import time
from io import StringIO
from unicodedata import normalize as normalize_unicode

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse, Response
from sqlalchemy import func
from sqlalchemy.orm import Session

from audit_service import record_audit_event
from common import (
    get_accessible_secretarias,
    get_current_user,
    get_request_ip,
    is_admin,
    resolve_active_secretaria,
    templates,
    utc_now,
)
from database import get_db
from email_delivery import send_form_confirmation_email_if_needed
from email_utils import normalize_optional_email
from models import (
    CertificateForm,
    CertificateFormResponse,
    Secretaria,
    SecretariaReplyEmail,
    Usuario,
)
from name_utils import normalize_participant_name
from schemas import (
    ActionResponse,
    CertificateFormCreate,
    CertificateFormPublicResponse,
    CertificateFormResponse as CertificateFormSchema,
    CertificateFormResponseCertificateStatusUpdate,
    CertificateFormResponseCreate,
    CertificateFormResponseItem,
    CertificateFormSubmitResponse,
    CertificateFormUpdate,
)


router = APIRouter()

FORM_SUBMIT_WINDOW_SECONDS = 600
FORM_SUBMIT_MAX_ATTEMPTS = 5
FORM_RATE_LIMITS: dict[str, list[float]] = {}


def sanitize_export_filename(text: str | None, fallback: str) -> str:
    normalized = normalize_unicode("NFD", (text or "").strip())
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
    safe_text = re.sub(r"[^a-zA-Z0-9-_]+", "_", ascii_text).strip("_")
    return safe_text or fallback


def cleanup_form_rate_limits(now: float) -> None:
    expired_before = now - FORM_SUBMIT_WINDOW_SECONDS
    for key in list(FORM_RATE_LIMITS.keys()):
        attempts = [timestamp for timestamp in FORM_RATE_LIMITS[key] if timestamp >= expired_before]
        if attempts:
            FORM_RATE_LIMITS[key] = attempts
        else:
            FORM_RATE_LIMITS.pop(key, None)


def check_form_rate_limit(request: Request, token: str) -> str:
    ip = get_request_ip(request)
    now = time.time()
    cleanup_form_rate_limits(now)
    key = f"{token}|{ip}"
    attempts = FORM_RATE_LIMITS.get(key, [])
    if len(attempts) >= FORM_SUBMIT_MAX_ATTEMPTS:
        raise HTTPException(
            status_code=429,
            detail="Muitas respostas enviadas em pouco tempo. Tente novamente mais tarde.",
        )
    attempts.append(now)
    FORM_RATE_LIMITS[key] = attempts
    return ip


def hash_ip(ip: str) -> str:
    return hashlib.sha256(ip.encode("utf-8")).hexdigest()


def normalize_extra_fields(raw_fields: list | None) -> list[dict[str, object]]:
    normalized: list[dict[str, object]] = []
    seen: set[str] = set()
    for item in raw_fields or []:
        if hasattr(item, "model_dump"):
            data = item.model_dump()
        elif isinstance(item, dict):
            data = item
        else:
            continue
        name = str(data.get("nome") or "").strip()
        if not name:
            continue
        label = str(data.get("rotulo") or "").strip() or name
        field_type = str(data.get("tipo") or "texto").strip().lower()
        if field_type not in {"texto", "selecao"}:
            field_type = "texto"
        raw_options = data.get("opcoes") or []
        if isinstance(raw_options, str):
            raw_options = raw_options.replace("\r", "\n").replace(";", "\n").split("\n")
        options: list[str] = []
        option_keys: set[str] = set()
        if isinstance(raw_options, list):
            for option_item in raw_options:
                option = str(option_item or "").strip()
                if not option:
                    continue
                option_key = option.lower()
                if option_key in option_keys:
                    continue
                option_keys.add(option_key)
                options.append(option[:120])
                if len(options) >= 50:
                    break
        if field_type == "selecao" and not options:
            field_type = "texto"
        key = name.lower()
        if key in seen:
            continue
        seen.add(key)
        normalized.append(
            {
                "nome": name[:80],
                "rotulo": label[:160],
                "tipo": field_type,
                "opcoes": options if field_type == "selecao" else [],
                "obrigatorio": bool(data.get("obrigatorio")),
            }
        )
        if len(normalized) >= 5:
            break
    return normalized


def get_manageable_secretaria(
    db: Session,
    usuario: Usuario,
    secretaria_id: int | None,
    request: Request | None = None,
) -> Secretaria:
    if secretaria_id:
        secretaria = db.query(Secretaria).filter(Secretaria.id == secretaria_id).first()
    else:
        if not request:
            secretaria = None
        else:
            secretaria, _secretarias = resolve_active_secretaria(request, db, usuario)

    if not secretaria:
        raise HTTPException(status_code=404, detail="Secretaria nao encontrada.")

    if is_admin(usuario):
        return secretaria

    allowed_ids = {item.id for item in get_accessible_secretarias(db, usuario)}
    if secretaria.id not in allowed_ids:
        raise HTTPException(status_code=403, detail="Secretaria nao permitida para este usuario.")
    return secretaria


def ensure_form_access(db: Session, usuario: Usuario, form: CertificateForm) -> None:
    if is_admin(usuario):
        return
    allowed_ids = {item.id for item in get_accessible_secretarias(db, usuario)}
    if form.secretaria_id not in allowed_ids:
        raise HTTPException(status_code=403, detail="Acesso negado a este formulario.")


def ensure_reply_email_belongs_to_secretaria(
    db: Session,
    secretaria: Secretaria,
    reply_email_id: int | None,
) -> SecretariaReplyEmail | None:
    if not reply_email_id:
        return None
    reply_email = (
        db.query(SecretariaReplyEmail)
        .filter(
            SecretariaReplyEmail.id == reply_email_id,
            SecretariaReplyEmail.secretaria_id == secretaria.id,
            SecretariaReplyEmail.ativo.is_(True),
        )
        .first()
    )
    if not reply_email:
        raise HTTPException(
            status_code=422,
            detail="Email de resposta selecionado nao pertence a secretaria do formulario.",
        )
    return reply_email


def build_form_public_url(request: Request, form: CertificateForm) -> str:
    return str(request.url_for("public_form_page", token=form.token))


def build_form_response(
    request: Request,
    form: CertificateForm,
    *,
    respostas_total: int = 0,
    respostas_pendentes: int = 0,
) -> CertificateFormSchema:
    reply_email = form.reply_email
    return CertificateFormSchema(
        id=form.id,
        secretaria_id=form.secretaria_id,
        secretaria_sigla=form.secretaria.sigla if form.secretaria else None,
        secretaria_nome=form.secretaria.nome if form.secretaria else None,
        titulo=form.titulo,
        curso=form.curso,
        carga_h=form.carga_h,
        concluido=form.concluido,
        reply_email_id=form.reply_email_id,
        reply_email_nome=reply_email.nome if reply_email else None,
        reply_email_email=reply_email.email if reply_email else None,
        token=form.token,
        public_url=build_form_public_url(request, form),
        ativo=form.ativo,
        email_obrigatorio=form.email_obrigatorio,
        campos_extras=normalize_extra_fields(form.campos_extras),
        respostas_total=respostas_total,
        respostas_pendentes=respostas_pendentes,
        criado_em=form.criado_em,
        atualizado_em=form.atualizado_em,
        criado_por_usuario_id=form.criado_por_usuario_id,
        criado_por_username=form.criado_por.username if form.criado_por else None,
    )


def build_response_item(response: CertificateFormResponse) -> CertificateFormResponseItem:
    last_email_attempt = None
    if response.email_tentativas:
        last_email_attempt = max(response.email_tentativas, key=lambda item: item.criado_em)
    return CertificateFormResponseItem(
        id=response.id,
        formulario_id=response.formulario_id,
        nome=response.nome,
        email=response.email,
        dados_extras=response.dados_extras or {},
        criado_em=response.criado_em,
        certificado_id=response.certificado_id,
        certificado_codigo=response.certificado_codigo,
        nao_gerar_certificado=response.nao_gerar_certificado,
        certificado_gerado_em=response.certificado_gerado_em,
        email_confirmacao_status=last_email_attempt.status if last_email_attempt else None,
        email_confirmacao_em=last_email_attempt.enviado_em if last_email_attempt else None,
        email_confirmacao_erro=last_email_attempt.erro if last_email_attempt else None,
        email_confirmacao_reply_to=last_email_attempt.reply_to if last_email_attempt else None,
    )


def get_form_by_id(db: Session, form_id: int) -> CertificateForm:
    form = db.query(CertificateForm).filter(CertificateForm.id == form_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="Formulario nao encontrado.")
    return form


def get_public_form(db: Session, token: str) -> CertificateForm:
    form = db.query(CertificateForm).filter(CertificateForm.token == token).first()
    if not form:
        raise HTTPException(status_code=404, detail="Formulario nao encontrado.")
    if not form.ativo:
        raise HTTPException(status_code=410, detail="Formulario encerrado.")
    return form


@router.get("/api/formularios", response_model=list[CertificateFormSchema])
def list_certificate_forms(
    request: Request,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> list[CertificateFormSchema]:
    query = db.query(CertificateForm)
    if not is_admin(usuario):
        allowed_ids = {item.id for item in get_accessible_secretarias(db, usuario)}
        if not allowed_ids:
            return []
        query = query.filter(CertificateForm.secretaria_id.in_(allowed_ids))

    forms = query.order_by(CertificateForm.criado_em.desc(), CertificateForm.id.desc()).all()
    counts = dict(
        db.query(CertificateFormResponse.formulario_id, func.count(CertificateFormResponse.id))
        .filter(CertificateFormResponse.formulario_id.in_([form.id for form in forms] or [0]))
        .group_by(CertificateFormResponse.formulario_id)
        .all()
    )
    pending_counts = dict(
        db.query(CertificateFormResponse.formulario_id, func.count(CertificateFormResponse.id))
        .filter(
            CertificateFormResponse.formulario_id.in_([form.id for form in forms] or [0]),
            CertificateFormResponse.certificado_id.is_(None),
            CertificateFormResponse.nao_gerar_certificado.is_(False),
        )
        .group_by(CertificateFormResponse.formulario_id)
        .all()
    )
    return [
        build_form_response(
            request,
            form,
            respostas_total=int(counts.get(form.id, 0)),
            respostas_pendentes=int(pending_counts.get(form.id, 0)),
        )
        for form in forms
    ]


@router.post("/api/formularios", response_model=CertificateFormSchema, status_code=201)
def create_certificate_form(
    payload: CertificateFormCreate,
    request: Request,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> CertificateFormSchema:
    secretaria = get_manageable_secretaria(db, usuario, payload.secretaria_id, request)
    reply_email = ensure_reply_email_belongs_to_secretaria(
        db, secretaria, payload.reply_email_id
    )
    token = secrets.token_urlsafe(24)
    while db.query(CertificateForm).filter(CertificateForm.token == token).first():
        token = secrets.token_urlsafe(24)

    form = CertificateForm(
        secretaria_id=secretaria.id,
        titulo=payload.titulo.strip(),
        curso=payload.curso.strip(),
        carga_h=payload.carga_h,
        concluido=payload.concluido,
        reply_email_id=reply_email.id if reply_email else None,
        token=token,
        ativo=payload.ativo,
        email_obrigatorio=True,
        campos_extras=normalize_extra_fields(payload.campos_extras),
        criado_por_usuario_id=usuario.id,
    )
    db.add(form)
    db.flush()
    record_audit_event(
        db,
        evento="formulario_criado",
        descricao=f"Formulario {form.titulo} criado para {secretaria.sigla}.",
        usuario=usuario,
        secretaria=secretaria,
        entidade_tipo="formulario",
        entidade_id=form.id,
    )
    db.commit()
    db.refresh(form)
    return build_form_response(request, form)


@router.patch("/api/formularios/{form_id}", response_model=CertificateFormSchema)
def update_certificate_form(
    form_id: int,
    payload: CertificateFormUpdate,
    request: Request,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> CertificateFormSchema:
    form = get_form_by_id(db, form_id)
    ensure_form_access(db, usuario, form)

    if payload.secretaria_id is not None and payload.secretaria_id != form.secretaria_id:
        secretaria = get_manageable_secretaria(db, usuario, payload.secretaria_id, request)
        form.secretaria_id = secretaria.id
    else:
        secretaria = form.secretaria

    if "reply_email_id" in payload.model_fields_set:
        reply_email = ensure_reply_email_belongs_to_secretaria(
            db, secretaria, payload.reply_email_id
        )
        form.reply_email_id = reply_email.id if reply_email else None

    if payload.titulo is not None:
        form.titulo = payload.titulo.strip()
    if payload.curso is not None:
        form.curso = payload.curso.strip()
    if payload.carga_h is not None:
        form.carga_h = payload.carga_h
    if payload.concluido is not None:
        form.concluido = payload.concluido
    if payload.ativo is not None:
        form.ativo = payload.ativo
    form.email_obrigatorio = True
    if payload.campos_extras is not None:
        form.campos_extras = normalize_extra_fields(payload.campos_extras)
    form.atualizado_em = utc_now()

    record_audit_event(
        db,
        evento="formulario_atualizado",
        descricao=f"Formulario {form.titulo} atualizado.",
        usuario=usuario,
        secretaria=form.secretaria,
        entidade_tipo="formulario",
        entidade_id=form.id,
    )
    db.commit()
    db.refresh(form)
    return build_form_response(request, form)


@router.delete("/api/formularios/{form_id}", response_model=ActionResponse)
def delete_certificate_form(
    form_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> ActionResponse:
    if not is_admin(usuario):
        raise HTTPException(status_code=403, detail="Apenas admin global pode excluir formularios.")

    form = get_form_by_id(db, form_id)
    title = form.titulo
    secretaria = form.secretaria
    responses_count = len(form.respostas or [])
    db.delete(form)
    record_audit_event(
        db,
        evento="formulario_excluido",
        descricao=(
            f"Formulario {title} excluido por {usuario.username}. "
            f"{responses_count} resposta(s) removida(s)."
        ),
        usuario=usuario,
        secretaria=secretaria,
        entidade_tipo="formulario",
        entidade_id=form_id,
    )
    db.commit()
    return ActionResponse(message="Formulario excluido com sucesso.")


@router.get("/api/formularios/{form_id}/respostas", response_model=list[CertificateFormResponseItem])
def list_certificate_form_responses(
    form_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> list[CertificateFormResponseItem]:
    form = get_form_by_id(db, form_id)
    ensure_form_access(db, usuario, form)
    responses = (
        db.query(CertificateFormResponse)
        .filter(CertificateFormResponse.formulario_id == form.id)
        .order_by(CertificateFormResponse.criado_em.asc(), CertificateFormResponse.id.asc())
        .all()
    )
    return [build_response_item(response) for response in responses]


@router.patch(
    "/api/formularios/{form_id}/respostas/{response_id}",
    response_model=CertificateFormResponseItem,
)
def update_certificate_form_response_certificate_status(
    form_id: int,
    response_id: int,
    payload: CertificateFormResponseCertificateStatusUpdate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> CertificateFormResponseItem:
    form = get_form_by_id(db, form_id)
    ensure_form_access(db, usuario, form)
    response = (
        db.query(CertificateFormResponse)
        .filter(
            CertificateFormResponse.id == response_id,
            CertificateFormResponse.formulario_id == form.id,
        )
        .first()
    )
    if not response:
        raise HTTPException(status_code=404, detail="Resposta de formulario nao encontrada.")
    if response.certificado_id or response.certificado_codigo:
        raise HTTPException(
            status_code=409,
            detail="Resposta ja possui certificado gerado e nao pode ser marcada como ausente.",
        )

    new_status = bool(payload.nao_gerar_certificado)
    if response.nao_gerar_certificado != new_status:
        response.nao_gerar_certificado = new_status
        form.atualizado_em = utc_now()
        record_audit_event(
            db,
            evento=(
                "formulario_resposta_marcada_ausente"
                if new_status
                else "formulario_resposta_reativada_certificado"
            ),
            descricao=(
                f"Resposta {response.id} do formulario {form.titulo} marcada como "
                f"{'ausente' if new_status else 'pendente para certificado'} por {usuario.username}."
            ),
            usuario=usuario,
            secretaria=form.secretaria,
            entidade_tipo="formulario_resposta",
            entidade_id=response.id,
        )
        db.commit()
        db.refresh(response)

    return build_response_item(response)


@router.post("/api/formularios/{form_id}/respostas/padronizar-nomes", response_model=ActionResponse)
def normalize_certificate_form_response_names(
    form_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> ActionResponse:
    form = get_form_by_id(db, form_id)
    ensure_form_access(db, usuario, form)
    responses = (
        db.query(CertificateFormResponse)
        .filter(
            CertificateFormResponse.formulario_id == form.id,
            CertificateFormResponse.certificado_id.is_(None),
            CertificateFormResponse.nao_gerar_certificado.is_(False),
        )
        .order_by(CertificateFormResponse.criado_em.asc(), CertificateFormResponse.id.asc())
        .all()
    )

    changed = 0
    for response in responses:
        normalized_name = normalize_participant_name(response.nome)
        if normalized_name and normalized_name != response.nome:
            response.nome = normalized_name
            changed += 1

    if changed:
        form.atualizado_em = utc_now()
        record_audit_event(
            db,
            evento="formulario_respostas_nomes_padronizados",
            descricao=(
                f"{changed} nome(s) de resposta do formulario {form.titulo} "
                f"padronizado(s) por {usuario.username}."
            ),
            usuario=usuario,
            secretaria=form.secretaria,
            entidade_tipo="formulario",
            entidade_id=form.id,
        )
        db.commit()

    return ActionResponse(message=f"{changed} nome(s) pendente(s) padronizado(s).")


@router.get("/api/formularios/{form_id}/respostas.csv")
def export_certificate_form_responses_csv(
    form_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> Response:
    form = get_form_by_id(db, form_id)
    ensure_form_access(db, usuario, form)
    responses = (
        db.query(CertificateFormResponse)
        .filter(CertificateFormResponse.formulario_id == form.id)
        .order_by(CertificateFormResponse.criado_em.asc(), CertificateFormResponse.id.asc())
        .all()
    )
    extra_fields = normalize_extra_fields(form.campos_extras)
    output = StringIO()
    writer = csv.writer(output, delimiter=";")
    headers = ["Nome", "Email", "Curso", "Carga hor\u00e1ria", "Data"]
    headers.extend(field["nome"] for field in extra_fields)
    headers.extend(["Respondido em", "Certificado"])
    writer.writerow(headers)

    for response in responses:
        data = response.dados_extras or {}
        row = [
            response.nome,
            response.email or "",
            form.curso,
            form.carga_h,
            form.concluido.strftime("%d/%m/%Y"),
        ]
        row.extend(str(data.get(field["nome"], "")) for field in extra_fields)
        certificado_status = (
            response.certificado_codigo
            or ("Ausente" if response.nao_gerar_certificado else "")
        )
        row.extend([response.criado_em.strftime("%d/%m/%Y %H:%M:%S"), certificado_status])
        writer.writerow(row)

    safe_course_name = sanitize_export_filename(form.curso, f"formulario-{form.id}")
    filename = f"respostas-formulario-{safe_course_name}.csv"
    return Response(
        content=output.getvalue(),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/api/formularios/publico/{token}", response_model=CertificateFormPublicResponse)
def get_public_certificate_form(
    token: str,
    db: Session = Depends(get_db),
) -> CertificateFormPublicResponse:
    form = get_public_form(db, token)
    return CertificateFormPublicResponse(
        titulo=form.titulo,
        curso=form.curso,
        carga_h=form.carga_h,
        concluido=form.concluido,
        secretaria_sigla=form.secretaria.sigla if form.secretaria else None,
        secretaria_nome=form.secretaria.nome if form.secretaria else None,
        email_obrigatorio=True,
        campos_extras=normalize_extra_fields(form.campos_extras),
    )


@router.post(
    "/api/formularios/publico/{token}/respostas",
    response_model=CertificateFormSubmitResponse,
    status_code=201,
)
def submit_public_certificate_form_response(
    token: str,
    payload: CertificateFormResponseCreate,
    request: Request,
    db: Session = Depends(get_db),
) -> CertificateFormSubmitResponse:
    form = get_public_form(db, token)
    if payload.website:
        raise HTTPException(status_code=400, detail="Resposta recusada.")

    ip = check_form_rate_limit(request, token)
    email = payload.email
    if not email:
        raise HTTPException(status_code=422, detail="Email e obrigatorio.")

    extra_fields = normalize_extra_fields(form.campos_extras)
    extras: dict[str, str] = {}
    for field in extra_fields:
        name = str(field["nome"])
        value = str((payload.dados_extras or {}).get(name, "")).strip()
        if field.get("obrigatorio") and not value:
            label = str(field.get("rotulo") or name)
            raise HTTPException(status_code=422, detail=f"{label} e obrigatorio.")
        if value and field.get("tipo") == "selecao":
            allowed_options = [str(option) for option in field.get("opcoes") or []]
            allowed_keys = {option.lower(): option for option in allowed_options}
            selected = allowed_keys.get(value.lower())
            if not selected:
                label = str(field.get("rotulo") or name)
                raise HTTPException(status_code=422, detail=f"{label} possui uma opcao invalida.")
            value = selected
        if value:
            extras[name] = value[:300]

    participant_name = normalize_participant_name(payload.nome)
    if len(participant_name) < 2:
        raise HTTPException(status_code=422, detail="Nome do participante e obrigatorio.")

    response = CertificateFormResponse(
        formulario_id=form.id,
        nome=participant_name,
        email=normalize_optional_email(email),
        dados_extras=extras,
        ip_hash=hash_ip(ip),
        user_agent=(request.headers.get("user-agent", "") or "")[:255],
    )
    db.add(response)
    db.flush()
    record_audit_event(
        db,
        evento="formulario_resposta_recebida",
        descricao=f"Nova resposta recebida no formulario {form.titulo}.",
        secretaria=form.secretaria,
        entidade_tipo="formulario_resposta",
        entidade_id=response.id,
    )
    db.commit()
    db.refresh(response)
    email_attempt = send_form_confirmation_email_if_needed(db, response=response)
    return CertificateFormSubmitResponse(
        message="Resposta enviada com sucesso.",
        email_confirmacao_status=email_attempt.status if email_attempt else None,
        email_confirmacao_enviado_em=email_attempt.enviado_em if email_attempt else None,
        email_confirmacao_erro=email_attempt.erro if email_attempt else None,
    )


@router.get("/formularios/f/{token}", response_class=HTMLResponse, name="public_form_page")
def public_certificate_form_page(
    request: Request,
    token: str,
    db: Session = Depends(get_db),
) -> HTMLResponse:
    form = db.query(CertificateForm).filter(CertificateForm.token == token).first()
    return templates.TemplateResponse(
        request,
        "formulario_publico.html",
        {
            "formulario": form,
            "token": token,
        },
        status_code=200 if form else 404,
    )
