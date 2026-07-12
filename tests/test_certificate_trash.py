from datetime import datetime, timedelta

from certificate_test_helpers import create_uploaded_certificate


def test_admin_move_certificado_para_lixeira_e_restaura(client, seed_data, login):
    login("operador", seed_data["operador_password"])
    codigo = create_uploaded_certificate(
        client,
        nome="Joao Exclusao",
        curso="Fluxo Administrativo",
        carga_h=4,
    )

    operator_delete_response = client.request(
        "DELETE",
        f"/api/admin/certificados/{codigo}",
        json={"password": seed_data["operador_password"]},
    )
    assert operator_delete_response.status_code == 403

    client.post("/api/auth/logout")
    login("admin", seed_data["admin_password"])

    wrong_password_response = client.request(
        "DELETE",
        f"/api/admin/certificados/{codigo}",
        json={"password": "senha-incorreta"},
    )
    delete_response = client.request(
        "DELETE",
        f"/api/admin/certificados/{codigo}",
        json={"password": seed_data["admin_password"]},
    )

    assert wrong_password_response.status_code == 401
    assert delete_response.status_code == 200
    assert "lixeira" in delete_response.json()["message"].lower()

    validation_response = client.get(f"/api/validar/{codigo}")
    assert validation_response.status_code == 200
    assert validation_response.json()["status"] == "excluido"

    public_file_response = client.get(f"/api/certificados/{codigo}/arquivo")
    assert public_file_response.status_code == 404

    active_list_response = client.get("/api/certificados")
    assert active_list_response.status_code == 200
    assert codigo not in [item["codigo"] for item in active_list_response.json()["itens"]]

    trash_response = client.get("/api/certificados", params={"lixeira": "true"})
    assert trash_response.status_code == 200
    trash_payload = trash_response.json()
    assert trash_payload["total"] == 1
    trash_item = trash_payload["itens"][0]
    assert trash_item["codigo"] == codigo
    assert trash_item["excluido_em"]
    assert trash_item["exclusao_expira_em"]
    assert trash_item["excluido_por_username"] == "admin"
    assert trash_item["arquivo_disponivel"] is False
    assert trash_item["arquivo_url"] is None
    assert trash_item["arquivo_admin_url"]

    internal_file_response = client.get(f"/api/certificados/{codigo}/arquivo-interno")
    assert internal_file_response.status_code == 200

    restore_response = client.post(f"/api/admin/certificados/{codigo}/restaurar")
    assert restore_response.status_code == 200
    assert "restaurado" in restore_response.json()["message"].lower()

    restored_validation_response = client.get(f"/api/validar/{codigo}")
    assert restored_validation_response.status_code == 200
    assert restored_validation_response.json()["status"] == "valido"

    audit_response = client.get("/api/admin/auditoria")
    assert audit_response.status_code == 200
    matching_events = [
        item
        for item in audit_response.json()["itens"]
        if item.get("certificado_codigo") == codigo
    ]
    assert any(item["evento"] == "certificado_criado" for item in matching_events)
    assert any(item["evento"] == "certificado_excluido" for item in matching_events)
    assert any(item["evento"] == "certificado_restaurado" for item in matching_events)

def test_admin_move_certificados_em_lote_para_lixeira(client, seed_data, login):
    login("operador", seed_data["operador_password"])
    first_code = create_uploaded_certificate(
        client,
        nome="Aluno Lote Um",
        curso="Exclusao em Lote",
    )
    second_code = create_uploaded_certificate(
        client,
        nome="Aluno Lote Dois",
        curso="Exclusao em Lote",
    )

    client.post("/api/auth/logout")
    login("admin", seed_data["admin_password"])

    wrong_password_response = client.request(
        "DELETE",
        "/api/admin/certificados",
        json={
            "password": "senha-incorreta",
            "codigos": [first_code, second_code],
        },
    )
    assert wrong_password_response.status_code == 401

    active_before_response = client.get("/api/certificados", params={"busca": "Exclusao em Lote"})
    assert active_before_response.status_code == 200
    assert active_before_response.json()["total"] == 2

    bulk_delete_response = client.request(
        "DELETE",
        "/api/admin/certificados",
        json={
            "password": seed_data["admin_password"],
            "codigos": [first_code, second_code],
        },
    )

    assert bulk_delete_response.status_code == 200
    assert "2 certificado" in bulk_delete_response.json()["message"]

    active_after_response = client.get("/api/certificados", params={"busca": "Exclusao em Lote"})
    assert active_after_response.status_code == 200
    assert active_after_response.json()["total"] == 0

    trash_response = client.get(
        "/api/certificados",
        params={"lixeira": "true", "busca": "Exclusao em Lote"},
    )
    assert trash_response.status_code == 200
    trash_codes = {item["codigo"] for item in trash_response.json()["itens"]}
    assert trash_codes == {first_code, second_code}

def test_lixeira_expirada_remove_certificado_e_png(client, seed_data, login, app_ctx):
    login("operador", seed_data["operador_password"])
    codigo = create_uploaded_certificate(
        client,
        nome="Aluno Expirado",
        curso="Retencao de Lixeira",
    )
    file_path = app_ctx.media_dir / "2026" / f"{codigo}.png"
    assert file_path.exists()

    client.post("/api/auth/logout")
    login("admin", seed_data["admin_password"])
    delete_response = client.request(
        "DELETE",
        f"/api/admin/certificados/{codigo}",
        json={"password": seed_data["admin_password"]},
    )
    assert delete_response.status_code == 200

    db = app_ctx.database.SessionLocal()
    try:
        cert = db.query(app_ctx.models.Certificate).filter_by(codigo=codigo).one()
        now = datetime.now()
        cert.excluido_em = now - timedelta(days=31)
        cert.exclusao_expira_em = now - timedelta(days=1)
        db.commit()
    finally:
        db.close()

    trash_response = client.get("/api/certificados", params={"lixeira": "true"})
    assert trash_response.status_code == 200
    assert trash_response.json()["total"] == 0
    assert not file_path.exists()

    db = app_ctx.database.SessionLocal()
    try:
        cert_exists = db.query(app_ctx.models.Certificate).filter_by(codigo=codigo).first()
    finally:
        db.close()
    assert cert_exists is None

    audit_response = client.get("/api/admin/auditoria", params={"busca": codigo})
    assert audit_response.status_code == 200
    assert any(
        item["evento"] == "certificado_exclusao_definitiva"
        for item in audit_response.json()["itens"]
    )

def test_admin_limpa_lixeira_com_senha_e_frase(client, seed_data, login, app_ctx):
    login("operador", seed_data["operador_password"])
    first_code = create_uploaded_certificate(
        client,
        nome="Aluno Lixeira Um",
        curso="Limpeza Manual",
    )
    second_code = create_uploaded_certificate(
        client,
        nome="Aluno Lixeira Dois",
        curso="Limpeza Manual",
    )
    first_file_path = app_ctx.media_dir / "2026" / f"{first_code}.png"
    second_file_path = app_ctx.media_dir / "2026" / f"{second_code}.png"
    assert first_file_path.exists()
    assert second_file_path.exists()

    client.post("/api/auth/logout")
    login("admin", seed_data["admin_password"])
    for codigo in (first_code, second_code):
        delete_response = client.request(
            "DELETE",
            f"/api/admin/certificados/{codigo}",
            json={"password": seed_data["admin_password"]},
        )
        assert delete_response.status_code == 200

    wrong_confirmation_response = client.request(
        "DELETE",
        "/api/admin/certificados/lixeira",
        json={"password": seed_data["admin_password"], "confirmacao": "APAGAR"},
    )
    wrong_password_response = client.request(
        "DELETE",
        "/api/admin/certificados/lixeira",
        json={"password": "senha-incorreta", "confirmacao": "LIMPAR LIXEIRA"},
    )
    clear_response = client.request(
        "DELETE",
        "/api/admin/certificados/lixeira",
        json={"password": seed_data["admin_password"], "confirmacao": "LIMPAR LIXEIRA"},
    )

    assert wrong_confirmation_response.status_code == 422
    assert wrong_password_response.status_code == 401
    assert clear_response.status_code == 200
    assert "2 certificado" in clear_response.json()["message"]
    assert not first_file_path.exists()
    assert not second_file_path.exists()

    trash_response = client.get("/api/certificados", params={"lixeira": "true"})
    assert trash_response.status_code == 200
    assert trash_response.json()["total"] == 0

    db = app_ctx.database.SessionLocal()
    try:
        remaining = (
            db.query(app_ctx.models.Certificate)
            .filter(app_ctx.models.Certificate.codigo.in_([first_code, second_code]))
            .count()
        )
    finally:
        db.close()
    assert remaining == 0

    audit_response = client.get("/api/admin/auditoria")
    assert audit_response.status_code == 200
    assert any(
        item["evento"] == "certificado_lixeira_limpa"
        for item in audit_response.json()["itens"]
    )

def test_operador_nao_acessa_lixeira_de_certificados(client, seed_data, login):
    login("operador", seed_data["operador_password"])
    codigo = create_uploaded_certificate(
        client,
        nome="Aluno Sem Acesso Lixeira",
        curso="Controle de Acesso",
    )

    list_response = client.get("/api/certificados", params={"lixeira": "true"})
    restore_response = client.post(f"/api/admin/certificados/{codigo}/restaurar")
    clear_response = client.request(
        "DELETE",
        "/api/admin/certificados/lixeira",
        json={"password": seed_data["operador_password"], "confirmacao": "LIMPAR LIXEIRA"},
    )

    assert list_response.status_code == 403
    assert restore_response.status_code == 403
    assert clear_response.status_code == 403
