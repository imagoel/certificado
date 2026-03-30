PNG_BYTES = (
    b"\x89PNG\r\n\x1a\n"
    b"\x00\x00\x00\rIHDR"
    b"\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00"
    b"\x1f\x15\xc4\x89"
    b"\x00\x00\x00\rIDATx\x9cc\xf8\xcf\xc0\xf0\x1f\x00\x05\x00\x01\xff"
    b"\x89\x99=\x1d"
    b"\x00\x00\x00\x00IEND\xaeB`\x82"
)


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
    assert payload["arquivo_disponivel"] is False

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
    assert validation_response.json()["status"] == "valido"
    assert validation_response.json()["valido"] is True


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
    upload_response = client.post(
        f"/api/certificados/{codigo}/arquivo",
        files={"arquivo": ("certificado.png", PNG_BYTES, "image/png")},
    )
    assert upload_response.status_code == 201

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

    audit_response = client.get("/api/admin/auditoria")
    assert audit_response.status_code == 200
    matching_events = [
        item
        for item in audit_response.json()["itens"]
        if item.get("certificado_codigo") == codigo
    ]
    assert any(item["evento"] == "certificado_criado" for item in matching_events)
    assert any(item["evento"] == "certificado_excluido" for item in matching_events)


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
