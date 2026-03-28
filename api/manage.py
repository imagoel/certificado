import argparse
import os
import sys

from database import Base, SessionLocal, engine
from models import Secretaria, Usuario
from security import hash_password, normalize_username

SECRETARIAS_INICIAIS = [
    ("SESAU", "Secretaria de Saude"),
    ("SEMED", "Secretaria de Educacao"),
    ("SEAFI", "Secretaria de Administracao e Financas"),
    ("SEAMA", "Secretaria de Agricultura e Meio Ambiente"),
    ("SEMOP", "Secretaria de Obras e Servicos Publicos"),
    ("SUGEP", "Superintendencia de Gestao de Pessoas"),
]


def seed_secretarias() -> int:
    db = SessionLocal()
    created = 0
    try:
        for sigla, nome in SECRETARIAS_INICIAIS:
            existing = db.query(Secretaria).filter(Secretaria.sigla == sigla).first()
            if existing:
                continue

            db.add(Secretaria(sigla=sigla, nome=nome, ativa=True))
            created += 1

        db.commit()
        print(f"Secretarias criadas: {created}")
        return 0
    finally:
        db.close()


def create_admin(nome: str, username: str, password: str) -> int:
    db = SessionLocal()
    try:
        normalized_username = normalize_username(username)
        if not normalized_username:
            print("Username invalido.", file=sys.stderr)
            return 1

        existing = db.query(Usuario).filter(Usuario.username == normalized_username).first()
        password_hash = hash_password(password)

        if existing:
            existing.nome = nome
            existing.senha_hash = password_hash
            existing.papel = "admin_global"
            existing.ativo = True
            db.commit()
            print(f"Admin atualizado: {normalized_username}")
            return 0

        db.add(
            Usuario(
                nome=nome,
                username=normalized_username,
                senha_hash=password_hash,
                papel="admin_global",
                ativo=True,
            )
        )
        db.commit()
        print(f"Admin criado: {normalized_username}")
        return 0
    finally:
        db.close()


def main() -> int:
    Base.metadata.create_all(bind=engine)

    parser = argparse.ArgumentParser(description="Comandos administrativos do sistema.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("seed-secretarias", help="Cria as secretarias iniciais.")

    create_admin_parser = subparsers.add_parser(
        "create-admin",
        help="Cria ou atualiza o usuario administrador inicial.",
    )
    create_admin_parser.add_argument(
        "--nome",
        default=os.getenv("ADMIN_NAME", "Administrador"),
    )
    create_admin_parser.add_argument(
        "--username",
        default=os.getenv("ADMIN_USERNAME", ""),
    )
    create_admin_parser.add_argument(
        "--password",
        default=os.getenv("ADMIN_PASSWORD", ""),
    )

    args = parser.parse_args()

    if args.command == "seed-secretarias":
        return seed_secretarias()

    if args.command == "create-admin":
        if not args.username or not args.password:
            print(
                "Informe --username e --password ou defina ADMIN_USERNAME e ADMIN_PASSWORD.",
                file=sys.stderr,
            )
            return 1
        return create_admin(args.nome, args.username, args.password)

    return 1


if __name__ == "__main__":
    raise SystemExit(main())
