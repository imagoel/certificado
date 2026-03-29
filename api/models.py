from datetime import date, datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


usuario_secretarias = Table(
    "usuario_secretarias",
    Base.metadata,
    Column("usuario_id", ForeignKey("usuarios.id"), primary_key=True),
    Column("secretaria_id", ForeignKey("secretarias.id"), primary_key=True),
)


class Secretaria(Base):
    __tablename__ = "secretarias"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    sigla: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    nome: Mapped[str] = mapped_column(String(150), nullable=False)
    ativa: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    logo_path: Mapped[str | None] = mapped_column(String(255), nullable=True)
    assinatura_path: Mapped[str | None] = mapped_column(String(255), nullable=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)

    usuarios: Mapped[list["Usuario"]] = relationship(
        secondary=usuario_secretarias,
        back_populates="secretarias",
    )
    certificados: Mapped[list["Certificate"]] = relationship(back_populates="secretaria")
    moldes: Mapped[list["CertificateTemplate"]] = relationship(back_populates="secretaria")
    assets: Mapped[list["SecretariaAsset"]] = relationship(back_populates="secretaria")
    auditorias: Mapped[list["AuditEvent"]] = relationship(back_populates="secretaria")


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(150), nullable=False)
    username: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    senha_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    papel: Mapped[str] = mapped_column(String(40), nullable=False, default="operador")
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    ultimo_login_em: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)

    secretarias: Mapped[list[Secretaria]] = relationship(
        secondary=usuario_secretarias,
        back_populates="usuarios",
    )
    certificados_emitidos: Mapped[list["Certificate"]] = relationship(
        back_populates="emitido_por",
        foreign_keys="Certificate.emitido_por_usuario_id",
    )
    moldes_criados: Mapped[list["CertificateTemplate"]] = relationship(
        back_populates="criado_por",
        foreign_keys="CertificateTemplate.criado_por_usuario_id",
    )
    assets_criados: Mapped[list["SecretariaAsset"]] = relationship(
        back_populates="criado_por",
        foreign_keys="SecretariaAsset.criado_por_usuario_id",
    )
    auditorias: Mapped[list["AuditEvent"]] = relationship(back_populates="usuario")


class Certificate(Base):
    __tablename__ = "certificados"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    codigo: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    nome: Mapped[str] = mapped_column(String(200), nullable=False)
    cpf: Mapped[str | None] = mapped_column(String(14), nullable=True)
    curso: Mapped[str] = mapped_column(String(200), nullable=False)
    carga_h: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    concluido: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    emitido_em: Mapped[datetime] = mapped_column(DateTime, index=True, default=utc_now, nullable=False)
    hash: Mapped[str] = mapped_column(String(64), nullable=False)
    secretaria_id: Mapped[int | None] = mapped_column(
        ForeignKey("secretarias.id"), index=True, nullable=True
    )
    emitido_por_usuario_id: Mapped[int | None] = mapped_column(
        ForeignKey("usuarios.id"), nullable=True
    )
    arquivo_relpath: Mapped[str | None] = mapped_column(String(255), nullable=True)
    arquivo_mime: Mapped[str | None] = mapped_column(String(100), nullable=True)
    arquivo_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)

    secretaria: Mapped[Secretaria | None] = relationship(back_populates="certificados")
    emitido_por: Mapped[Usuario | None] = relationship(
        back_populates="certificados_emitidos",
        foreign_keys=[emitido_por_usuario_id],
    )
    auditorias: Mapped[list["AuditEvent"]] = relationship(back_populates="certificado")


class CertificateSequence(Base):
    __tablename__ = "certificado_sequencias"
    __table_args__ = (
        UniqueConstraint("prefixo", "ano", name="uq_certificado_sequencias_prefixo_ano"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    prefixo: Mapped[str] = mapped_column(String(20), nullable=False)
    ano: Mapped[int] = mapped_column(Integer, nullable=False)
    ultimo_numero: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)
    atualizado_em: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)


class CertificateTemplate(Base):
    __tablename__ = "certificate_templates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    secretaria_id: Mapped[int] = mapped_column(
        ForeignKey("secretarias.id"), index=True, nullable=False
    )
    nome: Mapped[str] = mapped_column(String(150), nullable=False)
    arquivo_relpath: Mapped[str] = mapped_column(String(255), nullable=False)
    arquivo_mime: Mapped[str | None] = mapped_column(String(100), nullable=True)
    arquivo_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    padrao: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    ordem: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    criado_por_usuario_id: Mapped[int | None] = mapped_column(
        ForeignKey("usuarios.id"), nullable=True
    )
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)

    secretaria: Mapped[Secretaria] = relationship(back_populates="moldes")
    criado_por: Mapped[Usuario | None] = relationship(
        back_populates="moldes_criados",
        foreign_keys=[criado_por_usuario_id],
    )


class SecretariaAsset(Base):
    __tablename__ = "secretaria_assets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    secretaria_id: Mapped[int] = mapped_column(
        ForeignKey("secretarias.id"), index=True, nullable=False
    )
    tipo: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    nome: Mapped[str] = mapped_column(String(150), nullable=False)
    arquivo_relpath: Mapped[str] = mapped_column(String(255), nullable=False)
    arquivo_mime: Mapped[str | None] = mapped_column(String(100), nullable=True)
    arquivo_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    padrao: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    ordem: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    criado_por_usuario_id: Mapped[int | None] = mapped_column(
        ForeignKey("usuarios.id"), nullable=True
    )
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)

    secretaria: Mapped[Secretaria] = relationship(back_populates="assets")
    criado_por: Mapped[Usuario | None] = relationship(
        back_populates="assets_criados",
        foreign_keys=[criado_por_usuario_id],
    )


class AuditEvent(Base):
    __tablename__ = "auditoria_eventos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    evento: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    usuario_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"), nullable=True)
    secretaria_id: Mapped[int | None] = mapped_column(
        ForeignKey("secretarias.id"), index=True, nullable=True
    )
    certificado_id: Mapped[int | None] = mapped_column(ForeignKey("certificados.id"), nullable=True)
    certificado_codigo_snapshot: Mapped[str | None] = mapped_column(String(20), nullable=True)
    entidade_tipo: Mapped[str | None] = mapped_column(String(50), nullable=True)
    entidade_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, index=True, default=utc_now, nullable=False)

    usuario: Mapped[Usuario | None] = relationship(back_populates="auditorias")
    secretaria: Mapped[Secretaria | None] = relationship(back_populates="auditorias")
    certificado: Mapped[Certificate | None] = relationship(back_populates="auditorias")
