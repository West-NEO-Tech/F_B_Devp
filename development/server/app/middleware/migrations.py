from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.migration_guard import ensure_migrations_async


class EnsureMigrationsMiddleware(BaseHTTPMiddleware):
    """Run pending migrations on first request (Vercel may skip FastAPI lifespan)."""

    async def dispatch(self, request: Request, call_next):
        if request.url.path.startswith("/api/"):
            if not await ensure_migrations_async():
                return JSONResponse(
                    status_code=503,
                    content={
                        "detail": (
                            "Database migration failed. "
                            "Run: cd development/server && uv run alembic upgrade head "
                            "against your production DATABASE_URL, then redeploy."
                        )
                    },
                )
        return await call_next(request)
