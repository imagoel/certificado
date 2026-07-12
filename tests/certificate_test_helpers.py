import json


PNG_BYTES = (
    b"\x89PNG\r\n\x1a\n"
    b"\x00\x00\x00\rIHDR"
    b"\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00"
    b"\x1f\x15\xc4\x89"
    b"\x00\x00\x00\rIDATx\x9cc\xf8\xcf\xc0\xf0\x1f\x00\x05\x00\x01\xff"
    b"\x89\x99=\x1d"
    b"\x00\x00\x00\x00IEND\xaeB`\x82"
)
EDITED_PNG_BYTES = PNG_BYTES + b"edited-version"


def configure_smtp_env(monkeypatch) -> None:
    monkeypatch.setenv("SMTP_ENABLED", "true")
    monkeypatch.setenv("SMTP_HOST", "smtp.example.test")
    monkeypatch.setenv("SMTP_PORT", "587")
    monkeypatch.setenv("SMTP_USERNAME", "certificados@amargosa.ba.gov.br")
    monkeypatch.setenv("SMTP_PASSWORD", "senha-smtp")
    monkeypatch.setenv("SMTP_FROM_EMAIL", "certificados@amargosa.ba.gov.br")
    monkeypatch.setenv("SMTP_FROM_NAME", "Certificados PMA")
    monkeypatch.setenv("SMTP_STARTTLS", "true")
    monkeypatch.setenv("SMTP_TIMEOUT_SECONDS", "7")
    monkeypatch.delenv("EMAIL_LOGO_URL", raising=False)
    monkeypatch.setenv("EMAIL_INSTITUTION_NAME", "Prefeitura Municipal de Amargosa")

def install_fake_smtp(monkeypatch, *, fail_message: str | None = None) -> list:
    import email_delivery

    sent_messages = []

    class FakeSMTP:
        def __init__(self, host, port, timeout):
            self.host = host
            self.port = port
            self.timeout = timeout
            sent_messages.append({"smtp": self, "message": None})

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, traceback):
            return False

        def ehlo(self):
            return None

        def starttls(self, context):
            self.started_tls = True

        def login(self, username, password):
            self.username = username
            self.password = password

        def send_message(self, message):
            if fail_message:
                raise RuntimeError(fail_message)
            sent_messages[-1]["message"] = message

    monkeypatch.setattr(email_delivery.smtplib, "SMTP", FakeSMTP)
    return sent_messages

def create_uploaded_certificate(
    client,
    *,
    nome: str = "Aluno Teste",
    curso: str = "Curso Teste",
    email: str | None = None,
    reply_email_id: int | None = None,
    carga_h: int = 8,
    concluido: str = "2026-03-28",
    render_snapshot: dict | None = None,
) -> str:
    payload = {
        "nome": nome,
        "cpf": None,
        "email": email,
        "curso": curso,
        "carga_h": carga_h,
        "concluido": concluido,
    }
    if reply_email_id is not None:
        payload["reply_email_id"] = reply_email_id

    create_response = client.post("/api/certificados", json=payload)
    assert create_response.status_code == 201
    codigo = create_response.json()["codigo"]

    upload_data = {}
    if render_snapshot is not None:
        upload_data["render_snapshot"] = json.dumps(render_snapshot)
    upload_response = client.post(
        f"/api/certificados/{codigo}/arquivo",
        data=upload_data,
        files={"arquivo": ("certificado.png", PNG_BYTES, "image/png")},
    )
    assert upload_response.status_code == 201
    return codigo

def get_email_bodies(message) -> tuple[str, str]:
    plain = message.get_body(preferencelist=("plain",))
    html = message.get_body(preferencelist=("html",))
    return (
        plain.get_content() if plain else "",
        html.get_content() if html else "",
    )

def build_edit_payload(
    codigo: str,
    password: str,
    *,
    nome: str = "Aluno Editado",
    curso: str = "Curso Editado",
    email: str | None = None,
    reply_email_id: int | None = None,
    carga_h: int = 16,
    concluido: str = "2026-04-02",
    render_snapshot: dict | None = None,
    confirmacao_codigo: str | None = None,
) -> dict:
    payload = {
        "nome": nome,
        "curso": curso,
        "carga_h": str(carga_h),
        "concluido": concluido,
        "password": password,
        "confirmacao_codigo": confirmacao_codigo or codigo,
    }
    if email is not None:
        payload["email"] = email
    if reply_email_id is not None:
        payload["reply_email_id"] = str(reply_email_id)
    if render_snapshot is not None:
        payload["render_snapshot"] = json.dumps(render_snapshot)
    return payload
