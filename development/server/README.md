# BizSim Server

Multi-Agent Business Validation Simulation Platform — Backend API

## Prerequisites

- Docker Desktop ≥ 24.0 (for containerized development)
- Python 3.13+ and [uv](https://docs.astral.sh/uv/) (for local development)

## Quick Start (Docker)

```bash
cd business-validation-demo/development/server
docker compose up
```

Services:
- **API**: http://localhost:8100 — FastAPI with auto-reload
- **API Docs**: http://localhost:8100/docs — Interactive Swagger UI
- **PostgreSQL**: localhost:5434 (mapped from container 5432)
- **Redis**: localhost:6379

## Local Development

```bash
cd business-validation-demo/development/server

# Install dependencies
uv sync --dev --no-install-project

# Copy environment config
cp .env.example .env

# Run tests
uv run python -m pytest tests/ -v

# Lint
uv run python -m ruff check app/ tests/ seed/

# Start API server (requires running PostgreSQL + Redis)
uv run uvicorn app.main:app --reload --port 8100
```

## LLM Setup (Local Development)

AI Complete uses a real LLM via the OpenAI-compatible API. For local development, use LiteLLM to proxy GitHub Copilot (free):

```bash
# Terminal 1: Start LiteLLM proxy (isolated venv, fast startup)
cd business-validation-demo/development/server
./scripts/start-litellm.sh

# Terminal 2: Start API server (with LLM env vars in .env)
cd business-validation-demo/development/server
uv run uvicorn app.main:app --reload --port 8100
```

First run creates an isolated venv at `~/.litellm-env/` (~30s), then shows an OAuth device code — open the URL in your browser and authorize once. Credentials are cached locally after that.

The `.env.example` file has the default local dev configuration. Copy it to `.env`:

```bash
cp .env.example .env
```

Without LLM configuration (`LLM_BASE_URL` not set), AI Complete returns HTTP 503.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql+asyncpg://bizsim:bizsim_dev@localhost:5434/bizsim` | Async PostgreSQL connection (Docker Compose port) |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis connection |
| `LOG_LEVEL` | `INFO` | Logging level |
| `APP_VERSION` | `0.1.0` | Reported in health check |
| `CORS_ORIGINS` | `["http://localhost:5173"]` | Allowed CORS origins |
| `LLM_BASE_URL` | `None` | LLM API base URL. `None` = AI Complete returns 503 |
| `LLM_API_KEY` | `sk-no-key` | LLM API key |
| `LLM_MODEL` | `gpt-4o-mini` | Model name for chat completions |
| `LLM_TIMEOUT` | `60` | LLM request timeout in seconds |
| `LLM_MAX_TOKENS` | `2000` | Max tokens for LLM response |
| `LLM_TEMPERATURE` | `0.7` | LLM sampling temperature |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/projects` | Create project |
| GET | `/api/projects` | List projects (paginated, status filter) |
| GET | `/api/projects/{id}` | Get project |
| PATCH | `/api/projects/{id}` | Update project |
| DELETE | `/api/projects/{id}` | Soft-delete project |
| POST | `/api/projects/{id}/ai-complete` | AI-assisted field completion (LLM) |
| POST | `/api/projects/{id}/scenarios` | Create scenario |
| GET | `/api/projects/{id}/scenarios` | List scenarios |
| GET | `/api/scenarios/{id}` | Get scenario |
| PATCH | `/api/scenarios/{id}` | Update scenario |
| DELETE | `/api/scenarios/{id}` | Soft-delete scenario |
| POST | `/api/scenarios/{id}/runs` | Create simulation run |
| GET | `/api/scenarios/{id}/runs` | List runs |
| GET | `/api/runs/{id}` | Get run |
| PATCH | `/api/runs/{id}` | Update run status |
| POST | `/api/agent-templates` | Create agent template |
| GET | `/api/agent-templates` | List templates (role filter) |
| GET | `/api/agent-templates/{id}` | Get template |
| PATCH | `/api/agent-templates/{id}` | Update template |
| DELETE | `/api/agent-templates/{id}` | Soft-delete template |

## Database Migrations

```bash
# Generate new migration
uv run alembic revision --autogenerate -m "description"

# Apply migrations
uv run alembic upgrade head

# Rollback one step
uv run alembic downgrade -1
```

## Project Structure

```
server/
├── app/
│   ├── main.py              # FastAPI app factory
│   ├── config.py            # Pydantic Settings
│   ├── database.py          # Async SQLAlchemy engine
│   ├── models/              # ORM models
│   ├── schemas/             # Pydantic request/response schemas
│   ├── routers/             # API route handlers
│   ├── services/            # Business logic
│   ├── llm/                 # LLM client (AsyncOpenAI + prompts)
│   └── middleware/          # Request logging
├── alembic/                 # Database migrations
├── seed/                    # Seed data (8 agent templates)
├── tests/                   # pytest test suite
├── Dockerfile
├── docker-compose.yml
└── pyproject.toml
```
