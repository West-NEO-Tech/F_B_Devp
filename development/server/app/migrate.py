"""Apply Alembic migrations on startup (local, serverless, and CI)."""

from __future__ import annotations

import logging
from pathlib import Path

from alembic import command
from alembic.config import Config

logger = logging.getLogger(__name__)

_ALEMBIC_INI = Path(__file__).resolve().parent.parent / "alembic.ini"


def upgrade_to_head() -> None:
    """Run `alembic upgrade head` synchronously."""
    if not _ALEMBIC_INI.is_file():
        logger.warning("alembic.ini not found at %s — skipping migrations", _ALEMBIC_INI)
        return
    cfg = Config(str(_ALEMBIC_INI))
    command.upgrade(cfg, "head")
    logger.info("Database migrations applied (alembic upgrade head)")
