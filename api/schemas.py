from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class CertificateCreate(BaseModel):
    codigo: Optional[str] = Field(default=None, max_length=20)
    nome: str = Field(min_length=2, max_length=200)
    cpf: Optional[str] = Field(default=None, max_length=14)
    curso: str = Field(min_length=2, max_length=200)
    carga_h: int = Field(default=0, ge=0, le=2000)
    concluido: date

    @field_validator("codigo")
    @classmethod
    def normalize_code(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        normalized = value.strip().upper()
        return normalized or None


class CertificateBatchCreate(BaseModel):
    prefixo: str = Field(default="ABC", min_length=1, max_length=8)
    itens: list[CertificateCreate]


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


class UserSessionResponse(BaseModel):
    id: int
    nome: str
    username: str
    papel: str


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
    papel: str = Field(default="operador", min_length=4, max_length=40)
    ativo: bool = True
    secretaria_ids: list[int] = Field(default_factory=list)

    @field_validator("papel")
    @classmethod
    def normalize_role(cls, value: str) -> str:
        return value.strip().lower()


class UserAdminUpdate(BaseModel):
    nome: Optional[str] = Field(default=None, min_length=2, max_length=150)
    password: Optional[str] = Field(default=None, min_length=4, max_length=200)
    papel: Optional[str] = Field(default=None, min_length=4, max_length=40)
    ativo: Optional[bool] = None
    secretaria_ids: Optional[list[int]] = None

    @field_validator("papel")
    @classmethod
    def normalize_role(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        return value.strip().lower()


class UserAdminResponse(BaseModel):
    id: int
    nome: str
    username: str
    papel: str
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
