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
    "frontend/js/app-state.js",
    "frontend/js/app-utils.js",
    "frontend/js/app-session-view.js",
    "frontend/js/app-admin-view.js",
    "frontend/js/app-certificates-view.js",
    "frontend/js/app-audit-view.js",
    "frontend/js/app-assets-view.js",
    "frontend/js/app-certificates-core.js",
    "frontend/js/app-canvas.js",
    "frontend/js/app-assets.js",
    "frontend/js/app-spreadsheets.js",
    "frontend/js/app-batch.js",
    "frontend/js/app-bootstrap.js",
]


EXPECTED_CERTIFICATE_CSV_HEADERS = [
    "Código",
    "Participante",
    "CPF",
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
    return "\n".join(path.read_text(encoding="utf-8") for path in sorted(FRONTEND_JS_DIR.glob("*.js")))


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
