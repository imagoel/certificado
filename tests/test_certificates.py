from certificate_test_helpers import PNG_BYTES, create_uploaded_certificate


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
