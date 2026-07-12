import os
from datetime import date, datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from email_utils import normalize_optional_email


MAX_BATCH_ITEMS = max(1, int(os.getenv("CERTIFICADOS_MAX_BATCH_ITEMS", "800")))
MAX_CERTIFICATE_UPLOAD_BYTES = max(1, int(os.getenv("CERTIFICADOS_MAX_UPLOAD_BYTES", "8388608")))
MAX_TEMPLATE_UPLOAD_BYTES = max(1, int(os.getenv("TEMPLATES_MAX_UPLOAD_BYTES", "10485760")))
UserRole = Literal["admin_global", "operador"]
SecretariaAssetType = Literal["logo", "assinatura", "instituicao", "selo"]


class CertificateCreate(BaseModel):
    nome: str = Field(min_length=2, max_length=200)
    cpf: Optional[str] = Field(default=None, max_length=14)
    email: Optional[str] = Field(default=None, max_length=254)
    reply_email_id: Optional[int] = Field(default=None, ge=1)
    curso: str = Field(min_length=2, max_length=200)
    carga_h: int = Field(default=0, ge=0, le=2000)
    concluido: date
    formulario_resposta_id: Optional[int] = Field(default=None, ge=1)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: Optional[str]) -> Optional[str]:
        return normalize_optional_email(value)


class CertificateBatchCreate(BaseModel):
    prefixo: str = Field(default="ABC", min_length=1, max_length=8)
    itens: list[CertificateCreate]

    @field_validator("itens")
    @classmethod
    def validate_batch_size(cls, value: list[CertificateCreate]) -> list[CertificateCreate]:
        if len(value) > MAX_BATCH_ITEMS:
            raise ValueError(
                f"O lote excede o limite de {MAX_BATCH_ITEMS} certificado(s) por envio."
            )
        return value


class CertificateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    codigo: str
    nome: str
    cpf: Optional[str]
    email: Optional[str] = None
    curso: str
    carga_h: int
    concluido: date
    emitido_em: datetime
    hash: str
    url_validacao: str
    secretaria_id: Optional[int] = None
    secretaria_sigla: Optional[str] = None
    secretaria_nome: Optional[str] = None
    reply_email_id: Optional[int] = None
    reply_to_nome: Optional[str] = None
    reply_to_email: Optional[str] = None
    emitido_por_usuario_id: Optional[int] = None
    emitido_por_username: Optional[str] = None
    render_snapshot: Optional[dict[str, Any]] = None
    atualizado_em: Optional[datetime] = None
    atualizado_por_usuario_id: Optional[int] = None
    atualizado_por_username: Optional[str] = None
    excluido_em: Optional[datetime] = None
    exclusao_expira_em: Optional[datetime] = None
    excluido_por_usuario_id: Optional[int] = None
    excluido_por_username: Optional[str] = None
    email_envio_status: Optional[str] = None
    email_tentativa_em: Optional[datetime] = None
    email_enviado_em: Optional[datetime] = None
    email_reply_to: Optional[str] = None
    email_erro: Optional[str] = None
    arquivo_disponivel: bool = False
    arquivo_url: Optional[str] = None
    arquivo_admin_url: Optional[str] = None


class ValidationResponse(BaseModel):
    status: str
    codigo: str
    valido: bool
    nome: Optional[str] = None
    curso: Optional[str] = None
    carga_h: Optional[int] = None
    concluido: Optional[date] = None
    hash: Optional[str] = None
    arquivo_disponivel: bool = False
    arquivo_url: Optional[str] = None


class PaginatedCertificateResponse(BaseModel):
    total: int
    pagina: int
    por_pagina: int
    paginas: int
    itens: list[CertificateResponse]


class SecretariaReplyEmailResponse(BaseModel):
    id: int
    secretaria_id: int
    nome: str
    email: str
    ativo: bool
    padrao: bool
    criado_em: datetime


class SecretariaResponse(BaseModel):
    id: int
    sigla: str
    nome: str
    email_resposta: Optional[str] = None
    reply_emails: list[SecretariaReplyEmailResponse] = Field(default_factory=list)
    ativa: bool


class CertificateTemplateResponse(BaseModel):
    id: int
    secretaria_id: int
    secretaria_sigla: Optional[str] = None
    secretaria_nome: Optional[str] = None
    nome: str
    ativo: bool
    padrao: bool
    ocultar_titulo_certificado: bool = False
    ordem: int = 0
    arquivo_url: str
    criado_em: datetime
    criado_por_usuario_id: Optional[int] = None
    criado_por_username: Optional[str] = None


class SecretariaAssetResponse(BaseModel):
    id: int
    secretaria_id: int
    secretaria_sigla: Optional[str] = None
    secretaria_nome: Optional[str] = None
    tipo: SecretariaAssetType
    nome: str
    ativo: bool
    padrao: bool
    ordem: int = 0
    arquivo_url: str
    criado_em: datetime
    criado_por_usuario_id: Optional[int] = None
    criado_por_username: Optional[str] = None


class CertificateLayoutPresetCreate(BaseModel):
    nome: str = Field(min_length=2, max_length=120)
    payload: dict[str, Any]


class CertificateLayoutPresetUpdate(BaseModel):
    nome: Optional[str] = Field(default=None, min_length=2, max_length=120)
    payload: Optional[dict[str, Any]] = None


class CertificateLayoutPresetResponse(BaseModel):
    id: int
    secretaria_id: int
    secretaria_sigla: Optional[str] = None
    secretaria_nome: Optional[str] = None
    nome: str
    payload: dict[str, Any]
    criado_em: datetime
    atualizado_em: datetime
    criado_por_usuario_id: Optional[int] = None
    criado_por_username: Optional[str] = None


class CertificateFormExtraField(BaseModel):
    nome: str = Field(min_length=2, max_length=80)
    rotulo: Optional[str] = Field(default=None, max_length=160)
    tipo: Literal["texto", "selecao"] = "texto"
    opcoes: list[str] = Field(default_factory=list, max_length=50)
    obrigatorio: bool = False

    @field_validator("opcoes", mode="before")
    @classmethod
    def normalize_options(cls, value: Any) -> list[str]:
        if value is None:
            return []
        if isinstance(value, str):
            raw_options = value.replace("\r", "\n").replace(";", "\n").split("\n")
        elif isinstance(value, list):
            raw_options = value
        else:
            return []

        options: list[str] = []
        seen: set[str] = set()
        for item in raw_options:
            option = str(item or "").strip()
            if not option:
                continue
            key = option.lower()
            if key in seen:
                continue
            seen.add(key)
            options.append(option[:120])
            if len(options) >= 50:
                break
        return options

    @field_validator("rotulo")
    @classmethod
    def normalize_label(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        label = value.strip()
        return label or None


class CertificateFormCreate(BaseModel):
    secretaria_id: Optional[int] = Field(default=None, ge=1)
    titulo: str = Field(min_length=2, max_length=200)
    curso: str = Field(min_length=2, max_length=200)
    carga_h: int = Field(default=0, ge=0, le=2000)
    concluido: date
    reply_email_id: Optional[int] = Field(default=None, ge=1)
    ativo: bool = True
    email_obrigatorio: bool = True
    campos_extras: list[CertificateFormExtraField] = Field(default_factory=list, max_length=5)


class CertificateFormUpdate(BaseModel):
    secretaria_id: Optional[int] = Field(default=None, ge=1)
    titulo: Optional[str] = Field(default=None, min_length=2, max_length=200)
    curso: Optional[str] = Field(default=None, min_length=2, max_length=200)
    carga_h: Optional[int] = Field(default=None, ge=0, le=2000)
    concluido: Optional[date] = None
    reply_email_id: Optional[int] = Field(default=None, ge=1)
    ativo: Optional[bool] = None
    email_obrigatorio: Optional[bool] = None
    campos_extras: Optional[list[CertificateFormExtraField]] = Field(default=None, max_length=5)


class CertificateFormResponseCreate(BaseModel):
    nome: str = Field(min_length=2, max_length=200)
    email: Optional[str] = Field(default=None, max_length=254)
    dados_extras: dict[str, str] = Field(default_factory=dict)
    website: Optional[str] = Field(default=None, max_length=200)

    @field_validator("email")
    @classmethod
    def validate_form_email(cls, value: Optional[str]) -> Optional[str]:
        return normalize_optional_email(value)


class CertificateFormResponseItem(BaseModel):
    id: int
    formulario_id: int
    nome: str
    email: Optional[str] = None
    dados_extras: dict[str, Any] = Field(default_factory=dict)
    criado_em: datetime
    certificado_id: Optional[int] = None
    certificado_codigo: Optional[str] = None
    certificado_gerado_em: Optional[datetime] = None
    email_confirmacao_status: Optional[str] = None
    email_confirmacao_em: Optional[datetime] = None
    email_confirmacao_erro: Optional[str] = None
    email_confirmacao_reply_to: Optional[str] = None


class CertificateFormResponse(BaseModel):
    id: int
    secretaria_id: int
    secretaria_sigla: Optional[str] = None
    secretaria_nome: Optional[str] = None
    titulo: str
    curso: str
    carga_h: int
    concluido: date
    reply_email_id: Optional[int] = None
    reply_email_nome: Optional[str] = None
    reply_email_email: Optional[str] = None
    token: str
    public_url: str
    ativo: bool
    email_obrigatorio: bool
    campos_extras: list[dict[str, Any]] = Field(default_factory=list)
    respostas_total: int = 0
    respostas_pendentes: int = 0
    criado_em: datetime
    atualizado_em: datetime
    criado_por_usuario_id: Optional[int] = None
    criado_por_username: Optional[str] = None


class CertificateFormPublicResponse(BaseModel):
    titulo: str
    curso: str
    carga_h: int
    concluido: date
    secretaria_sigla: Optional[str] = None
    secretaria_nome: Optional[str] = None
    email_obrigatorio: bool
    campos_extras: list[dict[str, Any]] = Field(default_factory=list)


class CertificateFormSubmitResponse(BaseModel):
    message: str
    email_confirmacao_status: Optional[str] = None
    email_confirmacao_enviado_em: Optional[datetime] = None
    email_confirmacao_erro: Optional[str] = None


class UserSessionResponse(BaseModel):
    id: int
    nome: str
    username: str
    papel: UserRole


class SessionRuntimeConfigResponse(BaseModel):
    certificados_max_upload_bytes: int = MAX_CERTIFICATE_UPLOAD_BYTES
    certificados_max_batch_items: int = MAX_BATCH_ITEMS
    templates_max_upload_bytes: int = MAX_TEMPLATE_UPLOAD_BYTES


class SessionResponse(BaseModel):
    autenticado: bool
    usuario: Optional[UserSessionResponse] = None
    secretarias: list[SecretariaResponse] = Field(default_factory=list)
    secretaria_ativa_id: Optional[int] = None
    csrf_token: Optional[str] = None
    configuracoes: SessionRuntimeConfigResponse = Field(default_factory=SessionRuntimeConfigResponse)


class LoginRequest(BaseModel):
    username: str = Field(min_length=3, max_length=80)
    password: str = Field(min_length=4, max_length=200)


class SecretariaSelectionRequest(BaseModel):
    secretaria_id: int = Field(ge=1)


class SecretariaAdminCreate(BaseModel):
    sigla: str = Field(min_length=2, max_length=20)
    nome: str = Field(min_length=2, max_length=150)
    email_resposta: Optional[str] = Field(default=None, max_length=254)
    ativa: bool = True

    @field_validator("email_resposta")
    @classmethod
    def validate_email_resposta(cls, value: Optional[str]) -> Optional[str]:
        return normalize_optional_email(value)


class SecretariaAdminUpdate(BaseModel):
    sigla: Optional[str] = Field(default=None, min_length=2, max_length=20)
    nome: Optional[str] = Field(default=None, min_length=2, max_length=150)
    email_resposta: Optional[str] = Field(default=None, max_length=254)
    ativa: Optional[bool] = None

    @field_validator("email_resposta")
    @classmethod
    def validate_email_resposta(cls, value: Optional[str]) -> Optional[str]:
        return normalize_optional_email(value)


class SecretariaReplyEmailCreate(BaseModel):
    nome: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=3, max_length=254)
    ativo: bool = True
    padrao: bool = False

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        normalized = normalize_optional_email(value)
        if not normalized:
            raise ValueError("Email de resposta e obrigatorio.")
        return normalized


class SecretariaReplyEmailUpdate(BaseModel):
    nome: Optional[str] = Field(default=None, min_length=2, max_length=120)
    email: Optional[str] = Field(default=None, min_length=3, max_length=254)
    ativo: Optional[bool] = None
    padrao: Optional[bool] = None

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: Optional[str]) -> Optional[str]:
        normalized = normalize_optional_email(value)
        if value is not None and not normalized:
            raise ValueError("Email de resposta e obrigatorio.")
        return normalized


class UserAdminCreate(BaseModel):
    nome: str = Field(min_length=2, max_length=150)
    username: str = Field(min_length=3, max_length=80)
    password: str = Field(min_length=4, max_length=200)
    papel: UserRole = Field(default="operador")
    ativo: bool = True
    secretaria_ids: list[int] = Field(default_factory=list)

    @field_validator("papel", mode="before")
    @classmethod
    def normalize_role(cls, value):
        if isinstance(value, str):
            return value.strip().lower()
        return value


class UserAdminUpdate(BaseModel):
    nome: Optional[str] = Field(default=None, min_length=2, max_length=150)
    password: Optional[str] = Field(default=None, min_length=4, max_length=200)
    papel: Optional[UserRole] = None
    ativo: Optional[bool] = None
    secretaria_ids: Optional[list[int]] = None

    @field_validator("papel", mode="before")
    @classmethod
    def normalize_role(cls, value):
        if isinstance(value, str):
            return value.strip().lower()
        return value


class UserAdminResponse(BaseModel):
    id: int
    nome: str
    username: str
    papel: UserRole
    ativo: bool
    ultimo_login_em: Optional[datetime] = None
    criado_em: datetime
    secretarias: list[SecretariaResponse] = Field(default_factory=list)


class AuditEventResponse(BaseModel):
    id: int
    evento: str
    descricao: Optional[str] = None
    criado_em: datetime
    entidade_tipo: Optional[str] = None
    entidade_id: Optional[int] = None
    usuario_id: Optional[int] = None
    usuario_nome: Optional[str] = None
    usuario_username: Optional[str] = None
    secretaria_id: Optional[int] = None
    secretaria_sigla: Optional[str] = None
    certificado_id: Optional[int] = None
    certificado_codigo: Optional[str] = None


class PaginatedAuditEventResponse(BaseModel):
    total: int
    pagina: int
    por_pagina: int
    paginas: int
    itens: list[AuditEventResponse]


class CertificateAdminDeleteRequest(BaseModel):
    password: str = Field(min_length=4, max_length=200)


class CertificateAdminBulkDeleteRequest(BaseModel):
    password: str = Field(min_length=4, max_length=200)
    codigos: list[str] = Field(min_length=1, max_length=100)

    @field_validator("codigos")
    @classmethod
    def normalize_codes(cls, value: list[str]) -> list[str]:
        normalized: list[str] = []
        seen: set[str] = set()
        for item in value:
            code = item.strip().upper()
            if not code:
                continue
            if code not in seen:
                normalized.append(code)
                seen.add(code)
        if not normalized:
            raise ValueError("Informe ao menos um certificado.")
        return normalized


class CertificateTrashClearRequest(BaseModel):
    password: str = Field(min_length=4, max_length=200)
    confirmacao: str = Field(min_length=4, max_length=40)

    @field_validator("confirmacao")
    @classmethod
    def normalize_confirmation(cls, value: str) -> str:
        return value.strip().upper()


class ActionResponse(BaseModel):
    message: str
    codigo: Optional[str] = None
