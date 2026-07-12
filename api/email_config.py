from __future__ import annotations

import os
from dataclasses import dataclass


EMAIL_STATUS_SENT = 'enviado'
EMAIL_STATUS_FAILED = 'falhou'
MAX_EMAIL_ERROR_LENGTH = 1000


@dataclass(frozen=True)
class SmtpConfig:
    enabled: bool
    host: str
    port: int
    username: str
    password: str
    from_email: str
    from_name: str
    email_logo_url: str
    email_institution_name: str
    starttls: bool
    timeout_seconds: int


def env_bool(name: str, default: str = 'false') -> bool:
    return os.getenv(name, default).strip().lower() in {'1', 'true', 'yes', 'on'}


def env_int(name: str, default: int) -> int:
    raw = os.getenv(name, '').strip()
    if not raw:
        return default
    try:
        return int(raw)
    except ValueError:
        return default


def load_smtp_config() -> SmtpConfig:
    return SmtpConfig(
        enabled=env_bool('SMTP_ENABLED', 'false'),
        host=os.getenv('SMTP_HOST', '').strip(),
        port=env_int('SMTP_PORT', 587),
        username=os.getenv('SMTP_USERNAME', '').strip(),
        password=os.getenv('SMTP_PASSWORD', ''),
        from_email=os.getenv('SMTP_FROM_EMAIL', '').strip(),
        from_name=os.getenv('SMTP_FROM_NAME', 'Gerador de Certificados').strip()
        or 'Gerador de Certificados',
        email_logo_url=os.getenv('EMAIL_LOGO_URL', '').strip(),
        email_institution_name=(
            os.getenv('EMAIL_INSTITUTION_NAME', 'Prefeitura Municipal de Amargosa').strip()
            or 'Prefeitura Municipal de Amargosa'
        ),
        starttls=env_bool('SMTP_STARTTLS', 'true'),
        timeout_seconds=max(1, env_int('SMTP_TIMEOUT_SECONDS', 15)),
    )


def validate_smtp_config(config: SmtpConfig) -> str | None:
    if not config.host:
        return 'SMTP_HOST nao configurado.'
    if not config.from_email:
        return 'SMTP_FROM_EMAIL nao configurado.'
    if config.username and not config.password:
        return 'SMTP_PASSWORD nao configurado.'
    return None


def summarize_email_error(error: object) -> str:
    text = str(error or 'Falha desconhecida no envio de email.').strip()
    if len(text) > MAX_EMAIL_ERROR_LENGTH:
        return f'{text[:MAX_EMAIL_ERROR_LENGTH - 3]}...'
    return text
