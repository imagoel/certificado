from urllib.parse import urlparse


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
    assert "Confirmar inscricao" in page_response.text
    assert "Enviar resposta" not in page_response.text
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
            "nome": "Aluno Form",
            "email": "ALUNO@EXAMPLE.COM",
            "dados_extras": {"Secretaria": "SEAFI"},
            "website": "",
        },
    )
    assert submit_response.status_code == 201
    assert submit_response.json()["protocolo"] > 0

    responses = client.get(f"/api/formularios/{form['id']}/respostas")
    assert responses.status_code == 200
    assert responses.json()[0]["nome"] == "Aluno Form"
    assert responses.json()[0]["email"] == "ALUNO@example.com"
    assert responses.json()[0]["dados_extras"] == {"Secretaria": "SEAFI"}


def test_formulario_inativo_nao_recebe_respostas(client, seed_data, login):
    login("operador", seed_data["operador_password"])
    form = _create_form(client, seed_data, ativo=False, email_obrigatorio=False, campos_extras=[])
    assert form["email_obrigatorio"] is True

    public_response = client.get(f"/api/formularios/publico/{form['token']}")
    assert public_response.status_code == 410

    page_response = client.get(f"/formularios/f/{form['token']}")
    assert page_response.status_code == 200
    assert "Formulario encerrado" in page_response.text

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


def test_lote_gera_certificado_a_partir_de_resposta_de_formulario(client, seed_data, login):
    login("operador", seed_data["operador_password"])
    form = _create_form(client, seed_data, email_obrigatorio=False, campos_extras=[])
    assert form["email_obrigatorio"] is True

    submit_response = client.post(
        f"/api/formularios/publico/{form['token']}/respostas",
        json={"nome": "Aluno Certificado", "email": "aluno@exemplo.com", "dados_extras": {}},
    )
    assert submit_response.status_code == 201
    resposta_id = submit_response.json()["protocolo"]

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
