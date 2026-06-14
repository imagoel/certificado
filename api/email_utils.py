import re


EMAIL_MAX_LENGTH = 254
_EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def normalize_optional_email(value: str | None) -> str | None:
    if value is None:
        return None

    text = str(value).strip()
    if not text:
        return None

    if len(text) > EMAIL_MAX_LENGTH:
        raise ValueError("Email deve ter no maximo 254 caracteres.")

    if text[0] in {".", "-", "@"}:
        raise ValueError("Email invalido.")

    if not _EMAIL_PATTERN.match(text):
        raise ValueError("Email invalido.")

    local, domain = text.rsplit("@", 1)
    if not local or not domain or "." not in domain:
        raise ValueError("Email invalido.")

    return f"{local}@{domain.lower()}"
