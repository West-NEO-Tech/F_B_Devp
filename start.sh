#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -d "$ROOT_DIR/development/server" ]; then
  cd "$ROOT_DIR/development/server"
fi

export PYTHONPATH="$(pwd):${PYTHONPATH:-}"

if [ -f "alembic.ini" ]; then
  if ! python -m alembic -c alembic.ini upgrade head; then
    echo "WARNING: alembic migration failed, continuing startup" >&2
  fi
else
  echo "WARNING: alembic.ini not found, skipping migration" >&2
fi

exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"