from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.migration_guard import ensure_migrations_async, last_migration_error


class EnsureMigrationsMiddleware(BaseHTTPMiddleware):
    """Run pending migrations on first request (Vercel may skip FastAPI lifespan)."""

    async def dispatch(self, request: Request, call_next):
        if request.url.path.startswith("/api/") and request.url.path != "/api/health":
            if not await ensure_migrations_async():
                err = last_migration_error() or "unknown error"
                return JSONResponse(
                    status_code=503,
                    content={
                        "detail": (
                            "Database migration failed. "
                            f"{err} "
                            "Tip: set DATABASE_URL_UNPOOLED (Neon direct URL) for migrations, "
                            "or run locally: "
                            "cd development/server && DATABASE_URL=<prod> uv run alembic upgrade head"
                        )
                    },
                )
        return await call_next(request)
