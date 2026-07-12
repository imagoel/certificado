from certificate_test_helpers import (
    PNG_BYTES,
    configure_smtp_env,
    create_uploaded_certificate,
    get_email_bodies,
    install_fake_smtp,
)


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
        "https://certificados.amargosa.ba.gov.br/assets/email/logo-prefeitura.png",
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
    assert "https://certificados.amargosa.ba.gov.br/assets/email/logo-prefeitura.png" in html_body
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
