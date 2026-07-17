import json
import re
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile
from fastapi.responses import FileResponse
from PIL import Image, UnidentifiedImageError

from app_config import (
    CERTIFICADOS_MEDIA_DIR,
    MAX_IMAGE_PIXELS,
    MAX_TEMPLATE_UPLOAD_BYTES,
    MAX_UPLOAD_BYTES,
    TEMPLATES_MEDIA_DIR,
)
from models import Certificate, CertificateTemplate, SecretariaAsset


Image.MAX_IMAGE_PIXELS = MAX_IMAGE_PIXELS


def sanitize_code(codigo: str) -> str:
    return (codigo or "").strip().upper()


def build_file_relative_path(codigo: str) -> str:
    normalized = sanitize_code(codigo)
    year = datetime.now(timezone.utc).year
    parts = normalized.split("-")
    if len(parts) >= 2 and parts[1].isdigit():
        year = int(parts[1])
    return f"{year}/{normalized}.png"


def sanitize_template_name(value: str, fallback: str = "molde") -> str:
    normalized = re.sub(r"[^a-z0-9]+", "-", (value or "").strip().lower())
    normalized = normalized.strip("-")
    return normalized or fallback


def normalize_secretaria_sigla_for_path(value: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", (value or "").strip().upper())


def build_template_relative_path(secretaria_sigla: str, template_name: str, filename: str) -> str:
    suffix = Path(filename or "").suffix.lower()
    if suffix not in {".png", ".jpg", ".jpeg", ".webp"}:
        suffix = ".png"
    folder = normalize_secretaria_sigla_for_path(secretaria_sigla) or "SECRETARIA"
    base_name = sanitize_template_name(template_name)
    unique_suffix = uuid4().hex[:10]
    return f"{folder}/{base_name}-{unique_suffix}{suffix}"


def normalize_secretaria_asset_type(value: str | None) -> str:
    normalized = (value or "").strip().lower()
    if normalized not in {"logo", "assinatura", "instituicao", "selo"}:
        raise HTTPException(
            status_code=422,
            detail="Tipo de asset invalido. Use logo, assinatura, instituicao ou selo.",
        )
    return normalized


def build_secretaria_asset_relative_path(
    secretaria_sigla: str,
    asset_type: str,
    asset_name: str,
    filename: str,
) -> str:
    suffix = Path(filename or "").suffix.lower()
    if suffix not in {".png", ".jpg", ".jpeg", ".webp"}:
        suffix = ".png"
    folder = normalize_secretaria_sigla_for_path(secretaria_sigla) or "SECRETARIA"
    type_folder = normalize_secretaria_asset_type(asset_type)
    base_name = sanitize_template_name(asset_name, type_folder)
    unique_suffix = uuid4().hex[:10]
    return f"{folder}/{type_folder}/{base_name}-{unique_suffix}{suffix}"


def resolve_media_path(relative_path: str) -> Path:
    candidate = (CERTIFICADOS_MEDIA_DIR / relative_path).resolve()
    if not str(candidate).startswith(str(CERTIFICADOS_MEDIA_DIR)):
        raise HTTPException(status_code=400, detail="Caminho de arquivo invalido.")
    return candidate


class CertificatePngReplacement:
    def __init__(
        self,
        *,
        relative_path: str,
        final_path: Path,
        temp_path: Path,
        backup_path: Path | None,
        old_path: Path | None,
    ) -> None:
        self.relative_path = relative_path
        self.final_path = final_path
        self.temp_path = temp_path
        self.backup_path = backup_path
        self.old_path = old_path

    def rollback(self) -> None:
        if self.temp_path.exists():
            self.temp_path.unlink(missing_ok=True)

        if self.final_path.exists():
            self.final_path.unlink(missing_ok=True)

        if self.backup_path and self.backup_path.exists():
            self.backup_path.replace(self.final_path)

    def commit(self) -> None:
        try:
            if self.backup_path and self.backup_path.exists():
                self.backup_path.unlink(missing_ok=True)

            if (
                self.old_path
                and self.old_path != self.final_path
                and self.old_path.exists()
                and self.old_path.is_file()
            ):
                self.old_path.unlink(missing_ok=True)
        except OSError:
            pass


def parse_render_snapshot_payload(raw_value: str | dict | None) -> dict | None:
    if raw_value is None:
        return None

    if isinstance(raw_value, dict):
        return raw_value

    raw_text = str(raw_value).strip()
    if not raw_text:
        return None

    try:
        payload = json.loads(raw_text)
    except json.JSONDecodeError as error:
        raise HTTPException(status_code=422, detail="Snapshot de renderizacao invalido.") from error

    if not isinstance(payload, dict):
        raise HTTPException(status_code=422, detail="Snapshot de renderizacao deve ser um objeto.")

    return payload


def verify_uploaded_image_content(
    content: bytes,
    *,
    allowed_formats: set[str],
    invalid_detail: str,
) -> str:
    try:
        with Image.open(BytesIO(content)) as image:
            image_format = (image.format or "").upper()
            width, height = image.size
            total_pixels = width * height

            if image_format not in allowed_formats:
                raise HTTPException(status_code=415, detail=invalid_detail)
            if width <= 0 or height <= 0:
                raise HTTPException(status_code=415, detail=invalid_detail)
            if total_pixels > MAX_IMAGE_PIXELS:
                raise HTTPException(
                    status_code=413,
                    detail=(
                        "Imagem muito grande em dimensoes. "
                        f"Limite atual: {MAX_IMAGE_PIXELS} pixels."
                    ),
                )

            image.verify()
            return image_format
    except HTTPException:
        raise
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise HTTPException(status_code=415, detail=invalid_detail) from exc


def replace_certificate_png_safely(cert: Certificate, content: bytes) -> CertificatePngReplacement:
    relative_path = build_file_relative_path(cert.codigo).replace("\\", "/")
    final_path = resolve_media_path(relative_path)
    final_path.parent.mkdir(parents=True, exist_ok=True)

    old_path = None
    if cert.arquivo_relpath:
        try:
            old_path = resolve_media_path(cert.arquivo_relpath)
        except HTTPException:
            old_path = None

    temp_path = final_path.with_name(f".{final_path.name}.{uuid4().hex}.tmp")
    backup_path = final_path.with_name(f".{final_path.name}.{uuid4().hex}.bak")
    active_backup_path = None

    try:
        temp_path.write_bytes(content)
        if final_path.exists():
            final_path.replace(backup_path)
            active_backup_path = backup_path
        temp_path.replace(final_path)
    except OSError as error:
        temp_path.unlink(missing_ok=True)
        if active_backup_path and active_backup_path.exists():
            if final_path.exists():
                final_path.unlink(missing_ok=True)
            active_backup_path.replace(final_path)
        raise HTTPException(
            status_code=500,
            detail=f"Nao foi possivel substituir o PNG do certificado: {error}",
        ) from error

    return CertificatePngReplacement(
        relative_path=relative_path,
        final_path=final_path,
        temp_path=temp_path,
        backup_path=active_backup_path,
        old_path=old_path,
    )


def resolve_template_media_path(relative_path: str) -> Path:
    candidate = (TEMPLATES_MEDIA_DIR / relative_path).resolve()
    if not str(candidate).startswith(str(TEMPLATES_MEDIA_DIR)):
        raise HTTPException(status_code=400, detail="Caminho de arquivo de molde invalido.")
    return candidate


def has_certificate_file(cert: Certificate) -> bool:
    if not cert.arquivo_relpath:
        return False
    try:
        file_path = resolve_media_path(cert.arquivo_relpath)
    except HTTPException:
        return False
    return file_path.exists() and file_path.is_file()


def validate_png_upload(uploaded: UploadFile, content: bytes) -> None:
    if not uploaded.filename:
        raise HTTPException(status_code=400, detail="Arquivo PNG e obrigatorio.")

    if not content:
        raise HTTPException(status_code=400, detail="Arquivo enviado esta vazio.")

    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"Arquivo muito grande. Limite atual: {MAX_UPLOAD_BYTES} bytes.",
        )

    content_type = (uploaded.content_type or "").lower()
    if content_type and content_type not in ("image/png", "application/octet-stream"):
        raise HTTPException(status_code=415, detail="Somente arquivos PNG sao aceitos.")

    if not content.startswith(b"\x89PNG\r\n\x1a\n"):
        raise HTTPException(status_code=415, detail="Arquivo invalido. Envie um PNG valido.")

    verify_uploaded_image_content(
        content,
        allowed_formats={"PNG"},
        invalid_detail="Arquivo invalido. Envie um PNG valido.",
    )


def validate_template_upload(uploaded: UploadFile, content: bytes) -> None:
    if not uploaded.filename:
        raise HTTPException(status_code=400, detail="Arquivo de molde e obrigatorio.")

    if not content:
        raise HTTPException(status_code=400, detail="Arquivo de molde enviado esta vazio.")

    if len(content) > MAX_TEMPLATE_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=(
                f"Arquivo de molde muito grande. Limite atual: {MAX_TEMPLATE_UPLOAD_BYTES} bytes."
            ),
        )

    suffix = Path(uploaded.filename).suffix.lower()
    allowed_suffixes = {".png", ".jpg", ".jpeg", ".webp"}
    if suffix not in allowed_suffixes:
        raise HTTPException(
            status_code=415,
            detail="Formato invalido para molde. Use PNG, JPG, JPEG ou WEBP.",
        )

    content_type = (uploaded.content_type or "").lower()
    if content_type and not content_type.startswith("image/"):
        raise HTTPException(
            status_code=415,
            detail="Somente imagens podem ser usadas como molde.",
        )

    verify_uploaded_image_content(
        content,
        allowed_formats={"PNG", "JPEG", "WEBP"},
        invalid_detail="Arquivo de imagem invalido. Use PNG, JPG, JPEG ou WEBP.",
    )


def build_certificate_file_response(
    cert: Certificate,
    *,
    allow_deleted: bool = False,
) -> FileResponse:
    if bool(cert.excluido_em) and not allow_deleted:
        raise HTTPException(status_code=404, detail="Arquivo de certificado nao encontrado.")

    if cert.arquivo_pendente or not cert.arquivo_relpath:
        raise HTTPException(status_code=404, detail="Arquivo de certificado nao encontrado.")

    file_path = resolve_media_path(cert.arquivo_relpath)
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="Arquivo de certificado nao encontrado.")

    return FileResponse(
        path=file_path,
        media_type=cert.arquivo_mime or "image/png",
        filename=f"{cert.codigo}.png",
    )


def build_template_file_response(template: CertificateTemplate) -> FileResponse:
    file_path = resolve_template_media_path(template.arquivo_relpath)
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="Arquivo de molde nao encontrado.")

    suffix = Path(template.arquivo_relpath).suffix or ".png"
    filename = f"{sanitize_template_name(template.nome, 'molde')}{suffix}"
    return FileResponse(
        path=file_path,
        media_type=template.arquivo_mime or "application/octet-stream",
        filename=filename,
    )


def build_secretaria_asset_file_response(asset: SecretariaAsset) -> FileResponse:
    file_path = resolve_template_media_path(asset.arquivo_relpath)
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="Arquivo do asset nao encontrado.")

    suffix = Path(asset.arquivo_relpath).suffix or ".png"
    filename = f"{sanitize_template_name(asset.nome, asset.tipo)}{suffix}"
    return FileResponse(
        path=file_path,
        media_type=asset.arquivo_mime or "application/octet-stream",
        filename=filename,
    )
