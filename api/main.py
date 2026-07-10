from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.openapi.utils import get_openapi
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware

from common import (
    BASE_DIR,
    ENABLE_ADMIN_DOCS,
    ROLE_ADMIN_GLOBAL,
    SESSION_COOKIE_NAME,
    SESSION_HTTPS_ONLY,
    SESSION_MAX_AGE_SECONDS,
    SESSION_SAME_SITE,
    SESSION_SECRET,
    require_admin_user,
    require_csrf_protection,
    resolve_allowed_origins,
    run_startup_tasks,
)
from routes_admin import router as admin_router
from routes_auth import router as auth_router
from routes_certificates import router as certificates_router
from routes_layout_presets import router as layout_presets_router
from routes_public import router as public_router
from routes_secretaria_assets import router as secretaria_assets_router
from routes_templates import router as templates_router


SECURITY_HEADERS = {
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Content-Security-Policy": (
        "default-src 'self'; "
        "base-uri 'self'; "
        "object-src 'none'; "
        "frame-ancestors 'none'; "
        "img-src 'self' data: blob:; "
        "style-src 'self' 'unsafe-inline'; "
        "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
        "connect-src 'self' http://localhost:29180 http://127.0.0.1:29180"
    ),
}


@asynccontextmanager
async def lifespan(_app: FastAPI):
    run_startup_tasks()
    yield


app = FastAPI(
    title="Sistema de Certificados - API",
    version="1.1.0",
    description="API para registro, autenticacao e validacao de certificados.",
    lifespan=lifespan,
    dependencies=[Depends(require_csrf_protection)],
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)

app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")

app.add_middleware(
    SessionMiddleware,
    secret_key=SESSION_SECRET,
    session_cookie=SESSION_COOKIE_NAME,
    same_site=SESSION_SAME_SITE,
    https_only=SESSION_HTTPS_ONLY,
    max_age=SESSION_MAX_AGE_SECONDS,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=resolve_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    for header, value in SECURITY_HEADERS.items():
        response.headers.setdefault(header, value)
    return response


app.include_router(public_router)
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(certificates_router)
app.include_router(templates_router)
app.include_router(secretaria_assets_router)
app.include_router(layout_presets_router)


@app.get("/openapi.json", include_in_schema=False)
def openapi_json(_usuario=Depends(require_admin_user)) -> JSONResponse:
    if not ENABLE_ADMIN_DOCS:
        raise HTTPException(status_code=404, detail="Documentacao desativada neste ambiente.")
    return JSONResponse(
        get_openapi(
            title=app.title,
            version=app.version,
            description=app.description,
            routes=app.routes,
        )
    )


@app.get("/docs", include_in_schema=False)
def swagger_ui(_usuario=Depends(require_admin_user)) -> HTMLResponse:
    if not ENABLE_ADMIN_DOCS:
        raise HTTPException(status_code=404, detail="Documentacao desativada neste ambiente.")
    return get_swagger_ui_html(
        openapi_url="/openapi.json",
        title=f"{app.title} - Docs",
    )
