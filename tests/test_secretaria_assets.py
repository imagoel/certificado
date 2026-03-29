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
