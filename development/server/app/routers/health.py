import logging

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_session
from app.schemas.health import HealthResponse

router = APIRouter(prefix="/api", tags=["health"])
logger = logging.getLogger("bizsim.health")


@router.get("/health", response_model=HealthResponse)
async def health_check(session: AsyncSession = Depends(get_session)) -> HealthResponse:
    db_status = "connected"
    try:
        await session.execute(text("SELECT 1"))
    except Exception as exc:
        logger.warning("Health check: database unavailable — %s", str(exc))
        db_status = "disconnected"

    status = "healthy" if db_status == "connected" else "degraded"
    return HealthResponse(status=status, version=settings.app_version, database=db_status)
