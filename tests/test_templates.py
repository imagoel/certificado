PNG_BYTES = (
    b"\x89PNG\r\n\x1a\n"
    b"\x00\x00\x00\rIHDR"
    b"\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00"
    b"\x1f\x15\xc4\x89"
    b"\x00\x00\x00\rIDATx\x9cc\xf8\xcf\xc0\xf0\x1f\x00\x05\x00\x01\xff"
    b"\x89\x99=\x1d"
    b"\x00\x00\x00\x00IEND\xaeB`\x82"
)


def test_admin_cadastra_molde_e_operador_pode_selecionar_na_secretaria_ativa(
    client, seed_data, login
):
    login("admin", seed_data["admin_password"])

    create_response = client.post(
        "/api/admin/templates",
        data={
            "secretaria_id": str(seed_data["seafi_id"]),
            "nome": "Certificado Educacao Infantil",
            "ativo": "true",
            "padrao": "true",
            "ordem": "0",
        },
        files={"arquivo": ("molde.png", PNG_BYTES, "image/png")},
    )

    assert create_response.status_code == 201
    template_payload = create_response.json()
    assert template_payload["secretaria_id"] == seed_data["seafi_id"]
    assert template_payload["padrao"] is True

    client.post("/api/auth/logout")
    login("operador", seed_data["operador_password"])

    list_response = client.get("/api/templates")
    assert list_response.status_code == 200
    assert len(list_response.json()) == 1
    assert list_response.json()[0]["nome"] == "Certificado Educacao Infantil"

    file_response = client.get(list_response.json()[0]["arquivo_url"])
    assert file_response.status_code == 200
    assert file_response.headers["content-type"].startswith("image/")


def test_operador_nao_acessa_moldes_de_outra_secretaria(client, seed_data, login):
    login("admin", seed_data["admin_password"])

    create_response = client.post(
        "/api/admin/templates",
        data={
            "secretaria_id": str(seed_data["semed_id"]),
            "nome": "Certificado Evento Semed",
            "ativo": "true",
            "padrao": "false",
            "ordem": "1",
        },
        files={"arquivo": ("molde.png", PNG_BYTES, "image/png")},
    )
    template_payload = create_response.json()

    client.post("/api/auth/logout")
    login("operador", seed_data["operador_password"])

    denied_response = client.get(f"/api/templates?secretaria_id={seed_data['semed_id']}")
    file_denied_response = client.get(template_payload["arquivo_url"])

    assert denied_response.status_code == 403
    assert file_denied_response.status_code == 403
