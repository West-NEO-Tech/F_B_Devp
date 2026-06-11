"""Vercel build hook: run migrations when DATABASE_URL is configured."""

from __future__ import annotations

import os
import sys


def main() -> int:
    if not os.getenv("DATABASE_URL", "").strip():
        print("SKIP: DATABASE_URL not set at build time — migrations will run on first API request")
        return 0
    try:
        from app.migrate import upgrade_to_head

        upgrade_to_head()
        print("OK: alembic upgrade head")
        return 0
    except Exception as exc:
        print(f"FAIL: migration during build: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
