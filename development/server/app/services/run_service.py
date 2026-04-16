import uuid
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.run import SimulationRun
from app.models.scenario import SimulationScenario
from app.schemas.run import RunStatusUpdate

# Valid state transitions: current_status -> set of allowed next statuses
_VALID_TRANSITIONS: dict[str, set[str]] = {
    "pending": {"running"},
    "running": {"completed", "failed"},
    "completed": set(),
    "failed": set(),
}


async def create_run(
    session: AsyncSession, scenario_id: uuid.UUID
) -> SimulationRun:
    # Validate scenario exists
    scenario = (
        await session.execute(
            select(SimulationScenario).where(
                SimulationScenario.id == scenario_id,
                SimulationScenario.deleted_at.is_(None),
            )
        )
    ).scalar_one_or_none()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")

    run = SimulationRun(scenario_id=scenario_id, status="pending")
    session.add(run)
    await session.flush()
    await session.refresh(run)
    return run


async def list_runs(
    session: AsyncSession,
    scenario_id: uuid.UUID,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[SimulationRun], int]:
    query = select(SimulationRun).where(
        SimulationRun.scenario_id == scenario_id,
        SimulationRun.deleted_at.is_(None),
    )

    count_query = select(func.count()).select_from(query.subquery())
    total = (await session.execute(count_query)).scalar_one()

    query = query.order_by(SimulationRun.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await session.execute(query)
    return list(result.scalars().all()), total


async def get_run(session: AsyncSession, run_id: uuid.UUID) -> SimulationRun:
    query = select(SimulationRun).where(
        SimulationRun.id == run_id, SimulationRun.deleted_at.is_(None)
    )
    result = await session.execute(query)
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run


async def update_run_status(
    session: AsyncSession, run_id: uuid.UUID, data: RunStatusUpdate
) -> SimulationRun:
    run = await get_run(session, run_id)
    target_status = data.status

    allowed = _VALID_TRANSITIONS.get(run.status, set())
    if target_status not in allowed:
        raise HTTPException(
            status_code=409,
            detail=f"Invalid status transition from {run.status} to {target_status}",
        )

    run.status = target_status
    if data.started_at is not None:
        run.started_at = data.started_at
    if data.completed_at is not None:
        run.completed_at = data.completed_at
    if data.result_summary is not None:
        run.result_summary = data.result_summary

    run.updated_at = datetime.now(timezone.utc)
    await session.flush()
    await session.refresh(run)
    return run
