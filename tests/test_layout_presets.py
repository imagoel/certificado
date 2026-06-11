def test_operador_salva_lista_e_atualiza_layout_da_secretaria_ativa(
    client,
    seed_data,
    login,
):
    login("operador", seed_data["operador_password"])

    payload = {
        "nome": "Layout SESAU",
        "payload": {
            "version": 1,
            "layout": {
                "qr": {"x": 180, "y": 130, "maxW": 120, "maxH": 120},
                "assinatura": {"x": 330, "y": 660, "maxW": 230, "maxH": 80},
            },
            "labels": {"assinatura": "Assinatura do Responsavel"},
        },
    }
    create_response = client.post("/api/layout-presets", json=payload)

    assert create_response.status_code == 201
    created = create_response.json()
    assert created["secretaria_id"] == seed_data["seafi_id"]
    assert created["nome"] == "Layout SESAU"
    assert created["payload"]["layout"]["qr"]["x"] == 180

    list_response = client.get("/api/layout-presets")
    assert list_response.status_code == 200
    assert [item["nome"] for item in list_response.json()] == ["Layout SESAU"]

    update_response = client.post(
        "/api/layout-presets",
        json={
            "nome": "layout sesau",
            "payload": {
                "version": 1,
                "layout": {"qr": {"x": 220, "y": 140, "maxW": 130, "maxH": 130}},
                "labels": {"assinatura": "Nova assinatura"},
            },
        },
    )

    assert update_response.status_code == 200
    updated = update_response.json()
    assert updated["id"] == created["id"]
    assert updated["nome"] == "layout sesau"
    assert updated["payload"]["layout"]["qr"]["x"] == 220

    list_response = client.get("/api/layout-presets")
    assert len(list_response.json()) == 1


def test_operador_nao_lista_layouts_de_outra_secretaria(client, seed_data, login):
    login("admin", seed_data["admin_password"])
    client.post(
        "/api/auth/select-secretaria",
        json={"secretaria_id": seed_data["semed_id"]},
    )
    create_response = client.post(
        "/api/layout-presets",
        json={
            "nome": "Layout SEMED",
            "payload": {"version": 1, "layout": {"qr": {"x": 100}}},
        },
    )
    assert create_response.status_code == 201

    client.post("/api/auth/logout")
    login("operador", seed_data["operador_password"])

    denied_response = client.get(f"/api/layout-presets?secretaria_id={seed_data['semed_id']}")

    assert denied_response.status_code == 403


def test_layout_salvo_rejeita_payload_vazio(client, seed_data, login):
    login("operador", seed_data["operador_password"])

    response = client.post(
        "/api/layout-presets",
        json={"nome": "Layout vazio", "payload": {}},
    )

    assert response.status_code == 422
