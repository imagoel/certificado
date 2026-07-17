import secrets
import time
from threading import Lock

from fastapi import HTTPException, Request

from app_config import (
    LOGIN_BLOCK_SECONDS,
    LOGIN_MAX_ATTEMPTS,
    LOGIN_WINDOW_SECONDS,
    TRUST_PROXY_HEADERS,
)


LOGIN_ATTEMPTS_LOCK = Lock()
LOGIN_ATTEMPTS: dict[str, dict[str, float | int]] = {}


def get_request_ip(request: Request) -> str:
    if TRUST_PROXY_HEADERS:
        forwarded = request.headers.get("x-forwarded-for", "").strip()
        if forwarded:
            return forwarded.split(",")[0].strip()

    client = request.client
    return client.host if client else "desconhecido"


def build_login_attempt_key(username: str, request: Request) -> str:
    return f"{username}|{get_request_ip(request)}"


def get_login_block_remaining_seconds(username: str, request: Request) -> int:
    key = build_login_attempt_key(username, request)
    now = time.time()

    with LOGIN_ATTEMPTS_LOCK:
        data = LOGIN_ATTEMPTS.get(key)
        if not data:
            return 0

        blocked_until = float(data.get("blocked_until", 0.0))
        if blocked_until <= now:
            return 0

        return max(1, int(blocked_until - now))


def register_failed_login_attempt(username: str, request: Request) -> int:
    key = build_login_attempt_key(username, request)
    now = time.time()

    with LOGIN_ATTEMPTS_LOCK:
        data = LOGIN_ATTEMPTS.get(key)
        if not data or float(data.get("window_started_at", 0.0)) + LOGIN_WINDOW_SECONDS < now:
            data = {
                "count": 0,
                "window_started_at": now,
                "blocked_until": 0.0,
            }

        data["count"] = int(data.get("count", 0)) + 1

        if int(data["count"]) >= LOGIN_MAX_ATTEMPTS:
            data["blocked_until"] = now + LOGIN_BLOCK_SECONDS
            data["count"] = 0
            data["window_started_at"] = now

        LOGIN_ATTEMPTS[key] = data
        blocked_until = float(data.get("blocked_until", 0.0))
        if blocked_until > now:
            return max(1, int(blocked_until - now))
        return 0


def clear_login_attempts(username: str, request: Request) -> None:
    key = build_login_attempt_key(username, request)
    with LOGIN_ATTEMPTS_LOCK:
        LOGIN_ATTEMPTS.pop(key, None)


def clear_all_login_attempts_for_username(username: str) -> None:
    normalized = (username or "").strip().lower()
    if not normalized:
        return

    prefix = f"{normalized}|"
    with LOGIN_ATTEMPTS_LOCK:
        keys_to_remove = [key for key in LOGIN_ATTEMPTS if key.startswith(prefix)]
        for key in keys_to_remove:
            LOGIN_ATTEMPTS.pop(key, None)


def ensure_csrf_token(request: Request) -> str:
    token = request.session.get("csrf_token")
    if not token:
        token = secrets.token_urlsafe(32)
        request.session["csrf_token"] = token
    return token


def require_csrf_protection(request: Request) -> None:
    if request.method.upper() in {"GET", "HEAD", "OPTIONS"}:
        return

    if request.url.path == "/api/auth/login":
        return

    if request.url.path.startswith("/api/formularios/publico/"):
        return

    if not request.session.get("user_id"):
        return

    expected_token = request.session.get("csrf_token")
    received_token = request.headers.get("x-csrf-token", "")
    if not expected_token or not received_token:
        raise HTTPException(status_code=403, detail="Token de seguranca ausente.")

    if not secrets.compare_digest(str(expected_token), received_token):
        raise HTTPException(status_code=403, detail="Token de seguranca invalido.")
