import os
from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


MAX_BATCH_ITEMS = max(1, int(os.getenv("CERTIFICADOS_MAX_BATCH_ITEMS", "500")))
UserRole = Literal["admin_global", "operador"]
SecretariaAssetType = Literal["logo", "assinatura"]


class CertificateCreate(BaseModel):
    nome: str = Field(min_length=2, max_length=200)
    cpf: Optional[str] = Field(default=None, max_length=14)
    curso: str = Field(min_length=2, max_length=200)
    carga_h: int = Field(default=0, ge=0, le=2000)
    concluido: date


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
    curso: str
    carga_h: int
    concluido: date
    emitido_em: datetime
    hash: str
    url_validacao: str
    secretaria_id: Optional[int] = None
    secretaria_sigla: Optional[str] = None
    secretaria_nome: Optional[str] = None
    emitido_por_usuario_id: Optional[int] = None
    emitido_por_username: Optional[str] = None
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


class SecretariaResponse(BaseModel):
    id: int
    sigla: str
    nome: str
    ativa: bool


class CertificateTemplateResponse(BaseModel):
    id: int
    secretaria_id: int
    secretaria_sigla: Optional[str] = None
    secretaria_nome: Optional[str] = None
    nome: str
    ativo: bool
    padrao: bool
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


class UserSessionResponse(BaseModel):
    id: int
    nome: str
    username: str
    papel: UserRole


class SessionResponse(BaseModel):
    autenticado: bool
    usuario: Optional[UserSessionResponse] = None
    secretarias: list[SecretariaResponse] = Field(default_factory=list)
    secretaria_ativa_id: Optional[int] = None


class LoginRequest(BaseModel):
    username: str = Field(min_length=3, max_length=80)
    password: str = Field(min_length=4, max_length=200)


class SecretariaSelectionRequest(BaseModel):
    secretaria_id: int = Field(ge=1)


class SecretariaAdminCreate(BaseModel):
    sigla: str = Field(min_length=2, max_length=20)
    nome: str = Field(min_length=2, max_length=150)
    ativa: bool = True


class SecretariaAdminUpdate(BaseModel):
    sigla: Optional[str] = Field(default=None, min_length=2, max_length=20)
    nome: Optional[str] = Field(default=None, min_length=2, max_length=150)
    ativa: Optional[bool] = None


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
    confirmacao_codigo: str = Field(min_length=3, max_length=20)

    @field_validator("confirmacao_codigo")
    @classmethod
    def normalize_confirmation_code(cls, value: str) -> str:
        return value.strip().upper()


class ActionResponse(BaseModel):
    message: str
    codigo: Optional[str] = None
