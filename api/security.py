import hashlib
import hmac
import os
import secrets

PASSWORD_ITERATIONS = int(os.getenv("PASSWORD_HASH_ITERATIONS", "390000"))
DEFAULT_DEV_CERTIFICATE_HASH_SECRET = "troque-esta-chave-do-certificado"


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


def get_certificate_hash_secret() -> str:
    explicit_secret = (os.getenv("CERTIFICATE_HASH_SECRET") or "").strip()
    if explicit_secret:
        return explicit_secret

    session_secret = (os.getenv("SESSION_SECRET") or "").strip()
    if session_secret:
        return session_secret

    return DEFAULT_DEV_CERTIFICATE_HASH_SECRET


def calculate_legacy_certificate_hash(
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
    return hmac.new(
        get_certificate_hash_secret().encode("utf-8"),
        canonical.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


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
    if hmac.compare_digest(current_hash, expected_hash):
        return True

    legacy_hash = calculate_legacy_certificate_hash(
        codigo=codigo,
        nome=nome,
        cpf=cpf,
        curso=curso,
        carga_h=carga_h,
        concluido=concluido,
    )
    return hmac.compare_digest(legacy_hash, expected_hash)


def normalize_username(value: str | None) -> str:
    return " ".join((value or "").strip().lower().split())


def hash_password(password: str) -> str:
    clean_password = (password or "").strip()
    if not clean_password:
        raise ValueError("Senha obrigatoria.")

    salt = secrets.token_bytes(16)
    derived = hashlib.pbkdf2_hmac(
        "sha256",
        clean_password.encode("utf-8"),
        salt,
        PASSWORD_ITERATIONS,
    )
    return f"pbkdf2_sha256${PASSWORD_ITERATIONS}${salt.hex()}${derived.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    if not password or not stored_hash:
        return False

    try:
        algorithm, iterations_text, salt_hex, digest_hex = stored_hash.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False

        iterations = int(iterations_text)
        salt = bytes.fromhex(salt_hex)
        expected = bytes.fromhex(digest_hex)
    except (ValueError, TypeError):
        return False

    current = hashlib.pbkdf2_hmac(
        "sha256",
        password.strip().encode("utf-8"),
        salt,
        iterations,
    )
    return hmac.compare_digest(current, expected)
