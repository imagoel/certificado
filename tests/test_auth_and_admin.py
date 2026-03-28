def test_admin_can_access_admin_auditoria(client, seed_data, login):
    response = login("admin", seed_data["admin_password"])

    assert response.status_code == 200
    assert response.json()["autenticado"] is True

    audit_response = client.get("/api/admin/auditoria")

    assert audit_response.status_code == 200
    assert audit_response.json()["total"] >= 1


def test_operador_nao_pode_acessar_rotas_admin(client, seed_data, login):
    response = login("operador", seed_data["operador_password"])

    assert response.status_code == 200
    assert response.json()["usuario"]["papel"] == "operador"

    audit_response = client.get("/api/admin/auditoria")
    users_response = client.get("/api/admin/usuarios")

    assert audit_response.status_code == 403
    assert users_response.status_code == 403


def test_admin_nao_cria_usuario_com_papel_invalido(client, seed_data, login):
    login("admin", seed_data["admin_password"])

    response = client.post(
        "/api/admin/usuarios",
        json={
            "nome": "Papel Invalido",
            "username": "papel.invalido",
            "password": "senha123",
            "papel": "qualquer_coisa",
            "ativo": True,
            "secretaria_ids": [seed_data["seafi_id"]],
        },
    )

    assert response.status_code == 422
    assert "papel" in response.text.lower()
