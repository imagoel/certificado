from datetime import date, datetime

from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, String, Table, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


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
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    usuarios: Mapped[list["Usuario"]] = relationship(
        secondary=usuario_secretarias,
        back_populates="secretarias",
    )
    certificados: Mapped[list["Certificate"]] = relationship(back_populates="secretaria")
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
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    secretarias: Mapped[list[Secretaria]] = relationship(
        secondary=usuario_secretarias,
        back_populates="usuarios",
    )
    certificados_emitidos: Mapped[list["Certificate"]] = relationship(
        back_populates="emitido_por",
        foreign_keys="Certificate.emitido_por_usuario_id",
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
    concluido: Mapped[date] = mapped_column(Date, nullable=False)
    emitido_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    hash: Mapped[str] = mapped_column(String(64), nullable=False)
    secretaria_id: Mapped[int | None] = mapped_column(ForeignKey("secretarias.id"), nullable=True)
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


class AuditEvent(Base):
    __tablename__ = "auditoria_eventos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    evento: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    usuario_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"), nullable=True)
    secretaria_id: Mapped[int | None] = mapped_column(ForeignKey("secretarias.id"), nullable=True)
    certificado_id: Mapped[int | None] = mapped_column(ForeignKey("certificados.id"), nullable=True)
    entidade_tipo: Mapped[str | None] = mapped_column(String(50), nullable=True)
    entidade_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    usuario: Mapped[Usuario | None] = relationship(back_populates="auditorias")
    secretaria: Mapped[Secretaria | None] = relationship(back_populates="auditorias")
    certificado: Mapped[Certificate | None] = relationship(back_populates="auditorias")
