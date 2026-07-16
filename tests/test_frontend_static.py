import re
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]
FRONTEND_JS_DIR = ROOT_DIR / "frontend" / "js"


EXPECTED_FRONTEND_STYLESHEET_ORDER = [
    "frontend/css/base.css",
    "frontend/css/login.css",
    "frontend/css/layout.css",
    "frontend/css/forms.css",
    "frontend/css/preview.css",
    "frontend/css/grids.css",
    "frontend/css/tables.css",
    "frontend/css/responsive.css",
]


EXPECTED_FRONTEND_SCRIPT_ORDER = [
    "frontend/js/state/app-dom.js",
    "frontend/js/state/app-layout-state.js",
    "frontend/js/state/app-runtime-state.js",
    "frontend/js/state/app-catalog-state.js",
    "frontend/js/state/app-list-state.js",
    "frontend/js/app-utils.js",
    "frontend/js/app-api.js",
    "frontend/js/app-filters.js",
    "frontend/js/app-status.js",
    "frontend/js/app-asset-utils.js",
    "frontend/js/app-preview-adjust.js",
    "frontend/js/app-navigation.js",
    "frontend/js/app-ui.js",
    "frontend/js/app-session-view.js",
    "frontend/js/app-admin-view.js",
    "frontend/js/app-certificates-view.js",
    "frontend/js/app-admin-tables.js",
    "frontend/js/app-audit-table.js",
    "frontend/js/app-list-loaders.js",
    "frontend/js/app-admin-data.js",
    "frontend/js/app-audit-view.js",
    "frontend/js/app-forms-view.js",
    "frontend/js/app-forms-builder.js",
    "frontend/js/app-forms-list.js",
    "frontend/js/app-form-responses.js",
    "frontend/js/app-assets-view.js",
    "frontend/js/app-layout-presets.js",
    "frontend/js/app-certificates-core.js",
    "frontend/js/app-canvas.js",
    "frontend/js/app-assets.js",
    "frontend/js/app-spreadsheets.js",
    "frontend/js/app-batch.js",
    "frontend/js/events/generator-events.js",
    "frontend/js/events/preview-events.js",
    "frontend/js/events/asset-events.js",
    "frontend/js/events/batch-events.js",
    "frontend/js/events/section-events.js",
    "frontend/js/events/listing-events.js",
    "frontend/js/events/forms-events.js",
    "frontend/js/events/admin-events.js",
    "frontend/js/events/session-events.js",
    "frontend/js/events/dialog-events.js",
    "frontend/js/events/startup.js",
    "frontend/js/app-bootstrap.js",
]


EXPECTED_CERTIFICATE_CSV_HEADERS = [
    "Código",
    "Participante",
    "CPF",
    "Email",
    "Curso",
    "Carga horária",
    "Data de conclusão",
    "Emitido em",
    "Emitido por",
    "Secretaria",
    "Nome da secretaria",
    "URL de validação",
]


def _frontend_script_paths() -> list[str]:
    html = (ROOT_DIR / "index.html").read_text(encoding="utf-8")
    refs = re.findall(r'<script src="([^"]+)"', html)
    return [ref.split("?", 1)[0] for ref in refs if ref.startswith("frontend/js/")]


def _frontend_stylesheet_paths() -> list[str]:
    html = (ROOT_DIR / "index.html").read_text(encoding="utf-8")
    refs = re.findall(r'<link rel="stylesheet" href="([^"]+)"', html)
    return [ref.split("?", 1)[0] for ref in refs]


def _frontend_source() -> str:
    return "\n".join(
        path.read_text(encoding="utf-8") for path in sorted(FRONTEND_JS_DIR.rglob("*.js"))
    )


def test_frontend_stylesheets_are_loaded_in_expected_order():
    stylesheet_paths = _frontend_stylesheet_paths()

    assert stylesheet_paths == EXPECTED_FRONTEND_STYLESHEET_ORDER
    assert "styles.css" not in stylesheet_paths
    for stylesheet_path in stylesheet_paths:
        assert (ROOT_DIR / stylesheet_path).is_file()


def test_frontend_scripts_are_loaded_in_expected_order():
    script_paths = _frontend_script_paths()

    assert script_paths == EXPECTED_FRONTEND_SCRIPT_ORDER
    for script_path in script_paths:
        assert (ROOT_DIR / script_path).is_file()


def test_certificate_csv_report_contract_does_not_reintroduce_png_column():
    source = _frontend_source()

    assert "PNG salvo" not in source
    assert "app-views.js" not in _frontend_script_paths()

    report_match = re.search(
        r"function buildCertificateCsvReport\(report\) \{(?P<body>.*?)\n\}",
        source,
        flags=re.S,
    )
    assert report_match, "buildCertificateCsvReport was not found"

    headers_match = re.search(r"const headers = \[(?P<headers>.*?)\];", report_match["body"], flags=re.S)
    assert headers_match, "certificate CSV headers were not found"
    headers = re.findall(r'"([^"]+)"', headers_match["headers"])
    assert headers == EXPECTED_CERTIFICATE_CSV_HEADERS

    row_match = re.search(
        r"function getCertificateReportRow\(item\) \{(?P<body>.*?)\n\}",
        source,
        flags=re.S,
    )
    assert row_match, "getCertificateReportRow was not found"
    assert "arquivo_disponivel" not in row_match["body"]

    row_values_match = re.search(r"return \[(?P<values>.*?)\];", row_match["body"], flags=re.S)
    assert row_values_match, "certificate CSV row values were not found"
    row_values = [
        line.strip().rstrip(",")
        for line in row_values_match["values"].splitlines()
        if line.strip()
    ]
    assert len(row_values) == len(EXPECTED_CERTIFICATE_CSV_HEADERS)


def test_custom_certificate_lines_can_stay_blank_without_default_fallback():
    app_assets_source = (FRONTEND_JS_DIR / "app-assets.js").read_text(encoding="utf-8")
    app_bootstrap_source = (FRONTEND_JS_DIR / "app-bootstrap.js").read_text(encoding="utf-8")
    app_batch_source = (FRONTEND_JS_DIR / "app-batch.js").read_text(encoding="utf-8")
    app_spreadsheets_source = (FRONTEND_JS_DIR / "app-spreadsheets.js").read_text(
        encoding="utf-8"
    )

    assert "|| defaultTextoLinha1" not in app_assets_source
    assert "|| defaultTextoLinha2" not in app_assets_source
    assert "|| defaultTextoLinha1" not in app_bootstrap_source
    assert "|| defaultTextoLinha2" not in app_bootstrap_source
    assert "defaultTextoLinha1" not in app_batch_source
    assert "defaultTextoLinha2" not in app_batch_source
    assert "defaultTextoLinha1" not in app_spreadsheets_source
    assert "defaultTextoLinha2" not in app_spreadsheets_source


def test_spreadsheet_email_aliases_and_validation_are_available():
    source = _frontend_source()
    runtime_state_source = (FRONTEND_JS_DIR / "state" / "app-runtime-state.js").read_text(
        encoding="utf-8"
    )
    spreadsheets_source = (FRONTEND_JS_DIR / "app-spreadsheets.js").read_text(
        encoding="utf-8"
    )

    for alias in [
        '"email"',
        '"e-mail"',
        '"e_mail"',
        '"emailaluno"',
        '"emaildoaluno"',
        '"emailparticipante"',
        '"correio"',
        '"correioeletronico"',
    ]:
        assert alias in runtime_state_source

    assert "function normalizeOptionalEmailResult" in source
    assert "linha ${rowNumber} (email invalido:" in spreadsheets_source
    assert "emailResult.value" in spreadsheets_source


def test_secretaria_reply_to_settings_are_wired_in_emails_ui():
    html = (ROOT_DIR / "index.html").read_text(encoding="utf-8")
    source = _frontend_source()

    assert 'id="secretaria-email-resposta"' not in html
    assert 'id="tab-emails"' in html
    assert 'id="emails-section"' in html
    assert 'id="email-secretaria-select"' in html
    assert 'id="reply-email-select"' in html
    assert 'id="reply-email-form"' in html
    assert 'id="reply-email-list-body"' in html
    assert "emailSecretariaSelect" in source
    assert "canManageReplyEmails" in source
    assert "replyEmailSelect" in source
    assert "replyEmailForm" in source
    assert "reply_email_id" in source
    assert "getSecretariaReplyEmailOptions" in source
    assert "populateCertificateReplyEmailOptions" in source
    assert "email_resposta: replyEmailResult.value" not in source
    assert "/api/secretarias/${secretaria.id}/reply-emails" in source
    assert "/api/secretaria-reply-emails/${editingId}" in source
    assert "Email de resposta invalido." in source
    assert "Nome exibido no e-mail" in html
    assert "Endereco que recebe respostas" in html
    assert "Origem no e-mail" in html
    assert "Endereco de resposta" in html
    assert "Emitido por: Nome exibido - Nome da secretaria" in html
    assert "buildReplyEmailIssuerLabel" in source
    assert "No e-mail aparecerá:" in source
    assert "${item.nome} <${item.email}>" not in source
    assert (ROOT_DIR / "api" / "static" / "email" / "logo-prefeitura.png").is_file()
    assert (ROOT_DIR / "assets" / "email" / "logo-prefeitura.png").is_file()


def test_frontend_dockerfile_publishes_email_static_assets():
    dockerfile = (ROOT_DIR / "Dockerfile").read_text(encoding="utf-8")

    assert "COPY api/static/ /usr/share/nginx/html/static/" in dockerfile
    assert (ROOT_DIR / "api" / "static" / "email" / "logo-prefeitura.png").is_file()
    assert (ROOT_DIR / "assets" / "email" / "logo-prefeitura.png").is_file()


def test_nginx_routes_public_forms_to_api():
    nginx_conf = (ROOT_DIR / "nginx.conf").read_text(encoding="utf-8")

    assert "location /formularios/" in nginx_conf
    assert "proxy_pass http://certificado-api:8000;" in nginx_conf


def test_forms_delete_action_is_admin_only_in_frontend():
    source = _frontend_source()

    assert "function deleteCertificateForm" in source
    assert 'method: "DELETE"' in source
    assert '"Excluir formulário"' in source
    assert '"action-menu-item danger-action"' in source
    assert "if (isAdminSession())" in source


def test_forms_listing_exposes_link_qr_and_secondary_actions():
    source = _frontend_source()
    html = (ROOT_DIR / "index.html").read_text(encoding="utf-8")
    tables_css = (ROOT_DIR / "frontend" / "css" / "tables.css").read_text(encoding="utf-8")

    assert '"Copiar link"' in source
    assert '"QR Code"' in source
    assert '"Visualizar formulário"' in source
    assert '"Desativar formulário"' in source
    assert "function copyFormLink" in source
    assert "function downloadFormQrCode" in source
    assert "function buildFormConfirmationStatusBadge" in source
    assert "aguardando certificado" in source
    assert "Confirmação" in html
    assert "form-actions" in tables_css
    assert "flex-wrap: nowrap;" in tables_css


def test_forms_options_parser_preserves_line_breaks():
    forms_source = (FRONTEND_JS_DIR / "app-forms-builder.js").read_text(encoding="utf-8")

    assert "function parseCertificateFormExtraOptions" in forms_source
    assert 'String(value || "")' in forms_source
    assert '.replace(/\\r/g, "\\n")' in forms_source
    assert ".split(/\\n|;/)" in forms_source
    assert "sanitizeText(value)\n    .split" not in forms_source


def test_certificate_email_status_and_resend_are_wired_in_listing_ui():
    html = (ROOT_DIR / "index.html").read_text(encoding="utf-8")
    source = _frontend_source()
    tables_css = (ROOT_DIR / "frontend" / "css" / "tables.css").read_text(encoding="utf-8")

    assert 'class="cert-col-email-status"' in html
    assert 'class="email-status-legend"' in html
    assert 'id="resend-email-dialog"' in html
    assert 'id="resend-email-summary"' in html
    for label in ["Enviado", "Pendente", "Nao enviado", "Falha no envio"]:
        assert label in html or label in source

    assert "function getCertificateEmailDeliveryState" in source
    assert "function resendCertificateEmail" in source
    assert "function openResendEmailDialog" in source
    assert "pendingResendCertificate" in source
    assert "Destino:" in source
    assert "Reenviar o certificado ${item.codigo}" not in source
    assert "reenviar-email" in source
    assert "email_tentativa_em" in source
    assert "email_reply_to" in source
    assert "function closeOpenActionMenus" in source
    assert "function positionActionMenu" in source
    assert 'event.target.closest(".action-menu")' in source
    assert 'event.key === "Escape"' in source
    assert "position: fixed;" in tables_css
    assert ".certificates-table th {\n  white-space: nowrap;\n}" in tables_css
    assert ".certificates-table .cert-col-code {\n  min-width: 132px;" in tables_css


def test_frontend_uses_system_dialogs_instead_of_browser_confirmations():
    html = (ROOT_DIR / "index.html").read_text(encoding="utf-8")
    source = _frontend_source()

    assert "window.confirm" not in source
    assert "window.alert" not in source
    assert "window.prompt" not in source
    assert "confirm(" not in source
    assert "alert(" not in source
    assert "prompt(" not in source
    assert 'id="confirm-action-dialog"' in html
    assert 'id="confirm-action-summary"' in html
    assert "function openConfirmActionDialog" in source
    assert "function resolveConfirmAction" in source
    assert "pendingConfirmAction" in source
    assert "confirmActionSubmitBtn" in source


def test_certificate_edit_offers_optional_email_resend_after_success():
    source = _frontend_source()

    assert "function offerResendEditedCertificateEmail" in source
    assert "Reenviar certificado atualizado?" in source
    assert "O certificado de ${participantName} foi atualizado com sucesso." in source
    assert "E-mail nao reenviado" in source
    assert "atualizado e e-mail reenviado com sucesso" in source
    assert "const resendResult = await offerResendEditedCertificateEmail(payload, codigo)" in source
