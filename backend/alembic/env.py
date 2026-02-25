import os
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool, create_engine
from sqlalchemy.orm import DeclarativeBase
from alembic import context

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Get DATABASE_URL from environment - handle Railway's format
db_url = os.environ.get("DATABASE_URL_SYNC") or os.environ.get("DATABASE_URL")
print(f"DATABASE_URL from env: {db_url[:50] if db_url else 'NOT SET'}...")

if not db_url:
    raise RuntimeError("DATABASE_URL environment variable is not set!")

# Railway provides postgres:// but psycopg2 needs postgresql://
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)
# Remove asyncpg if present (alembic uses sync driver)
db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
config.set_main_option("sqlalchemy.url", db_url)
print(f"Final DB URL: {db_url[:50]}...")

# Import models AFTER setting URL
from app.database import Base
import app.models  # noqa: ensure all models are imported

target_metadata = Base.metadata


def run_migrations_offline():
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
