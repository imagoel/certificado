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
    arquivo_disponivel: bool = False
    arquivo_url: Optional[str] = None


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
