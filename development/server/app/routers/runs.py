import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.schemas.common import PaginatedResponse
from app.schemas.run import RunCreate, RunRead, RunStatusUpdate
from app.services import run_service

router = APIRouter(tags=["runs"])


@router.post(
    "/api/scenarios/{scenario_id}/runs",
    response_model=RunRead,
    status_code=201,
)
async def create_run(
    scenario_id: uuid.UUID,
    data: RunCreate,
    session: AsyncSession = Depends(get_session),
) -> RunRead:
    run = await run_service.create_run(session, scenario_id)
    await session.commit()
    return RunRead.model_validate(run, from_attributes=True)


@router.get(
    "/api/scenarios/{scenario_id}/runs",
    response_model=PaginatedResponse[RunRead],
)
async def list_runs(
    scenario_id: uuid.UUID,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100, alias="pageSize"),
    session: AsyncSession = Depends(get_session),
) -> PaginatedResponse[RunRead]:
    items, total = await run_service.list_runs(session, scenario_id, page, page_size)
    return PaginatedResponse[RunRead](
        items=[RunRead.model_validate(i, from_attributes=True) for i in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/api/runs/{run_id}", response_model=RunRead)
async def get_run(
    run_id: uuid.UUID, session: AsyncSession = Depends(get_session)
) -> RunRead:
    run = await run_service.get_run(session, run_id)
    await session.commit()
    return RunRead.model_validate(run, from_attributes=True)


@router.patch("/api/runs/{run_id}", response_model=RunRead)
async def update_run_status(
    run_id: uuid.UUID,
    data: RunStatusUpdate,
    session: AsyncSession = Depends(get_session),
) -> RunRead:
    run = await run_service.update_run_status(session, run_id, data)
    await session.commit()
    return RunRead.model_validate(run, from_attributes=True)
