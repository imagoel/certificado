PNG_BYTES = (
    b"\x89PNG\r\n\x1a\n"
    b"\x00\x00\x00\rIHDR"
    b"\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00"
    b"\x1f\x15\xc4\x89"
    b"\x00\x00\x00\rIDATx\x9cc\xf8\xcf\xc0\xf0\x1f\x00\x05\x00\x01\xff"
    b"\x89\x99=\x1d"
    b"\x00\x00\x00\x00IEND\xaeB`\x82"
)


def test_admin_cadastra_logo_e_operador_pode_listar_na_secretaria_ativa(
    client, seed_data, login
):
    login("admin", seed_data["admin_password"])

    create_response = client.post(
        "/api/admin/secretaria-assets",
        data={
            "secretaria_id": str(seed_data["seafi_id"]),
            "tipo": "logo",
            "nome": "Logo Oficial",
            "ativo": "true",
            "padrao": "true",
            "ordem": "0",
        },
        files={"arquivo": ("logo.png", PNG_BYTES, "image/png")},
    )

    assert create_response.status_code == 201
    payload = create_response.json()
    assert payload["tipo"] == "logo"
    assert payload["padrao"] is True

    client.post("/api/auth/logout")
    login("operador", seed_data["operador_password"])

    list_response = client.get("/api/secretaria-assets?tipo=logo")
    assert list_response.status_code == 200
    assert len(list_response.json()) == 1
    assert list_response.json()[0]["nome"] == "Logo Oficial"

    file_response = client.get(list_response.json()[0]["arquivo_url"])
    assert file_response.status_code == 200
    assert file_response.headers["content-type"].startswith("image/")


def test_admin_cadastra_instituicao_e_operador_pode_listar_na_secretaria_ativa(
    client, seed_data, login
):
    login("admin", seed_data["admin_password"])

    create_response = client.post(
        "/api/admin/secretaria-assets",
        data={
            "secretaria_id": str(seed_data["seafi_id"]),
            "tipo": "instituicao",
            "nome": "Instituicao Oficial",
            "ativo": "true",
            "padrao": "true",
            "ordem": "0",
        },
        files={"arquivo": ("instituicao.png", PNG_BYTES, "image/png")},
    )

    assert create_response.status_code == 201
    payload = create_response.json()
    assert payload["tipo"] == "instituicao"
    assert payload["padrao"] is True

    client.post("/api/auth/logout")
    login("operador", seed_data["operador_password"])

    list_response = client.get("/api/secretaria-assets?tipo=instituicao")
    assert list_response.status_code == 200
    assert len(list_response.json()) == 1
    assert list_response.json()[0]["nome"] == "Instituicao Oficial"

    file_response = client.get(list_response.json()[0]["arquivo_url"])
    assert file_response.status_code == 200
    assert file_response.headers["content-type"].startswith("image/")


def test_operador_nao_acessa_assets_de_outra_secretaria(client, seed_data, login):
    login("admin", seed_data["admin_password"])

    create_response = client.post(
        "/api/admin/secretaria-assets",
        data={
            "secretaria_id": str(seed_data["semed_id"]),
            "tipo": "assinatura",
            "nome": "Assinatura Diretora",
            "ativo": "true",
            "padrao": "false",
            "ordem": "1",
        },
        files={"arquivo": ("assinatura.png", PNG_BYTES, "image/png")},
    )
    payload = create_response.json()

    client.post("/api/auth/logout")
    login("operador", seed_data["operador_password"])

    denied_list = client.get(
        f"/api/secretaria-assets?tipo=assinatura&secretaria_id={seed_data['semed_id']}"
    )
    denied_file = client.get(payload["arquivo_url"])

    assert denied_list.status_code == 403
    assert denied_file.status_code == 403


def test_operador_gerencia_assets_da_secretaria_vinculada(client, seed_data, login):
    login("operador", seed_data["operador_password"])

    create_response = client.post(
        "/api/admin/secretaria-assets",
        data={
            "secretaria_id": str(seed_data["seafi_id"]),
            "tipo": "assinatura",
            "nome": "Assinatura Operador",
            "ativo": "true",
            "padrao": "true",
            "ordem": "0",
        },
        files={"arquivo": ("assinatura.png", PNG_BYTES, "image/png")},
    )

    assert create_response.status_code == 201
    payload = create_response.json()
    assert payload["secretaria_id"] == seed_data["seafi_id"]

    list_response = client.get("/api/admin/secretaria-assets")
    assert list_response.status_code == 200
    assert [item["nome"] for item in list_response.json()] == ["Assinatura Operador"]

    update_response = client.patch(
        f"/api/admin/secretaria-assets/{payload['id']}",
        data={
            "nome": "Assinatura Operador Atualizada",
            "ativo": "true",
            "padrao": "false",
            "ordem": "3",
        },
    )
    assert update_response.status_code == 200
    assert update_response.json()["nome"] == "Assinatura Operador Atualizada"

    delete_response = client.delete(f"/api/admin/secretaria-assets/{payload['id']}")
    assert delete_response.status_code == 200


def test_operador_nao_gerencia_asset_de_outra_secretaria(client, seed_data, login):
    login("admin", seed_data["admin_password"])
    create_response = client.post(
        "/api/admin/secretaria-assets",
        data={
            "secretaria_id": str(seed_data["semed_id"]),
            "tipo": "logo",
            "nome": "Logo Restrita",
            "ativo": "true",
            "padrao": "false",
            "ordem": "0",
        },
        files={"arquivo": ("logo.png", PNG_BYTES, "image/png")},
    )
    asset_id = create_response.json()["id"]

    client.post("/api/auth/logout")
    login("operador", seed_data["operador_password"])

    create_denied = client.post(
        "/api/admin/secretaria-assets",
        data={
            "secretaria_id": str(seed_data["semed_id"]),
            "tipo": "logo",
            "nome": "Logo Indevida",
            "ativo": "true",
            "padrao": "false",
            "ordem": "0",
        },
        files={"arquivo": ("logo.png", PNG_BYTES, "image/png")},
    )
    update_denied = client.patch(
        f"/api/admin/secretaria-assets/{asset_id}",
        data={"nome": "Tentativa Indevida"},
    )
    delete_denied = client.delete(f"/api/admin/secretaria-assets/{asset_id}")

    assert create_denied.status_code == 403
    assert update_denied.status_code == 403
    assert delete_denied.status_code == 403


def test_admin_exclui_secretaria_com_assets_e_remove_arquivos(client, seed_data, login, app_ctx):
    login("admin", seed_data["admin_password"])

    create_secretaria_response = client.post(
        "/api/admin/secretarias",
        json={
            "sigla": "TEMP",
            "nome": "Secretaria Temporaria de Assets",
            "ativa": True,
        },
    )
    assert create_secretaria_response.status_code == 201
    secretaria_id = create_secretaria_response.json()["id"]

    create_asset_response = client.post(
        "/api/admin/secretaria-assets",
        data={
            "secretaria_id": str(secretaria_id),
            "tipo": "assinatura",
            "nome": "Assinatura Temporaria",
            "ativo": "true",
            "padrao": "true",
            "ordem": "0",
        },
        files={"arquivo": ("assinatura.png", PNG_BYTES, "image/png")},
    )
    assert create_asset_response.status_code == 201
    asset_id = create_asset_response.json()["id"]

    db = app_ctx.database.SessionLocal()
    try:
        asset = (
            db.query(app_ctx.models.SecretariaAsset)
            .filter(app_ctx.models.SecretariaAsset.id == asset_id)
            .first()
        )
        assert asset is not None
        file_path = app_ctx.database_path.parent / "templates" / asset.arquivo_relpath
        assert file_path.exists()
    finally:
        db.close()

    delete_response = client.request("DELETE", f"/api/admin/secretarias/{secretaria_id}", json={})
    assert delete_response.status_code == 200

    db = app_ctx.database.SessionLocal()
    try:
        deleted_asset = (
            db.query(app_ctx.models.SecretariaAsset)
            .filter(app_ctx.models.SecretariaAsset.id == asset_id)
            .first()
        )
        deleted_secretaria = (
            db.query(app_ctx.models.Secretaria)
            .filter(app_ctx.models.Secretaria.id == secretaria_id)
            .first()
        )
        assert deleted_asset is None
        assert deleted_secretaria is None
    finally:
        db.close()

    assert not file_path.exists()
