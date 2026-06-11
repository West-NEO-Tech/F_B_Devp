"""Database URL helpers for async runtime vs sync Alembic migrations."""

from __future__ import annotations

import os
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse


def _strip_query(url: str) -> tuple[str, dict[str, list[str]]]:
    parsed = urlparse(url)
    query = parse_qs(parsed.query, keep_blank_values=True)
    base = urlunparse(parsed._replace(query=""))
    return base, query


def _with_query(url: str, params: dict[str, str]) -> str:
    parsed = urlparse(url)
    query = parse_qs(parsed.query, keep_blank_values=True)
    for key, value in params.items():
        query[key] = [value]
    return urlunparse(parsed._replace(query=urlencode(query, doseq=True)))


def normalize_async_url(url: str) -> str:
    """App runtime URL (asyncpg + Neon pooler)."""
    if url.startswith("postgresql+asyncpg://"):
        base, query = _strip_query(url)
        out = base
    elif url.startswith("postgresql://"):
        out, query = _strip_query(url.replace("postgresql://", "postgresql+asyncpg://", 1))
    elif url.startswith("postgres://"):
        out, query = _strip_query(url.replace("postgres://", "postgresql+asyncpg://", 1))
    else:
        return url

    # asyncpg uses `ssl=require`, not sslmode
    sslmode = (query.get("sslmode") or query.get("ssl") or [None])[0]
    if sslmode in ("require", "verify-full", "verify-ca", "true"):
        out = _with_query(out, {"ssl": "require"})
    return out


def normalize_sync_migration_url(url: str) -> str:
    """Alembic URL (psycopg sync). Prefer direct/unpooled Neon host for DDL."""
    if url.startswith("postgresql+psycopg://"):
        base, _ = _strip_query(url)
        out = base
    elif url.startswith("postgresql+asyncpg://"):
        out, _ = _strip_query(url.replace("postgresql+asyncpg://", "postgresql+psycopg://", 1))
    elif url.startswith("postgresql://"):
        out, _ = _strip_query(url.replace("postgresql://", "postgresql+psycopg://", 1))
    elif url.startswith("postgres://"):
        out, _ = _strip_query(url.replace("postgres://", "postgresql+psycopg://", 1))
    else:
        return url

    # psycopg accepts sslmode=require (Neon default)
    if "neon.tech" in out and "sslmode=" not in out:
        out = _with_query(out, {"sslmode": "require"})
    return out


def migration_database_url(app_database_url: str) -> str:
    """URL used only for Alembic. Prefer Neon unpooled/direct endpoint."""
    for key in (
        "DATABASE_URL_UNPOOLED",
        "POSTGRES_URL_NON_POOLING",
        "MIGRATE_DATABASE_URL",
    ):
        direct = os.getenv(key, "").strip()
        if direct:
            return normalize_sync_migration_url(direct)
    return normalize_sync_migration_url(app_database_url)
