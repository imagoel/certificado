PNG_BYTES = (
    b"\x89PNG\r\n\x1a\n"
    b"\x00\x00\x00\rIHDR"
    b"\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00"
    b"\x1f\x15\xc4\x89"
    b"\x00\x00\x00\rIDATx\x9cc\xf8\xcf\xc0\xf0\x1f\x00\x05\x00\x01\xff"
    b"\x89\x99=\x1d"
    b"\x00\x00\x00\x00IEND\xaeB`\x82"
)


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


def test_admin_exclui_usuario_sem_apagar_historico(client, seed_data, login):
    login("admin", seed_data["admin_password"])

    response = client.delete(f"/api/admin/usuarios/{seed_data['operador_id']}", json={})

    assert response.status_code == 200
    assert "excluido com sucesso" in response.json()["message"].lower()

    users_response = client.get("/api/admin/usuarios")
    usernames = [item["username"] for item in users_response.json()]
    assert "operador" not in usernames


def test_admin_exclui_usuario_que_criou_asset_sem_quebrar(client, seed_data, login):
    login("admin", seed_data["admin_password"])

    create_admin_response = client.post(
        "/api/admin/usuarios",
        json={
            "nome": "Admin Asset",
            "username": "admin.asset",
            "password": "senha1234",
            "papel": "admin_global",
            "ativo": True,
            "secretaria_ids": [],
        },
    )
    assert create_admin_response.status_code == 201
    created_admin = create_admin_response.json()

    client.post("/api/auth/logout")
    login("admin.asset", "senha1234")

    create_asset_response = client.post(
        "/api/admin/secretaria-assets",
        data={
            "secretaria_id": str(seed_data["seafi_id"]),
            "tipo": "logo",
            "nome": "Logo Criada por Admin Asset",
            "ativo": "true",
            "padrao": "false",
            "ordem": "1",
        },
        files={"arquivo": ("logo.png", PNG_BYTES, "image/png")},
    )
    assert create_asset_response.status_code == 201

    client.post("/api/auth/logout")
    login("admin", seed_data["admin_password"])

    delete_response = client.delete(f"/api/admin/usuarios/{created_admin['id']}", json={})
    assert delete_response.status_code == 200

    assets_response = client.get("/api/admin/secretaria-assets")
    assert assets_response.status_code == 200
    target = next(
        item for item in assets_response.json() if item["nome"] == "Logo Criada por Admin Asset"
    )
    assert target["criado_por_usuario_id"] is None
    assert target["criado_por_username"] is None


def test_admin_nao_exclui_secretaria_com_certificados_emitidos(client, seed_data, login):
    login("operador", seed_data["operador_password"])
    create_response = client.post(
        "/api/certificados",
        json={
            "nome": "Teste Secretaria",
            "cpf": None,
            "curso": "Fluxo Admin",
            "carga_h": 4,
            "concluido": "2026-03-28",
        },
    )
    assert create_response.status_code == 201

    client.post("/api/auth/logout")
    login("admin", seed_data["admin_password"])

    blocked_response = client.delete(f"/api/admin/secretarias/{seed_data['seafi_id']}", json={})
    assert blocked_response.status_code == 409
    assert "nao pode ser excluida" in blocked_response.text.lower()

    create_secretaria_response = client.post(
        "/api/admin/secretarias",
        json={
            "sigla": "TESTE",
            "nome": "Secretaria Temporaria",
            "ativa": True,
        },
    )
    secretaria_id = create_secretaria_response.json()["id"]

    delete_response = client.delete(f"/api/admin/secretarias/{secretaria_id}", json={})

    assert delete_response.status_code == 200
    assert "excluida com sucesso" in delete_response.json()["message"].lower()


def test_admin_nao_vincula_operador_a_secretaria_inativa(client, seed_data, login):
    login("admin", seed_data["admin_password"])

    deactivate_response = client.patch(
        f"/api/admin/secretarias/{seed_data['seafi_id']}",
        json={"ativa": False},
    )
    assert deactivate_response.status_code == 200

    create_response = client.post(
        "/api/admin/usuarios",
        json={
            "nome": "Operador Invalido",
            "username": "operador.invalido",
            "password": "senha1234",
            "papel": "operador",
            "ativo": True,
            "secretaria_ids": [seed_data["seafi_id"]],
        },
    )

    assert create_response.status_code == 422
    assert "secretarias ativas" in create_response.text.lower()


def test_admin_global_nao_mantem_vinculos_de_secretaria(client, seed_data, login):
    login("admin", seed_data["admin_password"])

    create_response = client.post(
        "/api/admin/usuarios",
        json={
            "nome": "Admin Sem Vinculo",
            "username": "admin.sem.vinculo",
            "password": "senha1234",
            "papel": "admin_global",
            "ativo": True,
            "secretaria_ids": [seed_data["seafi_id"]],
        },
    )

    assert create_response.status_code == 201
    assert create_response.json()["papel"] == "admin_global"
    assert create_response.json()["secretarias"] == []

    update_response = client.patch(
        f"/api/admin/usuarios/{seed_data['operador_id']}",
        json={
            "papel": "admin_global",
            "secretaria_ids": [seed_data["seafi_id"]],
        },
    )

    assert update_response.status_code == 200
    assert update_response.json()["papel"] == "admin_global"
    assert update_response.json()["secretarias"] == []
