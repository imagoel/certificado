import hashlib


def normalize_text(value: str | None) -> str:
    return " ".join((value or "").strip().split())


def normalize_cpf(value: str | None) -> str:
    raw = "".join(ch for ch in (value or "") if ch.isdigit())
    return raw


def canonical_certificate_payload(
    *,
    codigo: str,
    nome: str,
    cpf: str | None,
    curso: str,
    carga_h: int,
    concluido: str,
) -> str:
    parts = [
        normalize_text(codigo).upper(),
        normalize_text(nome),
        normalize_cpf(cpf),
        normalize_text(curso),
        str(int(carga_h)),
        normalize_text(concluido),
    ]
    return "|".join(parts)


def calculate_certificate_hash(
    *,
    codigo: str,
    nome: str,
    cpf: str | None,
    curso: str,
    carga_h: int,
    concluido: str,
) -> str:
    canonical = canonical_certificate_payload(
        codigo=codigo,
        nome=nome,
        cpf=cpf,
        curso=curso,
        carga_h=carga_h,
        concluido=concluido,
    )
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def verify_certificate_hash(
    *,
    expected_hash: str,
    codigo: str,
    nome: str,
    cpf: str | None,
    curso: str,
    carga_h: int,
    concluido: str,
) -> bool:
    current_hash = calculate_certificate_hash(
        codigo=codigo,
        nome=nome,
        cpf=cpf,
        curso=curso,
        carga_h=carga_h,
        concluido=concluido,
    )
    return current_hash == expected_hash
