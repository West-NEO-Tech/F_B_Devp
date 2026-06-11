"""Ensure Alembic migrations run once per serverless instance."""

from __future__ import annotations

import asyncio
import logging
import threading

from app.migrate import upgrade_to_head

logger = logging.getLogger("bizsim.migrate")

_lock = threading.Lock()
_migrations_applied = False


def ensure_migrations() -> bool:
    """Run `alembic upgrade head` once per process. Returns True if schema is ready."""
    global _migrations_applied
    if _migrations_applied:
        return True
    with _lock:
        if _migrations_applied:
            return True
        try:
            upgrade_to_head()
            _migrations_applied = True
            logger.info("Database migrations applied")
            return True
        except Exception as exc:
            logger.error("Database migration failed: %s", exc, exc_info=True)
            return False


async def ensure_migrations_async() -> bool:
    return await asyncio.to_thread(ensure_migrations)
