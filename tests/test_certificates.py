def test_operador_cria_certificado_com_secretaria_ativa_e_validacao_publica(
    client, seed_data, login
):
    login("operador", seed_data["operador_password"])

    create_response = client.post(
        "/api/certificados",
        json={
            "nome": "Maria do Teste",
            "cpf": None,
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

    validation_response = client.get(f"/api/validar/{payload['codigo']}")

    assert validation_response.status_code == 200
    assert validation_response.json()["status"] == "valido"
    assert validation_response.json()["valido"] is True


def test_admin_exclui_certificado_com_confirmacao_e_senha(client, seed_data, login):
    login("operador", seed_data["operador_password"])
    create_response = client.post(
        "/api/certificados",
        json={
            "nome": "Joao Exclusao",
            "cpf": None,
            "curso": "Fluxo Administrativo",
            "carga_h": 4,
            "concluido": "2026-03-28",
        },
    )
    codigo = create_response.json()["codigo"]

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

    validation_response = client.get(f"/api/validar/{codigo}")
    assert validation_response.status_code == 200
    assert validation_response.json()["status"] == "nao_encontrado"


def test_codigo_manual_alto_avanca_proxima_emissao_automatica(client, seed_data, login):
    login("operador", seed_data["operador_password"])

    manual_response = client.post(
        "/api/certificados",
        json={
            "codigo": "ABC-2026-01000",
            "nome": "Manual Alto",
            "cpf": None,
            "curso": "Teste de Sequencia",
            "carga_h": 8,
            "concluido": "2026-03-28",
        },
    )
    automatic_response = client.post(
        "/api/certificados",
        json={
            "nome": "Automatico Seguinte",
            "cpf": None,
            "curso": "Teste de Sequencia",
            "carga_h": 8,
            "concluido": "2026-03-28",
        },
    )

    assert manual_response.status_code == 201
    assert automatic_response.status_code == 201
    assert manual_response.json()["codigo"] == "ABC-2026-01000"
    assert automatic_response.json()["codigo"] == "ABC-2026-01001"


def test_lote_reserva_codigos_sem_colidir_com_manual_no_mesmo_ano(client, seed_data, login):
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
                    "codigo": "ABC-2026-00010",
                    "nome": "Manual no Meio",
                    "cpf": None,
                    "curso": "Lote Sequencial",
                    "carga_h": 4,
                    "concluido": "2026-03-28",
                },
                {
                    "nome": "Auto Depois",
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
    assert codes == ["ABC-2026-00011", "ABC-2026-00010", "ABC-2026-00012"]


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
