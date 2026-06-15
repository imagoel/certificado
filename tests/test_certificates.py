import json
from datetime import datetime, timedelta


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


def test_operador_cria_certificado_com_secretaria_ativa_e_validacao_publica(
    client, seed_data, login
):
    login("operador", seed_data["operador_password"])

    create_response = client.post(
        "/api/certificados",
        json={
            "nome": "Maria do Teste",
            "cpf": None,
            "email": "Maria.Teste@EXEMPLO.COM",
            "curso": "Introducao a Sistemas",
            "carga_h": 12,
            "concluido": "2026-03-28",
        },
    )

    assert create_response.status_code == 201
    payload = create_response.json()
    assert payload["secretaria_id"] == seed_data["seafi_id"]
    assert payload["secretaria_sigla"] == "SEAFI"
    assert payload["emitido_por_username"] == "operador"
    assert payload["arquivo_disponivel"] is False
    assert payload["email"] == "Maria.Teste@exemplo.com"

    pending_validation_response = client.get(f"/api/validar/{payload['codigo']}")

    assert pending_validation_response.status_code == 200
    assert pending_validation_response.json()["status"] == "nao_encontrado"

    upload_response = client.post(
        f"/api/certificados/{payload['codigo']}/arquivo",
        files={"arquivo": ("certificado.png", PNG_BYTES, "image/png")},
    )
    assert upload_response.status_code == 201

    validation_response = client.get(f"/api/validar/{payload['codigo']}")

    assert validation_response.status_code == 200
    validation_payload = validation_response.json()
    assert validation_payload["status"] == "valido"
    assert validation_payload["valido"] is True
    assert "email" not in validation_payload


def test_api_rejeita_email_invalido_em_certificado_individual(client, seed_data, login):
    login("operador", seed_data["operador_password"])

    response = client.post(
        "/api/certificados",
        json={
            "nome": "Aluno Email Invalido",
            "cpf": None,
            "email": ".aluno@example.com",
            "curso": "Curso Email",
            "carga_h": 4,
            "concluido": "2026-03-28",
        },
    )

    assert response.status_code == 422


def test_api_lote_salva_email_por_certificado(client, seed_data, login):
    login("operador", seed_data["operador_password"])

    response = client.post(
        "/api/certificados/lote",
        json={
            "prefixo": "ABC",
            "itens": [
                {
                    "nome": "Aluno Lote Email",
                    "cpf": None,
                    "email": "aluno@EXEMPLO.COM",
                    "curso": "Curso Lote",
                    "carga_h": 6,
                    "concluido": "2026-03-28",
                }
            ],
        },
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload[0]["email"] == "aluno@exemplo.com"


def test_api_lote_rejeita_item_com_email_invalido(client, seed_data, login):
    login("operador", seed_data["operador_password"])

    response = client.post(
        "/api/certificados/lote",
        json={
            "prefixo": "ABC",
            "itens": [
                {
                    "nome": "Aluno Lote Email Ruim",
                    "cpf": None,
                    "email": "-aluno@example.com",
                    "curso": "Curso Lote",
                    "carga_h": 6,
                    "concluido": "2026-03-28",
                }
            ],
        },
    )

    assert response.status_code == 422


def test_certificado_com_email_envia_apos_upload_png(
    client, seed_data, login, app_ctx, monkeypatch
):
    configure_smtp_env(monkeypatch)
    sent_messages = install_fake_smtp(monkeypatch)
    login("operador", seed_data["operador_password"])

    create_response = client.post(
        "/api/certificados",
        json={
            "nome": "Aluno Com Email",
            "cpf": None,
            "email": "aluno@EXEMPLO.COM",
            "curso": "Curso Envio",
            "carga_h": 8,
            "concluido": "2026-03-28",
        },
    )
    assert create_response.status_code == 201
    codigo = create_response.json()["codigo"]

    upload_response = client.post(
        f"/api/certificados/{codigo}/arquivo",
        files={"arquivo": ("certificado.png", PNG_BYTES, "image/png")},
    )

    assert upload_response.status_code == 201
    payload = upload_response.json()
    assert payload["email_envio_status"] == "enviado"
    assert payload["email_enviado_em"]
    assert payload["email_erro"] is None

    assert len(sent_messages) == 1
    smtp = sent_messages[0]["smtp"]
    message = sent_messages[0]["message"]
    assert smtp.host == "smtp.example.test"
    assert smtp.port == 587
    assert smtp.timeout == 7
    assert smtp.username == "certificados@amargosa.ba.gov.br"
    assert smtp.password == "senha-smtp"
    assert smtp.started_tls is True
    assert message["To"] == "aluno@exemplo.com"
    assert message["Reply-To"] == "seafi@amargosa.ba.gov.br"
    assert "certificados@amargosa.ba.gov.br" in message["From"]
    assert message["Subject"] == f"Certificado {codigo} - Curso Envio"
    text_body, html_body = get_email_bodies(message)
    assert "Atenciosamente,\nPrefeitura Municipal de Amargosa" in text_body
    assert "Emitido por: SEAFI - Secretaria de Administracao e Financas" in text_body
    assert "Email principal - SEAFI" not in text_body
    assert "Seu certificado está disponível" in html_body
    assert "Prefeitura Municipal de Amargosa" in html_body
    assert "SEAFI - Secretaria de Administracao e Financas" in html_body
    assert "Email principal - SEAFI" not in html_body
    assert "<img" not in html_body
    attachments = list(message.iter_attachments())
    assert len(attachments) == 1
    assert attachments[0].get_filename() == f"{codigo}.png"

    db = app_ctx.database.SessionLocal()
    try:
        attempt = (
            db.query(app_ctx.models.CertificateEmailAttempt)
            .filter_by(certificado_codigo=codigo)
            .one()
        )
        assert attempt.status == "enviado"
        assert attempt.destinatario == "aluno@exemplo.com"
        assert attempt.reply_to == "seafi@amargosa.ba.gov.br"
        assert attempt.enviado_em is not None
    finally:
        db.close()

    validation_response = client.get(f"/api/validar/{codigo}")
    assert validation_response.status_code == 200
    validation_payload = validation_response.json()
    assert validation_payload["status"] == "valido"
    assert "email" not in validation_payload
    assert "email_envio_status" not in validation_payload

    client.post("/api/auth/logout")
    login("admin", seed_data["admin_password"])
    audit_response = client.get("/api/admin/auditoria", params={"busca": codigo})
    assert audit_response.status_code == 200
    assert any(
        item["evento"] == "certificado_email_enviado"
        for item in audit_response.json()["itens"]
    )


def test_certificado_usa_reply_to_selecionado_no_snapshot_e_smtp(
    client, seed_data, login, app_ctx, monkeypatch
):
    configure_smtp_env(monkeypatch)
    monkeypatch.setenv(
        "EMAIL_LOGO_URL",
        "https://certificados.amargosa.ba.gov.br/static/email/logo-prefeitura.png",
    )
    sent_messages = install_fake_smtp(monkeypatch)

    login("admin", seed_data["admin_password"])
    reply_response = client.post(
        f"/api/admin/secretarias/{seed_data['seafi_id']}/reply-emails",
        json={
            "nome": "Setor de Eventos",
            "email": "eventos@amargosa.ba.gov.br",
            "ativo": True,
            "padrao": False,
        },
    )
    assert reply_response.status_code == 201
    reply_email_id = reply_response.json()["id"]

    client.post("/api/auth/logout")
    login("operador", seed_data["operador_password"])

    create_response = client.post(
        "/api/certificados",
        json={
            "nome": "Aluno Reply Setor",
            "cpf": None,
            "email": "aluno.reply@example.com",
            "reply_email_id": reply_email_id,
            "curso": "Curso Reply Setor",
            "carga_h": 8,
            "concluido": "2026-03-28",
        },
    )
    assert create_response.status_code == 201
    created = create_response.json()
    codigo = created["codigo"]
    assert created["reply_email_id"] == reply_email_id
    assert created["reply_to_nome"] == "Setor de Eventos"
    assert created["reply_to_email"] == "eventos@amargosa.ba.gov.br"

    upload_response = client.post(
        f"/api/certificados/{codigo}/arquivo",
        files={"arquivo": ("certificado.png", PNG_BYTES, "image/png")},
    )

    assert upload_response.status_code == 201
    message = sent_messages[0]["message"]
    assert message["Reply-To"] == "eventos@amargosa.ba.gov.br"
    text_body, html_body = get_email_bodies(message)
    assert "Emitido por: Setor de Eventos - Secretaria de Administracao e Financas" in text_body
    assert "Setor de Eventos - Secretaria de Administracao e Financas" in html_body
    assert "https://certificados.amargosa.ba.gov.br/static/email/logo-prefeitura.png" in html_body
    assert '<img' in html_body

    db = app_ctx.database.SessionLocal()
    try:
        cert = db.query(app_ctx.models.Certificate).filter_by(codigo=codigo).one()
        attempt = (
            db.query(app_ctx.models.CertificateEmailAttempt)
            .filter_by(certificado_codigo=codigo)
            .one()
        )
        assert cert.reply_email_id == reply_email_id
        assert cert.reply_to_email == "eventos@amargosa.ba.gov.br"
        assert attempt.reply_to == "eventos@amargosa.ba.gov.br"
    finally:
        db.close()


def test_operador_nao_usa_reply_email_de_outra_secretaria(client, seed_data, login):
    login("admin", seed_data["admin_password"])
    secretarias_response = client.get("/api/admin/secretarias")
    assert secretarias_response.status_code == 200
    semed = next(
        item for item in secretarias_response.json() if item["id"] == seed_data["semed_id"]
    )
    semed_reply_id = semed["reply_emails"][0]["id"]

    client.post("/api/auth/logout")
    login("operador", seed_data["operador_password"])

    response = client.post(
        "/api/certificados",
        json={
            "nome": "Aluno Reply Invalido",
            "cpf": None,
            "email": "aluno@example.com",
            "reply_email_id": semed_reply_id,
            "curso": "Curso Reply Invalido",
            "carga_h": 8,
            "concluido": "2026-03-28",
        },
    )

    assert response.status_code == 422
    assert "email de resposta" in response.text.lower()


def test_admin_reenvia_email_de_certificado_emitido(
    client, seed_data, login, app_ctx, monkeypatch
):
    login("operador", seed_data["operador_password"])
    codigo = create_uploaded_certificate(
        client,
        nome="Aluno Reenvio Admin",
        email="reenvio.admin@example.com",
        curso="Curso Reenvio",
    )

    configure_smtp_env(monkeypatch)
    sent_messages = install_fake_smtp(monkeypatch)

    client.post("/api/auth/logout")
    login("admin", seed_data["admin_password"])
    resend_response = client.post(f"/api/certificados/{codigo}/reenviar-email", json={})

    assert resend_response.status_code == 200
    payload = resend_response.json()
    assert payload["email_envio_status"] == "enviado"
    assert payload["email_tentativa_em"]
    assert payload["email_enviado_em"]
    assert payload["email_reply_to"] == "seafi@amargosa.ba.gov.br"
    assert payload["email_erro"] is None

    assert len(sent_messages) == 1
    assert sent_messages[0]["message"]["To"] == "reenvio.admin@example.com"
    assert sent_messages[0]["message"]["Reply-To"] == "seafi@amargosa.ba.gov.br"

    list_response = client.get("/api/certificados", params={"busca": codigo})
    assert list_response.status_code == 200
    listed = list_response.json()["itens"][0]
    assert listed["email_envio_status"] == "enviado"
    assert listed["email_tentativa_em"]
    assert listed["email_reply_to"] == "seafi@amargosa.ba.gov.br"

    db = app_ctx.database.SessionLocal()
    try:
        attempts = (
            db.query(app_ctx.models.CertificateEmailAttempt)
            .filter_by(certificado_codigo=codigo)
            .all()
        )
        assert len(attempts) == 1
        assert attempts[0].status == "enviado"
    finally:
        db.close()


def test_operador_reenvia_email_e_outro_operador_nao_acessa(
    client, seed_data, login, monkeypatch
):
    login("operador", seed_data["operador_password"])
    codigo = create_uploaded_certificate(
        client,
        nome="Aluno Reenvio Operador",
        email="reenvio.operador@example.com",
        curso="Curso Reenvio",
    )

    configure_smtp_env(monkeypatch)
    sent_messages = install_fake_smtp(monkeypatch)

    resend_response = client.post(f"/api/certificados/{codigo}/reenviar-email", json={})
    assert resend_response.status_code == 200
    assert resend_response.json()["email_envio_status"] == "enviado"
    assert len(sent_messages) == 1

    client.post("/api/auth/logout")
    login("admin", seed_data["admin_password"])
    create_other_operator = client.post(
        "/api/admin/usuarios",
        json={
            "nome": "Operador Semed",
            "username": "operador.semed",
            "password": "semed12345",
            "papel": "operador",
            "ativo": True,
            "secretaria_ids": [seed_data["semed_id"]],
        },
    )
    assert create_other_operator.status_code == 201

    client.post("/api/auth/logout")
    login("operador.semed", "semed12345")
    forbidden_response = client.post(f"/api/certificados/{codigo}/reenviar-email", json={})

    assert forbidden_response.status_code == 403
    assert len(sent_messages) == 1


def test_reenvio_bloqueia_certificado_sem_email_ou_png(client, seed_data, login):
    login("operador", seed_data["operador_password"])

    without_email_code = create_uploaded_certificate(
        client,
        nome="Aluno Sem Email Reenvio",
        curso="Curso Reenvio",
    )
    no_email_response = client.post(
        f"/api/certificados/{without_email_code}/reenviar-email",
        json={},
    )
    assert no_email_response.status_code == 422
    assert "sem email" in no_email_response.text.lower()

    pending_response = client.post(
        "/api/certificados",
        json={
            "nome": "Aluno Sem PNG Reenvio",
            "cpf": None,
            "email": "pendente@example.com",
            "curso": "Curso Reenvio",
            "carga_h": 8,
            "concluido": "2026-03-28",
        },
    )
    assert pending_response.status_code == 201
    pending_code = pending_response.json()["codigo"]

    no_png_response = client.post(f"/api/certificados/{pending_code}/reenviar-email", json={})
    assert no_png_response.status_code == 409
    assert "png" in no_png_response.text.lower()


def test_reenvio_com_smtp_desativado_registra_falha(
    client, seed_data, login, app_ctx
):
    login("operador", seed_data["operador_password"])
    codigo = create_uploaded_certificate(
        client,
        nome="Aluno SMTP Desativado",
        email="smtp.desativado@example.com",
        curso="Curso Reenvio",
    )

    resend_response = client.post(f"/api/certificados/{codigo}/reenviar-email", json={})

    assert resend_response.status_code == 200
    payload = resend_response.json()
    assert payload["email_envio_status"] == "falhou"
    assert payload["email_tentativa_em"]
    assert payload["email_enviado_em"] is None
    assert "desativado" in payload["email_erro"].lower()

    db = app_ctx.database.SessionLocal()
    try:
        attempt = (
            db.query(app_ctx.models.CertificateEmailAttempt)
            .filter_by(certificado_codigo=codigo)
            .one()
        )
        assert attempt.status == "falhou"
        assert "desativado" in attempt.erro.lower()
    finally:
        db.close()


def test_falha_smtp_nao_desfaz_certificado_ou_png(
    client, seed_data, login, app_ctx, monkeypatch
):
    configure_smtp_env(monkeypatch)
    install_fake_smtp(monkeypatch, fail_message="smtp indisponivel")
    login("operador", seed_data["operador_password"])

    create_response = client.post(
        "/api/certificados",
        json={
            "nome": "Aluno Falha Email",
            "cpf": None,
            "email": "falha@example.com",
            "curso": "Curso Falha",
            "carga_h": 8,
            "concluido": "2026-03-28",
        },
    )
    assert create_response.status_code == 201
    codigo = create_response.json()["codigo"]

    upload_response = client.post(
        f"/api/certificados/{codigo}/arquivo",
        files={"arquivo": ("certificado.png", PNG_BYTES, "image/png")},
    )

    assert upload_response.status_code == 201
    payload = upload_response.json()
    assert payload["email_envio_status"] == "falhou"
    assert "smtp indisponivel" in payload["email_erro"]
    assert (app_ctx.media_dir / "2026" / f"{codigo}.png").exists()

    validation_response = client.get(f"/api/validar/{codigo}")
    assert validation_response.status_code == 200
    assert validation_response.json()["status"] == "valido"

    db = app_ctx.database.SessionLocal()
    try:
        attempt = (
            db.query(app_ctx.models.CertificateEmailAttempt)
            .filter_by(certificado_codigo=codigo)
            .one()
        )
        assert attempt.status == "falhou"
        assert "smtp indisponivel" in attempt.erro
    finally:
        db.close()


def test_certificado_sem_email_nao_tenta_envio(client, seed_data, login, app_ctx, monkeypatch):
    configure_smtp_env(monkeypatch)

    import email_delivery

    class BlockedSMTP:
        def __init__(self, *args, **kwargs):
            raise AssertionError("SMTP nao deveria ser chamado")

    monkeypatch.setattr(email_delivery.smtplib, "SMTP", BlockedSMTP)
    login("operador", seed_data["operador_password"])
    codigo = create_uploaded_certificate(client, nome="Aluno Sem Email")

    list_response = client.get("/api/certificados", params={"busca": codigo})
    assert list_response.status_code == 200
    item = list_response.json()["itens"][0]
    assert item["email_envio_status"] is None

    db = app_ctx.database.SessionLocal()
    try:
        attempts = db.query(app_ctx.models.CertificateEmailAttempt).all()
        assert attempts == []
    finally:
        db.close()


def test_secretaria_sem_reply_to_registra_falha_sem_bloquear(
    client, seed_data, login, app_ctx, monkeypatch
):
    configure_smtp_env(monkeypatch)
    sent_messages = install_fake_smtp(monkeypatch)

    db = app_ctx.database.SessionLocal()
    try:
        secretaria = db.query(app_ctx.models.Secretaria).filter_by(id=seed_data["seafi_id"]).one()
        secretaria.email_resposta = None
        db.query(app_ctx.models.SecretariaReplyEmail).filter_by(
            secretaria_id=seed_data["seafi_id"]
        ).delete()
        db.commit()
    finally:
        db.close()

    login("operador", seed_data["operador_password"])
    codigo = create_uploaded_certificate(
        client,
        nome="Aluno Sem Reply",
        email="reply@example.com",
        curso="Curso Reply",
    )

    assert sent_messages == []
    list_response = client.get("/api/certificados", params={"busca": codigo})
    assert list_response.status_code == 200
    item = list_response.json()["itens"][0]
    assert item["email_envio_status"] == "falhou"
    assert "Secretaria sem email de resposta" in item["email_erro"]
    assert item["arquivo_disponivel"] is True


def test_api_lista_possiveis_duplicados_na_secretaria_ativa(client, seed_data, login):
    login("operador", seed_data["operador_password"])

    create_response = client.post(
        "/api/certificados",
        json={
            "nome": "Lucas Silva",
            "cpf": None,
            "curso": "Filosofia",
            "carga_h": 45,
            "concluido": "2026-03-28",
        },
    )
    assert create_response.status_code == 201

    upload_response = client.post(
        f"/api/certificados/{create_response.json()['codigo']}/arquivo",
        files={"arquivo": ("certificado.png", PNG_BYTES, "image/png")},
    )
    assert upload_response.status_code == 201

    duplicate_response = client.get(
        "/api/certificados/possiveis-duplicados",
        params={
            "nome": "Lucas Silva",
            "curso": "Filosofia",
            "concluido": "2026-03-28",
        },
    )

    assert duplicate_response.status_code == 200
    payload = duplicate_response.json()
    assert len(payload) == 1
    assert payload[0]["nome"] == "Lucas Silva"
    assert payload[0]["curso"] == "Filosofia"


def test_admin_move_certificado_para_lixeira_e_restaura(client, seed_data, login):
    login("operador", seed_data["operador_password"])
    codigo = create_uploaded_certificate(
        client,
        nome="Joao Exclusao",
        curso="Fluxo Administrativo",
        carga_h=4,
    )

    client.post("/api/auth/logout")
    login("admin", seed_data["admin_password"])

    wrong_code_response = client.request(
        "DELETE",
        f"/api/admin/certificados/{codigo}",
        json={
            "password": seed_data["admin_password"],
            "confirmacao_codigo": "CODIGO-ERRADO",
        },
    )
    wrong_password_response = client.request(
        "DELETE",
        f"/api/admin/certificados/{codigo}",
        json={
            "password": "senha-incorreta",
            "confirmacao_codigo": codigo,
        },
    )
    delete_response = client.request(
        "DELETE",
        f"/api/admin/certificados/{codigo}",
        json={
            "password": seed_data["admin_password"],
            "confirmacao_codigo": codigo,
        },
    )

    assert wrong_code_response.status_code == 422
    assert wrong_password_response.status_code == 401
    assert delete_response.status_code == 200
    assert "lixeira" in delete_response.json()["message"].lower()

    validation_response = client.get(f"/api/validar/{codigo}")
    assert validation_response.status_code == 200
    assert validation_response.json()["status"] == "excluido"

    public_file_response = client.get(f"/api/certificados/{codigo}/arquivo")
    assert public_file_response.status_code == 404

    active_list_response = client.get("/api/certificados")
    assert active_list_response.status_code == 200
    assert codigo not in [item["codigo"] for item in active_list_response.json()["itens"]]

    trash_response = client.get("/api/certificados", params={"lixeira": "true"})
    assert trash_response.status_code == 200
    trash_payload = trash_response.json()
    assert trash_payload["total"] == 1
    trash_item = trash_payload["itens"][0]
    assert trash_item["codigo"] == codigo
    assert trash_item["excluido_em"]
    assert trash_item["exclusao_expira_em"]
    assert trash_item["excluido_por_username"] == "admin"
    assert trash_item["arquivo_disponivel"] is False
    assert trash_item["arquivo_url"] is None
    assert trash_item["arquivo_admin_url"]

    internal_file_response = client.get(f"/api/certificados/{codigo}/arquivo-interno")
    assert internal_file_response.status_code == 200

    restore_response = client.post(f"/api/admin/certificados/{codigo}/restaurar")
    assert restore_response.status_code == 200
    assert "restaurado" in restore_response.json()["message"].lower()

    restored_validation_response = client.get(f"/api/validar/{codigo}")
    assert restored_validation_response.status_code == 200
    assert restored_validation_response.json()["status"] == "valido"

    audit_response = client.get("/api/admin/auditoria")
    assert audit_response.status_code == 200
    matching_events = [
        item
        for item in audit_response.json()["itens"]
        if item.get("certificado_codigo") == codigo
    ]
    assert any(item["evento"] == "certificado_criado" for item in matching_events)
    assert any(item["evento"] == "certificado_excluido" for item in matching_events)
    assert any(item["evento"] == "certificado_restaurado" for item in matching_events)


def test_admin_edita_certificado_ativo_e_substitui_png_com_snapshot(
    client, seed_data, login, app_ctx
):
    original_snapshot = {
        "version": 1,
        "layout": {"qr": {"x": 160, "y": 175, "maxW": 120}},
        "labels": {"assinatura": "Assinatura original"},
    }
    updated_snapshot = {
        "version": 1,
        "layout": {"qr": {"x": 240, "y": 180, "maxW": 132}},
        "labels": {"assinatura": "Assinatura revisada"},
    }

    login("operador", seed_data["operador_password"])
    codigo = create_uploaded_certificate(
        client,
        nome="Aluno Antes",
        curso="Curso Antes",
        email="antes@EXEMPLO.COM",
        carga_h=8,
        render_snapshot=original_snapshot,
    )
    list_response = client.get("/api/certificados", params={"busca": codigo})
    assert list_response.status_code == 200
    initial_item = list_response.json()["itens"][0]
    assert initial_item["render_snapshot"] == original_snapshot
    old_hash = initial_item["hash"]
    old_emitido_em = initial_item["emitido_em"]

    canonical_path = app_ctx.media_dir / "2026" / f"{codigo}.png"
    old_path = app_ctx.media_dir / "2026" / f"antigo-{codigo}.png"
    assert canonical_path.exists()
    canonical_path.replace(old_path)

    db = app_ctx.database.SessionLocal()
    try:
        cert = db.query(app_ctx.models.Certificate).filter_by(codigo=codigo).one()
        cert.arquivo_relpath = f"2026/antigo-{codigo}.png"
        db.commit()
    finally:
        db.close()

    client.post("/api/auth/logout")
    login("admin", seed_data["admin_password"])
    reply_response = client.post(
        f"/api/admin/secretarias/{seed_data['seafi_id']}/reply-emails",
        json={
            "nome": "Setor de Certificados",
            "email": "certificados-setor@amargosa.ba.gov.br",
            "ativo": True,
            "padrao": False,
        },
    )
    assert reply_response.status_code == 201
    reply_email_id = reply_response.json()["id"]

    edit_response = client.patch(
        f"/api/admin/certificados/{codigo}",
        data=build_edit_payload(
            codigo,
            seed_data["admin_password"],
            nome="Aluno Depois",
            curso="Curso Depois",
            email="depois@EXEMPLO.COM",
            reply_email_id=reply_email_id,
            carga_h=24,
            concluido="2026-04-02",
            render_snapshot=updated_snapshot,
        ),
        files={"arquivo": ("certificado-editado.png", EDITED_PNG_BYTES, "image/png")},
    )

    assert edit_response.status_code == 200
    payload = edit_response.json()
    assert payload["codigo"] == codigo
    assert payload["nome"] == "Aluno Depois"
    assert payload["curso"] == "Curso Depois"
    assert payload["email"] == "depois@exemplo.com"
    assert payload["reply_email_id"] == reply_email_id
    assert payload["reply_to_nome"] == "Setor de Certificados"
    assert payload["reply_to_email"] == "certificados-setor@amargosa.ba.gov.br"
    assert payload["carga_h"] == 24
    assert payload["concluido"] == "2026-04-02"
    assert payload["emitido_em"] == old_emitido_em
    assert payload["hash"] != old_hash
    assert payload["render_snapshot"] == updated_snapshot
    assert payload["atualizado_por_username"] == "admin"
    assert payload["atualizado_em"]
    assert payload["arquivo_disponivel"] is True
    assert canonical_path.exists()
    assert canonical_path.read_bytes() == EDITED_PNG_BYTES
    assert not old_path.exists()

    validation_response = client.get(f"/api/validar/{codigo}")
    assert validation_response.status_code == 200
    validation_payload = validation_response.json()
    assert validation_payload["status"] == "valido"
    assert validation_payload["codigo"] == codigo
    assert validation_payload["nome"] == "Aluno Depois"
    assert validation_payload["curso"] == "Curso Depois"
    assert "email" not in validation_payload
    assert validation_payload["carga_h"] == 24
    assert validation_payload["concluido"] == "2026-04-02"

    audit_response = client.get("/api/admin/auditoria", params={"busca": codigo})
    assert audit_response.status_code == 200
    assert any(
        item["evento"] == "certificado_atualizado"
        for item in audit_response.json()["itens"]
    )


def test_admin_edicao_falha_sem_alterar_dados_ou_png(client, seed_data, login, app_ctx):
    login("operador", seed_data["operador_password"])
    codigo = create_uploaded_certificate(
        client,
        nome="Aluno Imutavel",
        curso="Curso Original",
        carga_h=10,
    )
    file_path = app_ctx.media_dir / "2026" / f"{codigo}.png"
    original_bytes = file_path.read_bytes()

    db = app_ctx.database.SessionLocal()
    try:
        cert = db.query(app_ctx.models.Certificate).filter_by(codigo=codigo).one()
        original_hash = cert.hash
        original_nome = cert.nome
        original_curso = cert.curso
        original_email = cert.email
        original_carga = cert.carga_h
        original_concluido = cert.concluido
    finally:
        db.close()

    client.post("/api/auth/logout")
    login("admin", seed_data["admin_password"])

    wrong_password_response = client.patch(
        f"/api/admin/certificados/{codigo}",
        data=build_edit_payload(codigo, "senha-incorreta"),
        files={"arquivo": ("certificado-editado.png", EDITED_PNG_BYTES, "image/png")},
    )
    wrong_code_response = client.patch(
        f"/api/admin/certificados/{codigo}",
        data=build_edit_payload(
            codigo,
            seed_data["admin_password"],
            confirmacao_codigo="ABC-2026-99999",
        ),
        files={"arquivo": ("certificado-editado.png", EDITED_PNG_BYTES, "image/png")},
    )
    invalid_email_response = client.patch(
        f"/api/admin/certificados/{codigo}",
        data=build_edit_payload(
            codigo,
            seed_data["admin_password"],
            email="@email-invalido.com",
        ),
        files={"arquivo": ("certificado-editado.png", EDITED_PNG_BYTES, "image/png")},
    )

    assert wrong_password_response.status_code == 401
    assert wrong_code_response.status_code == 422
    assert invalid_email_response.status_code == 422
    assert file_path.read_bytes() == original_bytes

    db = app_ctx.database.SessionLocal()
    try:
        cert = db.query(app_ctx.models.Certificate).filter_by(codigo=codigo).one()
        assert cert.nome == original_nome
        assert cert.curso == original_curso
        assert cert.email == original_email
        assert cert.carga_h == original_carga
        assert cert.concluido == original_concluido
        assert cert.hash == original_hash
        assert cert.atualizado_em is None
        assert cert.atualizado_por_usuario_id is None
    finally:
        db.close()


def test_edicao_admin_restrita_e_bloqueia_pendente_ou_lixeira(
    client, seed_data, login
):
    login("operador", seed_data["operador_password"])
    codigo = create_uploaded_certificate(
        client,
        nome="Aluno Restrito",
        curso="Curso Restrito",
    )

    operator_response = client.patch(
        f"/api/admin/certificados/{codigo}",
        data=build_edit_payload(codigo, seed_data["operador_password"]),
        files={"arquivo": ("certificado-editado.png", EDITED_PNG_BYTES, "image/png")},
    )
    assert operator_response.status_code == 403

    pending_response = client.post(
        "/api/certificados",
        json={
            "nome": "Aluno Pendente",
            "cpf": None,
            "curso": "Curso Pendente",
            "carga_h": 5,
            "concluido": "2026-03-28",
        },
    )
    assert pending_response.status_code == 201
    pending_code = pending_response.json()["codigo"]

    client.post("/api/auth/logout")
    login("admin", seed_data["admin_password"])

    pending_edit_response = client.patch(
        f"/api/admin/certificados/{pending_code}",
        data=build_edit_payload(pending_code, seed_data["admin_password"]),
        files={"arquivo": ("certificado-editado.png", EDITED_PNG_BYTES, "image/png")},
    )
    assert pending_edit_response.status_code == 409

    delete_response = client.request(
        "DELETE",
        f"/api/admin/certificados/{codigo}",
        json={
            "password": seed_data["admin_password"],
            "confirmacao_codigo": codigo,
        },
    )
    assert delete_response.status_code == 200

    trash_edit_response = client.patch(
        f"/api/admin/certificados/{codigo}",
        data=build_edit_payload(codigo, seed_data["admin_password"]),
        files={"arquivo": ("certificado-editado.png", EDITED_PNG_BYTES, "image/png")},
    )
    assert trash_edit_response.status_code == 409


def test_lixeira_expirada_remove_certificado_e_png(client, seed_data, login, app_ctx):
    login("operador", seed_data["operador_password"])
    codigo = create_uploaded_certificate(
        client,
        nome="Aluno Expirado",
        curso="Retencao de Lixeira",
    )
    file_path = app_ctx.media_dir / "2026" / f"{codigo}.png"
    assert file_path.exists()

    client.post("/api/auth/logout")
    login("admin", seed_data["admin_password"])
    delete_response = client.request(
        "DELETE",
        f"/api/admin/certificados/{codigo}",
        json={
            "password": seed_data["admin_password"],
            "confirmacao_codigo": codigo,
        },
    )
    assert delete_response.status_code == 200

    db = app_ctx.database.SessionLocal()
    try:
        cert = db.query(app_ctx.models.Certificate).filter_by(codigo=codigo).one()
        now = datetime.now()
        cert.excluido_em = now - timedelta(days=31)
        cert.exclusao_expira_em = now - timedelta(days=1)
        db.commit()
    finally:
        db.close()

    trash_response = client.get("/api/certificados", params={"lixeira": "true"})
    assert trash_response.status_code == 200
    assert trash_response.json()["total"] == 0
    assert not file_path.exists()

    db = app_ctx.database.SessionLocal()
    try:
        cert_exists = db.query(app_ctx.models.Certificate).filter_by(codigo=codigo).first()
    finally:
        db.close()
    assert cert_exists is None

    audit_response = client.get("/api/admin/auditoria", params={"busca": codigo})
    assert audit_response.status_code == 200
    assert any(
        item["evento"] == "certificado_exclusao_definitiva"
        for item in audit_response.json()["itens"]
    )


def test_admin_limpa_lixeira_com_senha_e_frase(client, seed_data, login, app_ctx):
    login("operador", seed_data["operador_password"])
    first_code = create_uploaded_certificate(
        client,
        nome="Aluno Lixeira Um",
        curso="Limpeza Manual",
    )
    second_code = create_uploaded_certificate(
        client,
        nome="Aluno Lixeira Dois",
        curso="Limpeza Manual",
    )
    first_file_path = app_ctx.media_dir / "2026" / f"{first_code}.png"
    second_file_path = app_ctx.media_dir / "2026" / f"{second_code}.png"
    assert first_file_path.exists()
    assert second_file_path.exists()

    client.post("/api/auth/logout")
    login("admin", seed_data["admin_password"])
    for codigo in (first_code, second_code):
        delete_response = client.request(
            "DELETE",
            f"/api/admin/certificados/{codigo}",
            json={
                "password": seed_data["admin_password"],
                "confirmacao_codigo": codigo,
            },
        )
        assert delete_response.status_code == 200

    wrong_confirmation_response = client.request(
        "DELETE",
        "/api/admin/certificados/lixeira",
        json={"password": seed_data["admin_password"], "confirmacao": "APAGAR"},
    )
    wrong_password_response = client.request(
        "DELETE",
        "/api/admin/certificados/lixeira",
        json={"password": "senha-incorreta", "confirmacao": "LIMPAR LIXEIRA"},
    )
    clear_response = client.request(
        "DELETE",
        "/api/admin/certificados/lixeira",
        json={"password": seed_data["admin_password"], "confirmacao": "LIMPAR LIXEIRA"},
    )

    assert wrong_confirmation_response.status_code == 422
    assert wrong_password_response.status_code == 401
    assert clear_response.status_code == 200
    assert "2 certificado" in clear_response.json()["message"]
    assert not first_file_path.exists()
    assert not second_file_path.exists()

    trash_response = client.get("/api/certificados", params={"lixeira": "true"})
    assert trash_response.status_code == 200
    assert trash_response.json()["total"] == 0

    db = app_ctx.database.SessionLocal()
    try:
        remaining = (
            db.query(app_ctx.models.Certificate)
            .filter(app_ctx.models.Certificate.codigo.in_([first_code, second_code]))
            .count()
        )
    finally:
        db.close()
    assert remaining == 0

    audit_response = client.get("/api/admin/auditoria")
    assert audit_response.status_code == 200
    assert any(
        item["evento"] == "certificado_lixeira_limpa"
        for item in audit_response.json()["itens"]
    )


def test_emissoes_automaticas_avancam_sequencia_do_mesmo_ano(client, seed_data, login):
    login("operador", seed_data["operador_password"])

    first_response = client.post(
        "/api/certificados",
        json={
            "nome": "Primeiro Automatico",
            "cpf": None,
            "curso": "Teste de Sequencia",
            "carga_h": 8,
            "concluido": "2026-03-28",
        },
    )
    second_response = client.post(
        "/api/certificados",
        json={
            "nome": "Segundo Automatico",
            "cpf": None,
            "curso": "Teste de Sequencia",
            "carga_h": 8,
            "concluido": "2026-03-28",
        },
    )

    assert first_response.status_code == 201
    assert second_response.status_code == 201
    assert first_response.json()["codigo"] == "ABC-2026-00001"
    assert second_response.json()["codigo"] == "ABC-2026-00002"


def test_operador_nao_acessa_lixeira_de_certificados(client, seed_data, login):
    login("operador", seed_data["operador_password"])
    codigo = create_uploaded_certificate(
        client,
        nome="Aluno Sem Acesso Lixeira",
        curso="Controle de Acesso",
    )

    list_response = client.get("/api/certificados", params={"lixeira": "true"})
    restore_response = client.post(f"/api/admin/certificados/{codigo}/restaurar")
    clear_response = client.request(
        "DELETE",
        "/api/admin/certificados/lixeira",
        json={"password": seed_data["operador_password"], "confirmacao": "LIMPAR LIXEIRA"},
    )

    assert list_response.status_code == 403
    assert restore_response.status_code == 403
    assert clear_response.status_code == 403


def test_payload_com_codigo_manual_e_ignorado_pela_api(client, seed_data, login):
    login("operador", seed_data["operador_password"])

    response = client.post(
        "/api/certificados",
        json={
            "codigo": "ABC-2026-00999",
            "nome": "Tentativa Codigo Manual",
            "cpf": None,
            "curso": "Teste de Sequencia",
            "carga_h": 4,
            "concluido": "2026-03-28",
        },
    )

    assert response.status_code == 201
    assert response.json()["codigo"] == "ABC-2026-00001"


def test_lote_reserva_codigos_automaticos_sequenciais_no_mesmo_ano(client, seed_data, login):
    login("operador", seed_data["operador_password"])

    batch_response = client.post(
        "/api/certificados/lote",
        json={
            "prefixo": "ABC",
            "itens": [
                {
                    "nome": "Auto Primeiro",
                    "cpf": None,
                    "curso": "Lote Sequencial",
                    "carga_h": 4,
                    "concluido": "2026-03-28",
                },
                {
                    "nome": "Auto Segundo",
                    "cpf": None,
                    "curso": "Lote Sequencial",
                    "carga_h": 4,
                    "concluido": "2026-03-28",
                },
                {
                    "nome": "Auto Terceiro",
                    "cpf": None,
                    "curso": "Lote Sequencial",
                    "carga_h": 4,
                    "concluido": "2026-03-28",
                },
            ],
        },
    )

    assert batch_response.status_code == 201
    codes = [item["codigo"] for item in batch_response.json()]
    assert codes == ["ABC-2026-00001", "ABC-2026-00002", "ABC-2026-00003"]


def test_operador_descarta_certificado_pendente_sem_png(client, seed_data, login):
    login("operador", seed_data["operador_password"])

    create_response = client.post(
        "/api/certificados",
        json={
            "nome": "Pendente Sem Arquivo",
            "cpf": None,
            "curso": "Teste de Descarte",
            "carga_h": 2,
            "concluido": "2026-03-28",
        },
    )

    assert create_response.status_code == 201
    codigo = create_response.json()["codigo"]

    discard_response = client.delete(f"/api/certificados/{codigo}/pendente")
    assert discard_response.status_code == 200

    validation_response = client.get(f"/api/validar/{codigo}")
    assert validation_response.status_code == 200
    assert validation_response.json()["status"] == "nao_encontrado"


def test_certificado_pendente_nao_aparece_na_listagem(client, seed_data, login):
    login("operador", seed_data["operador_password"])

    create_response = client.post(
        "/api/certificados",
        json={
            "nome": "Ainda Sem PNG",
            "cpf": None,
            "curso": "Fluxo Pendente",
            "carga_h": 6,
            "concluido": "2026-03-28",
        },
    )

    assert create_response.status_code == 201
    list_response = client.get("/api/certificados")
    assert list_response.status_code == 200
    assert list_response.json()["total"] == 0


def test_lote_acima_do_limite_retorna_422(client, seed_data, login):
    from schemas import MAX_BATCH_ITEMS

    login("operador", seed_data["operador_password"])

    payload = {
        "prefixo": "ABC",
        "itens": [
            {
                "nome": f"Aluno {index}",
                "cpf": None,
                "curso": "Lote Grande",
                "carga_h": 4,
                "concluido": "2026-03-28",
            }
            for index in range(MAX_BATCH_ITEMS + 1)
        ],
    }

    response = client.post("/api/certificados/lote", json=payload)

    assert response.status_code == 422
    assert str(MAX_BATCH_ITEMS) in response.text
