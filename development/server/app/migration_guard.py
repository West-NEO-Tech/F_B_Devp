"""Ensure Alembic migrations run once per serverless instance."""

from __future__ import annotations

import asyncio
import logging
import os
import threading

from app.config import settings
from app.migrate import upgrade_to_head

logger = logging.getLogger("bizsim.migrate")

_lock = threading.Lock()
_migrations_applied = False
_last_error: str | None = None


def _validate_migration_env() -> None:
    if not settings.is_serverless:
        return
    url = os.getenv("DATABASE_URL", "").strip()
    if not url:
        raise RuntimeError(
            "DATABASE_URL is not set on Vercel. Add it in Project Settings → Environment Variables."
        )
    if "localhost" in url or "127.0.0.1" in url:
        raise RuntimeError(
            "DATABASE_URL points to localhost on Vercel. Set your Neon production connection string."
        )


def ensure_migrations() -> bool:
    """Run `alembic upgrade head` once per process. Returns True if schema is ready."""
    global _migrations_applied, _last_error
    if os.getenv("SKIP_MIGRATIONS", "").lower() in ("1", "true", "yes"):
        return True
    if _migrations_applied:
        return True
    with _lock:
        if _migrations_applied:
            return True
        try:
            _validate_migration_env()
            upgrade_to_head()
            _migrations_applied = True
            _last_error = None
            logger.info("Database migrations applied")
            return True
        except Exception as exc:
            _last_error = str(exc)
            logger.error("Database migration failed: %s", exc, exc_info=True)
            return False


def last_migration_error() -> str | None:
    return _last_error


async def ensure_migrations_async() -> bool:
    return await asyncio.to_thread(ensure_migrations)
