from datetime import datetime, timedelta


PNG_BYTES = (
    b"\x89PNG\r\n\x1a\n"
    b"\x00\x00\x00\rIHDR"
    b"\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00"
    b"\x1f\x15\xc4\x89"
    b"\x00\x00\x00\rIDATx\x9cc\xf8\xcf\xc0\xf0\x1f\x00\x05\x00\x01\xff"
    b"\x89\x99=\x1d"
    b"\x00\x00\x00\x00IEND\xaeB`\x82"
)


def create_uploaded_certificate(
    client,
    *,
    nome: str = "Aluno Teste",
    curso: str = "Curso Teste",
    carga_h: int = 8,
    concluido: str = "2026-03-28",
) -> str:
    create_response = client.post(
        "/api/certificados",
        json={
            "nome": nome,
            "cpf": None,
            "curso": curso,
            "carga_h": carga_h,
            "concluido": concluido,
        },
    )
    assert create_response.status_code == 201
    codigo = create_response.json()["codigo"]

    upload_response = client.post(
        f"/api/certificados/{codigo}/arquivo",
        files={"arquivo": ("certificado.png", PNG_BYTES, "image/png")},
    )
    assert upload_response.status_code == 201
    return codigo


def test_operador_cria_certificado_com_secretaria_ativa_e_validacao_publica(
    client, seed_data, login
):
    login("operador", seed_data["operador_password"])

    create_response = client.post(
        "/api/certificados",
        json={
            "nome": "Maria do Teste",
            "cpf": None,
            "curso": "Introducao a Sistemas",
            "carga_h": 12,
            "concluido": "2026-03-28",
        },
    )

    assert create_response.status_code == 201
    payload = create_response.json()
    assert payload["secretaria_id"] == seed_data["seafi_id"]
    assert payload["secretaria_sigla"] == "SEAFI"
    assert payload["emitido_por_username"] == "operador"
    assert payload["arquivo_disponivel"] is False

    pending_validation_response = client.get(f"/api/validar/{payload['codigo']}")

    assert pending_validation_response.status_code == 200
    assert pending_validation_response.json()["status"] == "nao_encontrado"

    upload_response = client.post(
        f"/api/certificados/{payload['codigo']}/arquivo",
        files={"arquivo": ("certificado.png", PNG_BYTES, "image/png")},
    )
    assert upload_response.status_code == 201

    validation_response = client.get(f"/api/validar/{payload['codigo']}")

    assert validation_response.status_code == 200
    assert validation_response.json()["status"] == "valido"
    assert validation_response.json()["valido"] is True


def test_api_lista_possiveis_duplicados_na_secretaria_ativa(client, seed_data, login):
    login("operador", seed_data["operador_password"])

    create_response = client.post(
        "/api/certificados",
        json={
            "nome": "Lucas Silva",
            "cpf": None,
            "curso": "Filosofia",
            "carga_h": 45,
            "concluido": "2026-03-28",
        },
    )
    assert create_response.status_code == 201

    upload_response = client.post(
        f"/api/certificados/{create_response.json()['codigo']}/arquivo",
        files={"arquivo": ("certificado.png", PNG_BYTES, "image/png")},
    )
    assert upload_response.status_code == 201

    duplicate_response = client.get(
        "/api/certificados/possiveis-duplicados",
        params={
            "nome": "Lucas Silva",
            "curso": "Filosofia",
            "concluido": "2026-03-28",
        },
    )

    assert duplicate_response.status_code == 200
    payload = duplicate_response.json()
    assert len(payload) == 1
    assert payload[0]["nome"] == "Lucas Silva"
    assert payload[0]["curso"] == "Filosofia"


def test_admin_move_certificado_para_lixeira_e_restaura(client, seed_data, login):
    login("operador", seed_data["operador_password"])
    codigo = create_uploaded_certificate(
        client,
        nome="Joao Exclusao",
        curso="Fluxo Administrativo",
        carga_h=4,
    )

    client.post("/api/auth/logout")
    login("admin", seed_data["admin_password"])

    wrong_code_response = client.request(
        "DELETE",
        f"/api/admin/certificados/{codigo}",
        json={
            "password": seed_data["admin_password"],
            "confirmacao_codigo": "CODIGO-ERRADO",
        },
    )
    wrong_password_response = client.request(
        "DELETE",
        f"/api/admin/certificados/{codigo}",
        json={
            "password": "senha-incorreta",
            "confirmacao_codigo": codigo,
        },
    )
    delete_response = client.request(
        "DELETE",
        f"/api/admin/certificados/{codigo}",
        json={
            "password": seed_data["admin_password"],
            "confirmacao_codigo": codigo,
        },
    )

    assert wrong_code_response.status_code == 422
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
        json={
            "password": seed_data["admin_password"],
            "confirmacao_codigo": codigo,
        },
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
            json={
                "password": seed_data["admin_password"],
                "confirmacao_codigo": codigo,
            },
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


def test_emissoes_automaticas_avancam_sequencia_do_mesmo_ano(client, seed_data, login):
    login("operador", seed_data["operador_password"])

    first_response = client.post(
        "/api/certificados",
        json={
            "nome": "Primeiro Automatico",
            "cpf": None,
            "curso": "Teste de Sequencia",
            "carga_h": 8,
            "concluido": "2026-03-28",
        },
    )
    second_response = client.post(
        "/api/certificados",
        json={
            "nome": "Segundo Automatico",
            "cpf": None,
            "curso": "Teste de Sequencia",
            "carga_h": 8,
            "concluido": "2026-03-28",
        },
    )

    assert first_response.status_code == 201
    assert second_response.status_code == 201
    assert first_response.json()["codigo"] == "ABC-2026-00001"
    assert second_response.json()["codigo"] == "ABC-2026-00002"


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


def test_payload_com_codigo_manual_e_ignorado_pela_api(client, seed_data, login):
    login("operador", seed_data["operador_password"])

    response = client.post(
        "/api/certificados",
        json={
            "codigo": "ABC-2026-00999",
            "nome": "Tentativa Codigo Manual",
            "cpf": None,
            "curso": "Teste de Sequencia",
            "carga_h": 4,
            "concluido": "2026-03-28",
        },
    )

    assert response.status_code == 201
    assert response.json()["codigo"] == "ABC-2026-00001"


def test_lote_reserva_codigos_automaticos_sequenciais_no_mesmo_ano(client, seed_data, login):
    login("operador", seed_data["operador_password"])

    batch_response = client.post(
        "/api/certificados/lote",
        json={
            "prefixo": "ABC",
            "itens": [
                {
                    "nome": "Auto Primeiro",
                    "cpf": None,
                    "curso": "Lote Sequencial",
                    "carga_h": 4,
                    "concluido": "2026-03-28",
                },
                {
                    "nome": "Auto Segundo",
                    "cpf": None,
                    "curso": "Lote Sequencial",
                    "carga_h": 4,
                    "concluido": "2026-03-28",
                },
                {
                    "nome": "Auto Terceiro",
                    "cpf": None,
                    "curso": "Lote Sequencial",
                    "carga_h": 4,
                    "concluido": "2026-03-28",
                },
            ],
        },
    )

    assert batch_response.status_code == 201
    codes = [item["codigo"] for item in batch_response.json()]
    assert codes == ["ABC-2026-00001", "ABC-2026-00002", "ABC-2026-00003"]


def test_operador_descarta_certificado_pendente_sem_png(client, seed_data, login):
    login("operador", seed_data["operador_password"])

    create_response = client.post(
        "/api/certificados",
        json={
            "nome": "Pendente Sem Arquivo",
            "cpf": None,
            "curso": "Teste de Descarte",
            "carga_h": 2,
            "concluido": "2026-03-28",
        },
    )

    assert create_response.status_code == 201
    codigo = create_response.json()["codigo"]

    discard_response = client.delete(f"/api/certificados/{codigo}/pendente")
    assert discard_response.status_code == 200

    validation_response = client.get(f"/api/validar/{codigo}")
    assert validation_response.status_code == 200
    assert validation_response.json()["status"] == "nao_encontrado"


def test_certificado_pendente_nao_aparece_na_listagem(client, seed_data, login):
    login("operador", seed_data["operador_password"])

    create_response = client.post(
        "/api/certificados",
        json={
            "nome": "Ainda Sem PNG",
            "cpf": None,
            "curso": "Fluxo Pendente",
            "carga_h": 6,
            "concluido": "2026-03-28",
        },
    )

    assert create_response.status_code == 201
    list_response = client.get("/api/certificados")
    assert list_response.status_code == 200
    assert list_response.json()["total"] == 0


def test_lote_acima_do_limite_retorna_422(client, seed_data, login):
    from schemas import MAX_BATCH_ITEMS

    login("operador", seed_data["operador_password"])

    payload = {
        "prefixo": "ABC",
        "itens": [
            {
                "nome": f"Aluno {index}",
                "cpf": None,
                "curso": "Lote Grande",
                "carga_h": 4,
                "concluido": "2026-03-28",
            }
            for index in range(MAX_BATCH_ITEMS + 1)
        ],
    }

    response = client.post("/api/certificados/lote", json=payload)

    assert response.status_code == 422
    assert str(MAX_BATCH_ITEMS) in response.text
