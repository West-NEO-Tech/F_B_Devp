import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pythonjsonlogger import jsonlogger
from sqlalchemy.exc import IntegrityError, OperationalError, ProgrammingError

from app.config import settings
from app.database import async_session_factory, engine
from app.llm import LLMServiceError
from app.middleware.logging import RequestLoggingMiddleware
from app.migrate import upgrade_to_head
from app.routers import (
    agent_templates,
    env_demo,
    health,
    market_qa,
    pre_simulation_display,
    projects,
    runs,
    scenarios,
    seed_materials,
    simulation,
)


def _setup_logging() -> None:
    handler = logging.StreamHandler()
    formatter = jsonlogger.JsonFormatter(
        fmt="%(asctime)s %(name)s %(levelname)s %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S",
    )
    handler.setFormatter(formatter)
    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(settings.log_level.upper())


@asynccontextmanager
async def lifespan(app: FastAPI):
    _setup_logging()
    logger = logging.getLogger("bizsim")
    logger.info("Starting BizSim API server")

    # Seed data — tolerate missing database so the server can still start.
    # Skipped automatically in serverless (Vercel) — set SKIP_SEED=true to run alembic + seed manually.
    if settings.skip_seed:
        logger.info("Seed data skipped — SKIP_SEED=true")
    else:
        if not settings.is_serverless:
            try:
                await asyncio.to_thread(upgrade_to_head)
            except Exception as exc:
                logger.warning("Database migration skipped: %s", exc)
        try:
            async with async_session_factory() as session:
                from seed.agent_templates import seed_agent_templates

                await seed_agent_templates(session)
                await session.commit()
        except Exception as exc:
            logger.warning("Seed data skipped — database not available: %s", exc)

    yield
    # Vercel reuses warm instances; disposing the engine after each request breaks the next call.
    if not settings.is_serverless:
        await engine.dispose()
        logging.getLogger("bizsim").info("BizSim API server shut down")


def create_app() -> FastAPI:
    application = FastAPI(
        title="BizSim API",
        version=settings.app_version,
        lifespan=lifespan,
        redirect_slashes=False,
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    application.add_middleware(RequestLoggingMiddleware)

    @application.get("/", include_in_schema=False)
    async def root() -> dict[str, str]:
        return {"status": "ok"}

    # Register routers
    application.include_router(health.router)
    application.include_router(env_demo.router)
    application.include_router(projects.router)
    application.include_router(pre_simulation_display.router)
    application.include_router(scenarios.router)
    application.include_router(runs.router)
    application.include_router(agent_templates.router)
    application.include_router(seed_materials.router)
    application.include_router(simulation.router)
    application.include_router(market_qa.router)

    @application.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        return JSONResponse(status_code=422, content={"detail": exc.errors()})

    @application.exception_handler(IntegrityError)
    async def integrity_exception_handler(
        request: Request, exc: IntegrityError
    ) -> JSONResponse:
        logging.getLogger("bizsim").error("Database integrity error: %s", str(exc))
        detail = "Database constraint violation."
        msg = str(exc.orig) if exc.orig else str(exc)
        if "agent_depth" in msg:
            detail = (
                "Invalid simulation depth. Run database migrations: "
                "cd development/server && uv run alembic upgrade head"
            )
        return JSONResponse(status_code=409, content={"detail": detail})

    @application.exception_handler(ProgrammingError)
    async def schema_exception_handler(
        request: Request, exc: ProgrammingError
    ) -> JSONResponse:
        logging.getLogger("bizsim").error("Database schema error: %s", str(exc))
        return JSONResponse(
            status_code=503,
            content={
                "detail": (
                    "Database schema is out of date. "
                    "Run: cd development/server && uv run alembic upgrade head"
                )
            },
        )

    @application.exception_handler(OperationalError)
    async def db_exception_handler(
        request: Request, exc: OperationalError
    ) -> JSONResponse:
        logging.getLogger("bizsim").error("Database error: %s", str(exc))
        return JSONResponse(
            status_code=503,
            content={
                "detail": "Service temporarily unavailable. Please retry later."
            },
        )

    @application.exception_handler(LLMServiceError)
    async def llm_exception_handler(
        request: Request, exc: LLMServiceError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
        )

    @application.exception_handler(Exception)
    async def unhandled_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        logging.getLogger("bizsim").exception(
            "Unhandled error on %s %s", request.method, request.url.path
        )
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
        )

    return application


app = create_app()
