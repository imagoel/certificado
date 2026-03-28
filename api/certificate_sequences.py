from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy import case
from sqlalchemy.dialects.postgresql import insert as postgresql_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.orm import Session

from common import CODE_REGEX, build_code, sanitize_code, utc_now
from models import Certificate, CertificateSequence


@dataclass(frozen=True)
class SequenceParts:
    prefixo: str
    ano: int
    numero: int


def parse_code_parts(codigo: str) -> SequenceParts | None:
    normalized = sanitize_code(codigo)
    if not CODE_REGEX.match(normalized):
        return None

    prefixo, ano_text, numero_text = normalized.split("-", 2)
    return SequenceParts(
        prefixo=prefixo,
        ano=int(ano_text),
        numero=int(numero_text),
    )


def _get_insert_factory(db: Session):
    dialect_name = db.bind.dialect.name if db.bind is not None else ""
    if dialect_name == "postgresql":
        return postgresql_insert
    if dialect_name == "sqlite":
        return sqlite_insert
    raise RuntimeError(f"Dialeto nao suportado para sequencias atomicas: {dialect_name}")


def _get_existing_max_sequence(db: Session, prefixo: str, ano: int) -> int:
    pattern = f"{prefixo}-{ano}-%"
    last = (
        db.query(Certificate.codigo)
        .filter(Certificate.codigo.like(pattern))
        .order_by(Certificate.codigo.desc())
        .first()
    )

    if not last:
        return 0

    try:
        return int(str(last[0]).split("-")[-1])
    except (ValueError, IndexError):
        return 0


def _ensure_sequence_row(db: Session, prefixo: str, ano: int) -> None:
    table = CertificateSequence.__table__
    insert_factory = _get_insert_factory(db)
    seed_value = _get_existing_max_sequence(db, prefixo, ano)
    insert_stmt = (
        insert_factory(table)
        .values(
            prefixo=prefixo,
            ano=ano,
            ultimo_numero=seed_value,
            criado_em=utc_now(),
            atualizado_em=utc_now(),
        )
        .on_conflict_do_nothing(index_elements=["prefixo", "ano"])
    )
    db.execute(insert_stmt)


def reserve_sequence_block(db: Session, prefixo: str, ano: int, quantidade: int = 1) -> tuple[int, int]:
    if quantidade < 1:
        raise ValueError("A quantidade reservada deve ser positiva.")

    _ensure_sequence_row(db, prefixo, ano)

    table = CertificateSequence.__table__
    update_stmt = (
        table.update()
        .where(table.c.prefixo == prefixo, table.c.ano == ano)
        .values(
            ultimo_numero=table.c.ultimo_numero + quantidade,
            atualizado_em=utc_now(),
        )
        .returning(table.c.ultimo_numero)
    )
    end_sequence = db.execute(update_stmt).scalar_one()
    start_sequence = end_sequence - quantidade + 1
    return start_sequence, end_sequence


def ensure_sequence_floor(db: Session, prefixo: str, ano: int, numero_minimo: int) -> int:
    if numero_minimo < 0:
        raise ValueError("O piso da sequencia nao pode ser negativo.")

    _ensure_sequence_row(db, prefixo, ano)

    table = CertificateSequence.__table__
    update_stmt = (
        table.update()
        .where(table.c.prefixo == prefixo, table.c.ano == ano)
        .values(
            ultimo_numero=case(
                (table.c.ultimo_numero < numero_minimo, numero_minimo),
                else_=table.c.ultimo_numero,
            ),
            atualizado_em=utc_now(),
        )
        .returning(table.c.ultimo_numero)
    )
    return db.execute(update_stmt).scalar_one()


def build_reserved_codes(prefixo: str, ano: int, quantidade: int, start_sequence: int) -> list[str]:
    return [
        build_code(prefixo, ano, start_sequence + offset)
        for offset in range(quantidade)
    ]
