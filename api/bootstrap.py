import os

from sqlalchemy.orm import Session

from models import Secretaria, Usuario
from security import hash_password, normalize_username

ROLE_ADMIN_GLOBAL = "admin_global"

SECRETARIAS_INICIAIS = [
    ("SESAU", "Secretaria de Saude"),
    ("SEMED", "Secretaria de Educacao"),
    ("SEAFI", "Secretaria de Administracao e Financas"),
    ("SEAMA", "Secretaria de Agricultura e Meio Ambiente"),
    ("SEMOP", "Secretaria de Obras e Servicos Publicos"),
    ("SUGEP", "Superintendencia de Gestao de Pessoas"),
]


def env_flag(name: str, default: str = "false") -> bool:
    return os.getenv(name, default).strip().lower() in {"1", "true", "yes", "on"}


def seed_secretarias(db: Session) -> int:
    created = 0
    for sigla, nome in SECRETARIAS_INICIAIS:
        existing = db.query(Secretaria).filter(Secretaria.sigla == sigla).first()
        if existing:
            continue

        db.add(Secretaria(sigla=sigla, nome=nome, ativa=True))
        created += 1

    return created


def create_or_update_admin(db: Session, nome: str, username: str, password: str) -> tuple[Usuario, str]:
    normalized_username = normalize_username(username)
    if not normalized_username:
        raise ValueError("Username invalido.")
    if not password:
        raise ValueError("Password obrigatoria para criar ou atualizar o admin.")

    existing = db.query(Usuario).filter(Usuario.username == normalized_username).first()
    password_hash = hash_password(password)

    if existing:
        existing.nome = nome
        existing.senha_hash = password_hash
        existing.papel = ROLE_ADMIN_GLOBAL
        existing.ativo = True
        return existing, "updated"

    usuario = Usuario(
        nome=nome,
        username=normalized_username,
        senha_hash=password_hash,
        papel=ROLE_ADMIN_GLOBAL,
        ativo=True,
    )
    db.add(usuario)
    db.flush()
    return usuario, "created"


def ensure_startup_admin(
    db: Session,
    *,
    nome: str,
    username: str,
    password: str,
) -> str:
    existing_admin = db.query(Usuario).filter(Usuario.papel == ROLE_ADMIN_GLOBAL).first()
    if existing_admin:
        return f"Bootstrap admin ignorado: admin '{existing_admin.username}' ja existe."

    _usuario, action = create_or_update_admin(db, nome, username, password)
    if action == "created":
        return f"Bootstrap admin criado: {normalize_username(username)}"
    return f"Bootstrap admin atualizado: {normalize_username(username)}"


def run_startup_bootstrap(db: Session) -> list[str]:
    messages: list[str] = []

    if env_flag("AUTO_SEED_SECRETARIAS", "false"):
        created = seed_secretarias(db)
        messages.append(f"Bootstrap secretarias: {created} criada(s).")

    if env_flag("AUTO_BOOTSTRAP_ADMIN", "false"):
        nome = os.getenv("BOOTSTRAP_ADMIN_NAME", "Administrador").strip() or "Administrador"
        username = os.getenv("BOOTSTRAP_ADMIN_USERNAME", "").strip()
        password = os.getenv("BOOTSTRAP_ADMIN_PASSWORD", "")

        if not username or not password:
            messages.append(
                "Bootstrap admin ignorado: defina BOOTSTRAP_ADMIN_USERNAME e BOOTSTRAP_ADMIN_PASSWORD."
            )
        else:
            messages.append(
                ensure_startup_admin(
                    db,
                    nome=nome,
                    username=username,
                    password=password,
                )
            )

    return messages
