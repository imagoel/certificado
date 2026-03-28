import argparse
import os
import sys

from bootstrap import create_or_update_admin, seed_secretarias
from database import SessionLocal
from migrations import ensure_database_schema


def run_seed_secretarias() -> int:
    db = SessionLocal()
    try:
        created = seed_secretarias(db)
        db.commit()
        print(f"Secretarias criadas: {created}")
        return 0
    finally:
        db.close()


def create_admin(nome: str, username: str, password: str) -> int:
    db = SessionLocal()
    try:
        _usuario, action = create_or_update_admin(db, nome, username, password)
        db.commit()
        normalized_username = username.strip().lower()
        if action == "updated":
            print(f"Admin atualizado: {normalized_username}")
        else:
            print(f"Admin criado: {normalized_username}")
        return 0
    except ValueError as error:
        print(str(error), file=sys.stderr)
        return 1
    finally:
        db.close()


def main() -> int:
    ensure_database_schema()

    parser = argparse.ArgumentParser(description="Comandos administrativos do sistema.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("migrate", help="Aplica as migracoes pendentes do banco.")
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

    if args.command == "migrate":
        print("Migracoes aplicadas com sucesso.")
        return 0

    if args.command == "seed-secretarias":
        return run_seed_secretarias()

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
