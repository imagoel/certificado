from certificate_test_helpers import (
    EDITED_PNG_BYTES,
    build_edit_payload,
    create_uploaded_certificate,
)


def test_admin_edita_certificado_ativo_e_substitui_png_com_snapshot(
    client, seed_data, login, app_ctx
):
    original_snapshot = {
        "version": 1,
        "layout": {"qr": {"x": 160, "y": 175, "maxW": 120}},
        "labels": {"assinatura": "Assinatura original"},
    }
    updated_snapshot = {
        "version": 1,
        "layout": {"qr": {"x": 240, "y": 180, "maxW": 132}},
        "labels": {"assinatura": "Assinatura revisada"},
    }

    login("operador", seed_data["operador_password"])
    codigo = create_uploaded_certificate(
        client,
        nome="Aluno Antes",
        curso="Curso Antes",
        email="antes@EXEMPLO.COM",
        carga_h=8,
        render_snapshot=original_snapshot,
    )
    list_response = client.get("/api/certificados", params={"busca": codigo})
    assert list_response.status_code == 200
    initial_item = list_response.json()["itens"][0]
    assert initial_item["render_snapshot"] == original_snapshot
    old_hash = initial_item["hash"]
    old_emitido_em = initial_item["emitido_em"]

    canonical_path = app_ctx.media_dir / "2026" / f"{codigo}.png"
    old_path = app_ctx.media_dir / "2026" / f"antigo-{codigo}.png"
    assert canonical_path.exists()
    canonical_path.replace(old_path)

    db = app_ctx.database.SessionLocal()
    try:
        cert = db.query(app_ctx.models.Certificate).filter_by(codigo=codigo).one()
        cert.arquivo_relpath = f"2026/antigo-{codigo}.png"
        db.commit()
    finally:
        db.close()

    client.post("/api/auth/logout")
    login("admin", seed_data["admin_password"])
    reply_response = client.post(
        f"/api/admin/secretarias/{seed_data['seafi_id']}/reply-emails",
        json={
            "nome": "Setor de Certificados",
            "email": "certificados-setor@amargosa.ba.gov.br",
            "ativo": True,
            "padrao": False,
        },
    )
    assert reply_response.status_code == 201
    reply_email_id = reply_response.json()["id"]

    edit_response = client.patch(
        f"/api/admin/certificados/{codigo}",
        data=build_edit_payload(
            codigo,
            seed_data["admin_password"],
            nome="Aluno Depois",
            curso="Curso Depois",
            email="depois@EXEMPLO.COM",
            reply_email_id=reply_email_id,
            carga_h=24,
            concluido="2026-04-02",
            render_snapshot=updated_snapshot,
        ),
        files={"arquivo": ("certificado-editado.png", EDITED_PNG_BYTES, "image/png")},
    )

    assert edit_response.status_code == 200
    payload = edit_response.json()
    assert payload["codigo"] == codigo
    assert payload["nome"] == "Aluno Depois"
    assert payload["curso"] == "Curso Depois"
    assert payload["email"] == "depois@exemplo.com"
    assert payload["reply_email_id"] == reply_email_id
    assert payload["reply_to_nome"] == "Setor de Certificados"
    assert payload["reply_to_email"] == "certificados-setor@amargosa.ba.gov.br"
    assert payload["carga_h"] == 24
    assert payload["concluido"] == "2026-04-02"
    assert payload["emitido_em"] == old_emitido_em
    assert payload["hash"] != old_hash
    assert payload["render_snapshot"] == updated_snapshot
    assert payload["atualizado_por_username"] == "admin"
    assert payload["atualizado_em"]
    assert payload["arquivo_disponivel"] is True
    assert canonical_path.exists()
    assert canonical_path.read_bytes() == EDITED_PNG_BYTES
    assert not old_path.exists()

    validation_response = client.get(f"/api/validar/{codigo}")
    assert validation_response.status_code == 200
    validation_payload = validation_response.json()
    assert validation_payload["status"] == "valido"
    assert validation_payload["codigo"] == codigo
    assert validation_payload["nome"] == "Aluno Depois"
    assert validation_payload["curso"] == "Curso Depois"
    assert "email" not in validation_payload
    assert validation_payload["carga_h"] == 24
    assert validation_payload["concluido"] == "2026-04-02"

    audit_response = client.get("/api/admin/auditoria", params={"busca": codigo})
    assert audit_response.status_code == 200
    assert any(
        item["evento"] == "certificado_atualizado"
        for item in audit_response.json()["itens"]
    )

def test_admin_edicao_falha_sem_alterar_dados_ou_png(client, seed_data, login, app_ctx):
    login("operador", seed_data["operador_password"])
    codigo = create_uploaded_certificate(
        client,
        nome="Aluno Imutavel",
        curso="Curso Original",
        carga_h=10,
    )
    file_path = app_ctx.media_dir / "2026" / f"{codigo}.png"
    original_bytes = file_path.read_bytes()

    db = app_ctx.database.SessionLocal()
    try:
        cert = db.query(app_ctx.models.Certificate).filter_by(codigo=codigo).one()
        original_hash = cert.hash
        original_nome = cert.nome
        original_curso = cert.curso
        original_email = cert.email
        original_carga = cert.carga_h
        original_concluido = cert.concluido
    finally:
        db.close()

    client.post("/api/auth/logout")
    login("admin", seed_data["admin_password"])

    wrong_password_response = client.patch(
        f"/api/admin/certificados/{codigo}",
        data=build_edit_payload(codigo, "senha-incorreta"),
        files={"arquivo": ("certificado-editado.png", EDITED_PNG_BYTES, "image/png")},
    )
    wrong_code_response = client.patch(
        f"/api/admin/certificados/{codigo}",
        data=build_edit_payload(
            codigo,
            seed_data["admin_password"],
            confirmacao_codigo="ABC-2026-99999",
        ),
        files={"arquivo": ("certificado-editado.png", EDITED_PNG_BYTES, "image/png")},
    )
    invalid_email_response = client.patch(
        f"/api/admin/certificados/{codigo}",
        data=build_edit_payload(
            codigo,
            seed_data["admin_password"],
            email="@email-invalido.com",
        ),
        files={"arquivo": ("certificado-editado.png", EDITED_PNG_BYTES, "image/png")},
    )

    assert wrong_password_response.status_code == 401
    assert wrong_code_response.status_code == 422
    assert invalid_email_response.status_code == 422
    assert file_path.read_bytes() == original_bytes

    db = app_ctx.database.SessionLocal()
    try:
        cert = db.query(app_ctx.models.Certificate).filter_by(codigo=codigo).one()
        assert cert.nome == original_nome
        assert cert.curso == original_curso
        assert cert.email == original_email
        assert cert.carga_h == original_carga
        assert cert.concluido == original_concluido
        assert cert.hash == original_hash
        assert cert.atualizado_em is None
        assert cert.atualizado_por_usuario_id is None
    finally:
        db.close()

def test_edicao_admin_restrita_e_bloqueia_pendente_ou_lixeira(
    client, seed_data, login
):
    login("operador", seed_data["operador_password"])
    codigo = create_uploaded_certificate(
        client,
        nome="Aluno Restrito",
        curso="Curso Restrito",
    )

    operator_response = client.patch(
        f"/api/admin/certificados/{codigo}",
        data=build_edit_payload(codigo, seed_data["operador_password"]),
        files={"arquivo": ("certificado-editado.png", EDITED_PNG_BYTES, "image/png")},
    )
    assert operator_response.status_code == 403

    pending_response = client.post(
        "/api/certificados",
        json={
            "nome": "Aluno Pendente",
            "cpf": None,
            "curso": "Curso Pendente",
            "carga_h": 5,
            "concluido": "2026-03-28",
        },
    )
    assert pending_response.status_code == 201
    pending_code = pending_response.json()["codigo"]

    client.post("/api/auth/logout")
    login("admin", seed_data["admin_password"])

    pending_edit_response = client.patch(
        f"/api/admin/certificados/{pending_code}",
        data=build_edit_payload(pending_code, seed_data["admin_password"]),
        files={"arquivo": ("certificado-editado.png", EDITED_PNG_BYTES, "image/png")},
    )
    assert pending_edit_response.status_code == 409

    delete_response = client.request(
        "DELETE",
        f"/api/admin/certificados/{codigo}",
        json={"password": seed_data["admin_password"]},
    )
    assert delete_response.status_code == 200

    trash_edit_response = client.patch(
        f"/api/admin/certificados/{codigo}",
        data=build_edit_payload(codigo, seed_data["admin_password"]),
        files={"arquivo": ("certificado-editado.png", EDITED_PNG_BYTES, "image/png")},
    )
    assert trash_edit_response.status_code == 409
