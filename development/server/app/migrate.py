"""Apply Alembic migrations on startup (local, serverless, and CI)."""

from __future__ import annotations

import logging
from pathlib import Path

from alembic import command
from alembic.config import Config

from app.config import settings
from app.db_url import migration_database_url

logger = logging.getLogger(__name__)

_ALEMBIC_INI = Path(__file__).resolve().parent.parent / "alembic.ini"
_ALEMBIC_DIR = Path(__file__).resolve().parent.parent / "alembic"


def upgrade_to_head() -> None:
    """Run `alembic upgrade head` synchronously."""
    if not _ALEMBIC_INI.is_file():
        raise FileNotFoundError(f"alembic.ini not found at {_ALEMBIC_INI}")
    if not _ALEMBIC_DIR.is_dir():
        raise FileNotFoundError(f"alembic scripts not found at {_ALEMBIC_DIR}")
    cfg = Config(str(_ALEMBIC_INI))
    cfg.set_main_option(
        "sqlalchemy.url", migration_database_url(settings.database_url)
    )
    command.upgrade(cfg, "head")
    logger.info("Database migrations applied (alembic upgrade head)")


if __name__ == "__main__":
    upgrade_to_head()
