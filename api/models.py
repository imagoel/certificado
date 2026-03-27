from datetime import date, datetime

from sqlalchemy import Date, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class Certificate(Base):
    __tablename__ = "certificados"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    codigo: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    nome: Mapped[str] = mapped_column(String(200), nullable=False)
    cpf: Mapped[str | None] = mapped_column(String(14), nullable=True)
    curso: Mapped[str] = mapped_column(String(200), nullable=False)
    carga_h: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    concluido: Mapped[date] = mapped_column(Date, nullable=False)
    emitido_em: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    hash: Mapped[str] = mapped_column(String(64), nullable=False)
    arquivo_relpath: Mapped[str | None] = mapped_column(String(255), nullable=True)
    arquivo_mime: Mapped[str | None] = mapped_column(String(100), nullable=True)
    arquivo_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
