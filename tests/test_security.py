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
