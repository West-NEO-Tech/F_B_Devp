"""Vercel serverless entry — run migrations once when the function loads."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.main import app  # noqa: E402

# Best-effort migration on cold start (do not block import if it fails).
try:
    from app.migration_guard import ensure_migrations

    if not ensure_migrations():
        from app.migration_guard import last_migration_error

        print(f"WARN: migration on cold start failed: {last_migration_error()}", file=sys.stderr)
except Exception as exc:
    print(f"WARN: migration on cold start raised: {exc}", file=sys.stderr)

__all__ = ["app"]
