import uuid
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project
from app.models.scenario import SimulationScenario
from app.schemas.scenario import ScenarioCreate, ScenarioUpdate


async def create_scenario(
    session: AsyncSession, project_id: uuid.UUID, data: ScenarioCreate
) -> SimulationScenario:
    # Validate project exists
    project = (
        await session.execute(
            select(Project).where(
                Project.id == project_id, Project.deleted_at.is_(None)
            )
        )
    ).scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    scenario = SimulationScenario(project_id=project_id, **data.model_dump())
    session.add(scenario)
    await session.flush()
    await session.refresh(scenario)
    return scenario


async def list_scenarios(
    session: AsyncSession,
    project_id: uuid.UUID,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[SimulationScenario], int]:
    query = select(SimulationScenario).where(
        SimulationScenario.project_id == project_id,
        SimulationScenario.deleted_at.is_(None),
    )

    count_query = select(func.count()).select_from(query.subquery())
    total = (await session.execute(count_query)).scalar_one()

    query = query.order_by(SimulationScenario.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await session.execute(query)
    return list(result.scalars().all()), total


async def get_scenario(
    session: AsyncSession, scenario_id: uuid.UUID
) -> SimulationScenario:
    query = select(SimulationScenario).where(
        SimulationScenario.id == scenario_id,
        SimulationScenario.deleted_at.is_(None),
    )
    result = await session.execute(query)
    scenario = result.scalar_one_or_none()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return scenario


async def update_scenario(
    session: AsyncSession, scenario_id: uuid.UUID, data: ScenarioUpdate
) -> SimulationScenario:
    scenario = await get_scenario(session, scenario_id)
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(scenario, key, value)
    scenario.updated_at = datetime.now(timezone.utc)
    await session.flush()
    await session.refresh(scenario)
    return scenario


async def soft_delete_scenario(
    session: AsyncSession, scenario_id: uuid.UUID
) -> None:
    scenario = await get_scenario(session, scenario_id)
    scenario.deleted_at = datetime.now(timezone.utc)
    await session.flush()
