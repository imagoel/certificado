from datetime import date, datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
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
    email_resposta: Mapped[str | None] = mapped_column(String(254), nullable=True)
    ativa: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)

    usuarios: Mapped[list["Usuario"]] = relationship(
        secondary=usuario_secretarias,
        back_populates="secretarias",
    )
    certificados: Mapped[list["Certificate"]] = relationship(back_populates="secretaria")
    formularios: Mapped[list["CertificateForm"]] = relationship(back_populates="secretaria")
    moldes: Mapped[list["CertificateTemplate"]] = relationship(back_populates="secretaria")
    assets: Mapped[list["SecretariaAsset"]] = relationship(back_populates="secretaria")
    reply_emails: Mapped[list["SecretariaReplyEmail"]] = relationship(
        back_populates="secretaria",
        cascade="all, delete-orphan",
    )
    layout_presets: Mapped[list["CertificateLayoutPreset"]] = relationship(
        back_populates="secretaria"
    )
    auditorias: Mapped[list["AuditEvent"]] = relationship(back_populates="secretaria")


class SecretariaReplyEmail(Base):
    __tablename__ = "secretaria_reply_emails"
    __table_args__ = (
        UniqueConstraint("secretaria_id", "email", name="uq_secretaria_reply_emails_email"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    secretaria_id: Mapped[int] = mapped_column(
        ForeignKey("secretarias.id"), index=True, nullable=False
    )
    nome: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(254), nullable=False)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    padrao: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)

    secretaria: Mapped[Secretaria] = relationship(back_populates="reply_emails")


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
    formularios_criados: Mapped[list["CertificateForm"]] = relationship(
        back_populates="criado_por",
        foreign_keys="CertificateForm.criado_por_usuario_id",
    )
    certificados_atualizados: Mapped[list["Certificate"]] = relationship(
        back_populates="atualizado_por",
        foreign_keys="Certificate.atualizado_por_usuario_id",
    )
    moldes_criados: Mapped[list["CertificateTemplate"]] = relationship(
        back_populates="criado_por",
        foreign_keys="CertificateTemplate.criado_por_usuario_id",
    )
    assets_criados: Mapped[list["SecretariaAsset"]] = relationship(
        back_populates="criado_por",
        foreign_keys="SecretariaAsset.criado_por_usuario_id",
    )
    layout_presets_criados: Mapped[list["CertificateLayoutPreset"]] = relationship(
        back_populates="criado_por",
        foreign_keys="CertificateLayoutPreset.criado_por_usuario_id",
    )
    auditorias: Mapped[list["AuditEvent"]] = relationship(back_populates="usuario")


class Certificate(Base):
    __tablename__ = "certificados"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    codigo: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    nome: Mapped[str] = mapped_column(String(200), nullable=False)
    cpf: Mapped[str | None] = mapped_column(String(14), nullable=True)
    email: Mapped[str | None] = mapped_column(String(254), nullable=True)
    curso: Mapped[str] = mapped_column(String(200), nullable=False)
    carga_h: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    concluido: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    emitido_em: Mapped[datetime] = mapped_column(DateTime, index=True, default=utc_now, nullable=False)
    hash: Mapped[str] = mapped_column(String(64), nullable=False)
    arquivo_pendente: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    secretaria_id: Mapped[int | None] = mapped_column(
        ForeignKey("secretarias.id"), index=True, nullable=True
    )
    emitido_por_usuario_id: Mapped[int | None] = mapped_column(
        ForeignKey("usuarios.id"), nullable=True
    )
    reply_email_id: Mapped[int | None] = mapped_column(
        ForeignKey("secretaria_reply_emails.id"), nullable=True
    )
    reply_to_nome: Mapped[str | None] = mapped_column(String(120), nullable=True)
    reply_to_email: Mapped[str | None] = mapped_column(String(254), nullable=True)
    arquivo_relpath: Mapped[str | None] = mapped_column(String(255), nullable=True)
    arquivo_mime: Mapped[str | None] = mapped_column(String(100), nullable=True)
    arquivo_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    render_snapshot: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    atualizado_em: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    atualizado_por_usuario_id: Mapped[int | None] = mapped_column(
        ForeignKey("usuarios.id"), nullable=True
    )
    excluido_em: Mapped[datetime | None] = mapped_column(DateTime, index=True, nullable=True)
    exclusao_expira_em: Mapped[datetime | None] = mapped_column(DateTime, index=True, nullable=True)
    excluido_por_usuario_id: Mapped[int | None] = mapped_column(
        ForeignKey("usuarios.id"), nullable=True
    )

    secretaria: Mapped[Secretaria | None] = relationship(back_populates="certificados")
    emitido_por: Mapped[Usuario | None] = relationship(
        back_populates="certificados_emitidos",
        foreign_keys=[emitido_por_usuario_id],
    )
    atualizado_por: Mapped[Usuario | None] = relationship(
        back_populates="certificados_atualizados",
        foreign_keys=[atualizado_por_usuario_id],
    )
    excluido_por: Mapped[Usuario | None] = relationship(
        foreign_keys=[excluido_por_usuario_id],
    )
    reply_email: Mapped[SecretariaReplyEmail | None] = relationship(
        foreign_keys=[reply_email_id],
    )
    auditorias: Mapped[list["AuditEvent"]] = relationship(back_populates="certificado")
    email_tentativas: Mapped[list["CertificateEmailAttempt"]] = relationship(
        back_populates="certificado"
    )


class CertificateEmailAttempt(Base):
    __tablename__ = "certificado_email_tentativas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    certificado_id: Mapped[int | None] = mapped_column(
        ForeignKey("certificados.id"), index=True, nullable=True
    )
    certificado_codigo: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    destinatario: Mapped[str] = mapped_column(String(254), nullable=False)
    reply_to: Mapped[str | None] = mapped_column(String(254), nullable=True)
    status: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    erro: Mapped[str | None] = mapped_column(Text, nullable=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)
    enviado_em: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    certificado: Mapped[Certificate | None] = relationship(back_populates="email_tentativas")


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


class CertificateForm(Base):
    __tablename__ = "certificate_forms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    secretaria_id: Mapped[int] = mapped_column(
        ForeignKey("secretarias.id"), index=True, nullable=False
    )
    titulo: Mapped[str] = mapped_column(String(200), nullable=False)
    curso: Mapped[str] = mapped_column(String(200), nullable=False)
    carga_h: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    concluido: Mapped[date] = mapped_column(Date, nullable=False)
    reply_email_id: Mapped[int | None] = mapped_column(
        ForeignKey("secretaria_reply_emails.id"), nullable=True
    )
    token: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    email_obrigatorio: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    campos_extras: Mapped[list | None] = mapped_column(JSON, nullable=True)
    criado_por_usuario_id: Mapped[int | None] = mapped_column(
        ForeignKey("usuarios.id"), nullable=True
    )
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime,
        default=utc_now,
        nullable=False,
    )

    secretaria: Mapped[Secretaria] = relationship(back_populates="formularios")
    reply_email: Mapped[SecretariaReplyEmail | None] = relationship(
        foreign_keys=[reply_email_id],
    )
    criado_por: Mapped[Usuario | None] = relationship(
        back_populates="formularios_criados",
        foreign_keys=[criado_por_usuario_id],
    )
    respostas: Mapped[list["CertificateFormResponse"]] = relationship(
        back_populates="formulario",
        cascade="all, delete-orphan",
    )


class CertificateFormResponse(Base):
    __tablename__ = "certificate_form_responses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    formulario_id: Mapped[int] = mapped_column(
        ForeignKey("certificate_forms.id"), index=True, nullable=False
    )
    nome: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str | None] = mapped_column(String(254), nullable=True)
    dados_extras: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    ip_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(255), nullable=True)
    certificado_id: Mapped[int | None] = mapped_column(
        ForeignKey("certificados.id"), nullable=True
    )
    certificado_codigo: Mapped[str | None] = mapped_column(String(20), nullable=True)
    nao_gerar_certificado: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    criado_em: Mapped[datetime] = mapped_column(DateTime, index=True, default=utc_now, nullable=False)
    certificado_gerado_em: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    formulario: Mapped[CertificateForm] = relationship(back_populates="respostas")
    certificado: Mapped[Certificate | None] = relationship(foreign_keys=[certificado_id])
    email_tentativas: Mapped[list["CertificateFormEmailAttempt"]] = relationship(
        back_populates="formulario_resposta",
        cascade="all, delete-orphan",
    )


class CertificateFormEmailAttempt(Base):
    __tablename__ = "certificate_form_email_tentativas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    formulario_resposta_id: Mapped[int | None] = mapped_column(
        ForeignKey("certificate_form_responses.id"), index=True, nullable=True
    )
    formulario_id: Mapped[int | None] = mapped_column(
        ForeignKey("certificate_forms.id"), index=True, nullable=True
    )
    destinatario: Mapped[str] = mapped_column(String(254), nullable=False)
    reply_to: Mapped[str | None] = mapped_column(String(254), nullable=True)
    status: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    erro: Mapped[str | None] = mapped_column(Text, nullable=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)
    enviado_em: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    formulario_resposta: Mapped[CertificateFormResponse | None] = relationship(
        back_populates="email_tentativas"
    )
    formulario: Mapped[CertificateForm | None] = relationship(foreign_keys=[formulario_id])


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
    ocultar_titulo_certificado: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
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


class CertificateLayoutPreset(Base):
    __tablename__ = "certificate_layout_presets"
    __table_args__ = (
        UniqueConstraint("secretaria_id", "nome", name="uq_layout_presets_secretaria_nome"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    secretaria_id: Mapped[int] = mapped_column(
        ForeignKey("secretarias.id"), index=True, nullable=False
    )
    nome: Mapped[str] = mapped_column(String(120), nullable=False)
    payload: Mapped[dict] = mapped_column(JSON, nullable=False)
    criado_por_usuario_id: Mapped[int | None] = mapped_column(
        ForeignKey("usuarios.id"), nullable=True
    )
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime,
        default=utc_now,
        nullable=False,
    )

    secretaria: Mapped[Secretaria] = relationship(back_populates="layout_presets")
    criado_por: Mapped[Usuario | None] = relationship(
        back_populates="layout_presets_criados",
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
