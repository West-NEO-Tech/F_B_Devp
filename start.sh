#!/usr/bin/env bash
set -e

alembic upgrade head

exec uvicorn /Users/taigezhao
/Desktop/创业/BizSim/development/server/app/main.py --host 0.0.0.0 --port ${PORT:-8000}