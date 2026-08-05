from urllib.parse import urlparse


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


def _create_form(client, seed_data, **overrides):
    payload = {
        "secretaria_id": seed_data["seafi_id"],
        "titulo": "Formulario do Curso Teste",
        "curso": "Introducao aos Projetos Administrativos",
        "carga_h": 12,
        "concluido": "2026-07-10",
        "reply_email_id": None,
        "ativo": True,
        "email_obrigatorio": True,
        "campos_extras": [
            {
                "nome": "Secretaria",
                "rotulo": "Qual secretaria faz parte?",
                "tipo": "selecao",
                "opcoes": ["SEAFI", "SEMED"],
                "obrigatorio": True,
            }
        ],
    }
    payload.update(overrides)
    response = client.post("/api/formularios", json=payload)
    assert response.status_code == 201, response.text
    return response.json()


def test_operador_cria_formulario_publico_e_lista_respostas(client, seed_data, login):
    login("operador", seed_data["operador_password"])

    form = _create_form(client, seed_data)

    assert form["secretaria_id"] == seed_data["seafi_id"]
    assert form["email_obrigatorio"] is True
    assert form["token"]
    assert not form["token"].isdigit()
    assert "/formularios/f/" in form["public_url"]
    assert urlparse(form["public_url"]).path.rstrip("/").split("/")[-1] != str(form["id"])

    public_response = client.get(f"/api/formularios/publico/{form['token']}")
    assert public_response.status_code == 200
    public_payload = public_response.json()
    assert public_payload["titulo"] == form["titulo"]
    assert public_payload["campos_extras"][0]["nome"] == "Secretaria"
    assert public_payload["campos_extras"][0]["rotulo"] == "Qual secretaria faz parte?"
    assert public_payload["campos_extras"][0]["tipo"] == "selecao"
    assert "respostas" not in public_payload

    page_response = client.get(f"/formularios/f/{form['token']}")
    assert page_response.status_code == 200
    assert "Prefeitura Municipal de Amargosa" in page_response.text
    assert "Dados do participante" in page_response.text
    assert "Confirmar inscrição" in page_response.text
    assert "Enviar resposta" not in page_response.text
    assert "Número da inscrição" not in page_response.text
    assert "Qual secretaria faz parte?" in page_response.text
    assert "<select" in page_response.text

    qr_response = client.get("/api/qrcode", params={"texto": form["public_url"]})
    assert qr_response.status_code == 200
    assert qr_response.headers["content-type"] == "image/png"
    assert qr_response.content.startswith(b"\x89PNG")

    invalid_submit = client.post(
        f"/api/formularios/publico/{form['token']}/respostas",
        json={"nome": "Aluno Form", "email": "aluno@example.com", "dados_extras": {}},
    )
    assert invalid_submit.status_code == 422

    invalid_option = client.post(
        f"/api/formularios/publico/{form['token']}/respostas",
        json={
            "nome": "Aluno Form",
            "email": "aluno@example.com",
            "dados_extras": {"Secretaria": "Secretaria escrita fora do padrao"},
        },
    )
    assert invalid_option.status_code == 422

    submit_response = client.post(
        f"/api/formularios/publico/{form['token']}/respostas",
        json={
            "nome": "ALUNO FORM DE TESTE",
            "email": "ALUNO@EXAMPLE.COM",
            "dados_extras": {"Secretaria": "SEAFI"},
            "website": "",
        },
    )
    assert submit_response.status_code == 201
    assert "protocolo" not in submit_response.json()
    assert submit_response.json()["email_confirmacao_status"] == "falhou"

    responses = client.get(f"/api/formularios/{form['id']}/respostas")
    assert responses.status_code == 200
    assert responses.json()[0]["nome"] == "Aluno Form de Teste"
    assert responses.json()[0]["email"] == "ALUNO@example.com"
    assert responses.json()[0]["dados_extras"] == {"Secretaria": "SEAFI"}
    assert responses.json()[0]["email_confirmacao_status"] == "falhou"


def test_operador_padroniza_nomes_de_respostas_antigas(client, seed_data, login, app_ctx):
    login("operador", seed_data["operador_password"])
    form = _create_form(client, seed_data)

    submit_response = client.post(
        f"/api/formularios/publico/{form['token']}/respostas",
        json={
            "nome": "MARIA DAS DORES DE SOUZA",
            "email": "maria@example.com",
            "dados_extras": {"Secretaria": "SEAFI"},
            "website": "",
        },
    )
    assert submit_response.status_code == 201

    db = app_ctx.database.SessionLocal()
    try:
        response = db.query(app_ctx.models.CertificateFormResponse).first()
        response.nome = "MARIA DAS DORES DE SOUZA"
        db.commit()
    finally:
        db.close()

    normalize_response = client.post(f"/api/formularios/{form['id']}/respostas/padronizar-nomes")
    assert normalize_response.status_code == 200
    assert normalize_response.json()["message"] == "1 nome(s) pendente(s) padronizado(s)."

    responses = client.get(f"/api/formularios/{form['id']}/respostas")
    assert responses.status_code == 200
    assert responses.json()[0]["nome"] == "Maria das Dores de Souza"


def test_formulario_inativo_nao_recebe_respostas(client, seed_data, login):
    login("operador", seed_data["operador_password"])
    form = _create_form(client, seed_data, ativo=False, email_obrigatorio=False, campos_extras=[])
    assert form["email_obrigatorio"] is True

    public_response = client.get(f"/api/formularios/publico/{form['token']}")
    assert public_response.status_code == 410

    page_response = client.get(f"/formularios/f/{form['token']}")
    assert page_response.status_code == 200
    assert "Formulário encerrado" in page_response.text

    submit_response = client.post(
        f"/api/formularios/publico/{form['token']}/respostas",
        json={"nome": "Aluno", "email": None, "dados_extras": {}},
    )
    assert submit_response.status_code == 410

    activate_response = client.patch(f"/api/formularios/{form['id']}", json={"ativo": True})
    assert activate_response.status_code == 200
    assert activate_response.json()["ativo"] is True

    public_response_after_activate = client.get(f"/api/formularios/publico/{form['token']}")
    assert public_response_after_activate.status_code == 200

    missing_email_response = client.post(
        f"/api/formularios/publico/{form['token']}/respostas",
        json={"nome": "Aluno", "email": None, "dados_extras": {}},
    )
    assert missing_email_response.status_code == 422


def test_apenas_admin_global_exclui_formulario(client, seed_data, login):
    login("operador", seed_data["operador_password"])
    form = _create_form(client, seed_data, campos_extras=[])

    operator_delete_response = client.request("DELETE", f"/api/formularios/{form['id']}", json={})
    assert operator_delete_response.status_code == 403

    login("admin", seed_data["admin_password"])
    admin_delete_response = client.request("DELETE", f"/api/formularios/{form['id']}", json={})
    assert admin_delete_response.status_code == 200
    assert "excluido com sucesso" in admin_delete_response.json()["message"].lower()

    public_response = client.get(f"/api/formularios/publico/{form['token']}")
    assert public_response.status_code == 404


def test_operador_lista_e_edita_apenas_formularios_da_propria_secretaria(
    client, seed_data, login
):
    login("admin", seed_data["admin_password"])
    form_seafi = _create_form(client, seed_data, secretaria_id=seed_data["seafi_id"], campos_extras=[])
    form_semed = _create_form(client, seed_data, secretaria_id=seed_data["semed_id"], campos_extras=[])

    client.post("/api/auth/logout")
    login("operador", seed_data["operador_password"])

    list_response = client.get("/api/formularios")
    assert list_response.status_code == 200
    visible_ids = {item["id"] for item in list_response.json()}
    assert form_seafi["id"] in visible_ids
    assert form_semed["id"] not in visible_ids

    create_other_secretaria = client.post(
        "/api/formularios",
        json={
            "secretaria_id": seed_data["semed_id"],
            "titulo": "Formulario SEMED Bloqueado",
            "curso": "Curso SEMED Bloqueado",
            "carga_h": 8,
            "concluido": "2026-07-10",
            "reply_email_id": None,
            "ativo": True,
            "email_obrigatorio": True,
            "campos_extras": [],
        },
    )
    assert create_other_secretaria.status_code == 403

    toggle_own_response = client.patch(
        f"/api/formularios/{form_seafi['id']}",
        json={"ativo": False},
    )
    assert toggle_own_response.status_code == 200
    assert toggle_own_response.json()["ativo"] is False

    toggle_other_response = client.patch(
        f"/api/formularios/{form_semed['id']}",
        json={"ativo": False},
    )
    assert toggle_other_response.status_code == 403

    responses_other = client.get(f"/api/formularios/{form_semed['id']}/respostas")
    assert responses_other.status_code == 403

    csv_other = client.get(f"/api/formularios/{form_semed['id']}/respostas.csv")
    assert csv_other.status_code == 403


def test_lote_gera_certificado_a_partir_de_resposta_de_formulario(client, seed_data, login):
    login("operador", seed_data["operador_password"])
    form = _create_form(client, seed_data, email_obrigatorio=False, campos_extras=[])
    assert form["email_obrigatorio"] is True

    submit_response = client.post(
        f"/api/formularios/publico/{form['token']}/respostas",
        json={"nome": "Aluno Certificado", "email": "aluno@exemplo.com", "dados_extras": {}},
    )
    assert submit_response.status_code == 201
    responses_before_batch = client.get(f"/api/formularios/{form['id']}/respostas")
    assert responses_before_batch.status_code == 200
    resposta_id = responses_before_batch.json()[0]["id"]

    batch_response = client.post(
        "/api/certificados/lote",
        json={
            "prefixo": "ABC",
            "itens": [
                {
                    "nome": "Aluno Certificado",
                    "cpf": None,
                    "email": "aluno@exemplo.com",
                    "curso": form["curso"],
                    "carga_h": form["carga_h"],
                    "concluido": form["concluido"],
                    "formulario_resposta_id": resposta_id,
                }
            ],
        },
    )
    assert batch_response.status_code == 201, batch_response.text
    codigo = batch_response.json()[0]["codigo"]

    responses = client.get(f"/api/formularios/{form['id']}/respostas")
    assert responses.status_code == 200
    assert responses.json()[0]["certificado_codigo"] == codigo

    duplicate_response = client.post(
        "/api/certificados/lote",
        json={
            "prefixo": "ABC",
            "itens": [
                {
                    "nome": "Aluno Certificado",
                    "cpf": None,
                    "email": "aluno@exemplo.com",
                    "curso": form["curso"],
                    "carga_h": form["carga_h"],
                    "concluido": form["concluido"],
                    "formulario_resposta_id": resposta_id,
                }
            ],
        },
    )
    assert duplicate_response.status_code == 409


def test_resposta_ausente_nao_entra_na_contagem_e_nao_gera_certificado(
    client, seed_data, login
):
    login("operador", seed_data["operador_password"])
    form = _create_form(client, seed_data, campos_extras=[])

    submit_response = client.post(
        f"/api/formularios/publico/{form['token']}/respostas",
        json={"nome": "Aluno Ausente", "email": "ausente@exemplo.com", "dados_extras": {}},
    )
    assert submit_response.status_code == 201
    responses_before = client.get(f"/api/formularios/{form['id']}/respostas")
    assert responses_before.status_code == 200
    resposta_id = responses_before.json()[0]["id"]
    assert responses_before.json()[0]["nao_gerar_certificado"] is False

    mark_absent = client.patch(
        f"/api/formularios/{form['id']}/respostas/{resposta_id}",
        json={"nao_gerar_certificado": True},
    )
    assert mark_absent.status_code == 200
    assert mark_absent.json()["nao_gerar_certificado"] is True

    forms_after_absence = client.get("/api/formularios")
    assert forms_after_absence.status_code == 200
    updated_form = next(item for item in forms_after_absence.json() if item["id"] == form["id"])
    assert updated_form["respostas_total"] == 1
    assert updated_form["respostas_pendentes"] == 0

    blocked_batch = client.post(
        "/api/certificados/lote",
        json={
            "prefixo": "ABC",
            "itens": [
                {
                    "nome": "Aluno Ausente",
                    "cpf": None,
                    "email": "ausente@exemplo.com",
                    "curso": form["curso"],
                    "carga_h": form["carga_h"],
                    "concluido": form["concluido"],
                    "formulario_resposta_id": resposta_id,
                }
            ],
        },
    )
    assert blocked_batch.status_code == 409
    assert "ausente" in blocked_batch.json()["detail"].lower()

    reactivate = client.patch(
        f"/api/formularios/{form['id']}/respostas/{resposta_id}",
        json={"nao_gerar_certificado": False},
    )
    assert reactivate.status_code == 200
    assert reactivate.json()["nao_gerar_certificado"] is False

    forms_after_reactivate = client.get("/api/formularios")
    assert forms_after_reactivate.status_code == 200
    updated_form = next(
        item for item in forms_after_reactivate.json() if item["id"] == form["id"]
    )
    assert updated_form["respostas_pendentes"] == 1


def test_formulario_envia_email_de_confirmacao(
    client, seed_data, login, monkeypatch, app_ctx
):
    configure_smtp_env(monkeypatch)
    sent_messages = install_fake_smtp(monkeypatch)
    login("operador", seed_data["operador_password"])
    form = _create_form(client, seed_data, campos_extras=[])

    submit_response = client.post(
        f"/api/formularios/publico/{form['token']}/respostas",
        json={
            "nome": "Aluno Confirmacao",
            "email": "aluno.confirmacao@example.com",
            "dados_extras": {},
        },
    )
    assert submit_response.status_code == 201, submit_response.text
    payload = submit_response.json()
    assert payload["email_confirmacao_status"] == "enviado"
    assert payload["email_confirmacao_enviado_em"]
    assert payload["email_confirmacao_erro"] is None
    assert len(sent_messages) == 1

    message = sent_messages[0]["message"]
    assert message["To"] == "aluno.confirmacao@example.com"
    assert message["Reply-To"] == "seafi@amargosa.ba.gov.br"
    assert message["Subject"] == f"Confirmação de inscrição - {form['curso']}"
    text_body = message.get_body(preferencelist=("plain",)).get_content()
    assert "Sua inscrição no curso Introducao aos Projetos Administrativos" in text_body
    assert "Emitido por: SEAFI - Secretaria de Administracao e Financas" in text_body

    responses = client.get(f"/api/formularios/{form['id']}/respostas")
    assert responses.status_code == 200
    response_item = responses.json()[0]
    assert response_item["email_confirmacao_status"] == "enviado"
    assert response_item["email_confirmacao_em"]
    assert response_item["email_confirmacao_reply_to"] == "seafi@amargosa.ba.gov.br"

    db = app_ctx.database.SessionLocal()
    try:
        attempts = db.query(app_ctx.models.CertificateFormEmailAttempt).all()
        assert len(attempts) == 1
        assert attempts[0].status == "enviado"
        assert attempts[0].destinatario == "aluno.confirmacao@example.com"
    finally:
        db.close()


def test_formulario_confirmacao_usa_rodape_do_email_selecionado(
    client, seed_data, login, monkeypatch
):
    configure_smtp_env(monkeypatch)
    sent_messages = install_fake_smtp(monkeypatch)
    login("operador", seed_data["operador_password"])

    reply_response = client.post(
        f"/api/secretarias/{seed_data['seafi_id']}/reply-emails",
        json={
            "nome": "DIVISA",
            "email": "divisa@amargosa.ba.gov.br",
            "ativo": True,
            "padrao": False,
        },
    )
    assert reply_response.status_code == 201, reply_response.text
    reply_email_id = reply_response.json()["id"]
    form = _create_form(
        client,
        seed_data,
        reply_email_id=reply_email_id,
        campos_extras=[],
    )

    submit_response = client.post(
        f"/api/formularios/publico/{form['token']}/respostas",
        json={
            "nome": "Aluno DIVISA",
            "email": "aluno.divisa@example.com",
            "dados_extras": {},
        },
    )
    assert submit_response.status_code == 201, submit_response.text
    assert submit_response.json()["email_confirmacao_status"] == "enviado"

    message = sent_messages[0]["message"]
    assert message["Reply-To"] == "divisa@amargosa.ba.gov.br"
    text_body = message.get_body(preferencelist=("plain",)).get_content()
    assert "Emitido por: DIVISA - Secretaria de Administracao e Financas" in text_body


def test_formulario_salva_resposta_mesmo_com_falha_no_email(
    client, seed_data, login, monkeypatch
):
    configure_smtp_env(monkeypatch)
    install_fake_smtp(monkeypatch, fail_message="smtp indisponivel")
    login("operador", seed_data["operador_password"])
    form = _create_form(client, seed_data, campos_extras=[])

    submit_response = client.post(
        f"/api/formularios/publico/{form['token']}/respostas",
        json={
            "nome": "Aluno Email Falhou",
            "email": "aluno.falha@example.com",
            "dados_extras": {},
        },
    )
    assert submit_response.status_code == 201, submit_response.text
    payload = submit_response.json()
    assert payload["email_confirmacao_status"] == "falhou"
    assert "smtp indisponivel" in payload["email_confirmacao_erro"]

    responses = client.get(f"/api/formularios/{form['id']}/respostas")
    assert responses.status_code == 200
    assert responses.json()[0]["nome"] == "Aluno Email Falhou"
    assert responses.json()[0]["email_confirmacao_status"] == "falhou"
