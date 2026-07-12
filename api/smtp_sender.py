from __future__ import annotations

import smtplib
import ssl
from email.message import EmailMessage

from email_config import SmtpConfig


def send_smtp_message(config: SmtpConfig, message: EmailMessage) -> None:
    with smtplib.SMTP(config.host, config.port, timeout=config.timeout_seconds) as smtp:
        if config.starttls:
            smtp.ehlo()
            smtp.starttls(context=ssl.create_default_context())
            smtp.ehlo()
        if config.username:
            smtp.login(config.username, config.password)
        smtp.send_message(message)
