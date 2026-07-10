def test_hash_hmac_difere_do_legado_e_mantem_compatibilidade(app_ctx):
    payload = {
        "codigo": "ABC-2026-00001",
        "nome": "Teste Compatibilidade",
        "cpf": None,
        "curso": "Seguranca",
        "carga_h": 10,
        "concluido": "2026-03-28",
    }

    current_hash = app_ctx.security.calculate_certificate_hash(**payload)
    legacy_hash = app_ctx.security.calculate_legacy_certificate_hash(**payload)

    assert current_hash != legacy_hash
    assert app_ctx.security.verify_certificate_hash(expected_hash=current_hash, **payload) is True
    assert app_ctx.security.verify_certificate_hash(expected_hash=legacy_hash, **payload) is True


def test_csrf_bloqueia_acao_autenticada_sem_token(client, login, seed_data):
    login_response = login("admin", seed_data["admin_password"])
    assert login_response.status_code == 200
    assert login_response.json()["csrf_token"]

    valid_token = client.csrf_token
    client.csrf_token = None
    missing_response = client.post(
        "/api/auth/select-secretaria",
        json={"secretaria_id": seed_data["seafi_id"]},
    )
    assert missing_response.status_code == 403

    invalid_response = client.post(
        "/api/auth/select-secretaria",
        json={"secretaria_id": seed_data["seafi_id"]},
        headers={"X-CSRF-Token": "token-invalido"},
    )
    assert invalid_response.status_code == 403

    client.csrf_token = valid_token
    valid_response = client.post(
        "/api/auth/select-secretaria",
        json={"secretaria_id": seed_data["seafi_id"]},
    )
    assert valid_response.status_code == 200
