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
