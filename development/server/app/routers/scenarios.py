import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.schemas.common import PaginatedResponse
from app.schemas.scenario import ScenarioCreate, ScenarioRead, ScenarioUpdate
from app.services import scenario_service

router = APIRouter(tags=["scenarios"])


@router.post(
    "/api/projects/{project_id}/scenarios",
    response_model=ScenarioRead,
    status_code=201,
)
async def create_scenario(
    project_id: uuid.UUID,
    data: ScenarioCreate,
    session: AsyncSession = Depends(get_session),
) -> ScenarioRead:
    scenario = await scenario_service.create_scenario(session, project_id, data)
    await session.commit()
    return ScenarioRead.model_validate(scenario, from_attributes=True)


@router.get(
    "/api/projects/{project_id}/scenarios",
    response_model=PaginatedResponse[ScenarioRead],
)
async def list_scenarios(
    project_id: uuid.UUID,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100, alias="pageSize"),
    session: AsyncSession = Depends(get_session),
) -> PaginatedResponse[ScenarioRead]:
    items, total = await scenario_service.list_scenarios(session, project_id, page, page_size)
    return PaginatedResponse[ScenarioRead](
        items=[ScenarioRead.model_validate(i, from_attributes=True) for i in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/api/scenarios/{scenario_id}", response_model=ScenarioRead)
async def get_scenario(
    scenario_id: uuid.UUID, session: AsyncSession = Depends(get_session)
) -> ScenarioRead:
    scenario = await scenario_service.get_scenario(session, scenario_id)
    return ScenarioRead.model_validate(scenario, from_attributes=True)


@router.patch("/api/scenarios/{scenario_id}", response_model=ScenarioRead)
async def update_scenario(
    scenario_id: uuid.UUID,
    data: ScenarioUpdate,
    session: AsyncSession = Depends(get_session),
) -> ScenarioRead:
    scenario = await scenario_service.update_scenario(session, scenario_id, data)
    await session.commit()
    return ScenarioRead.model_validate(scenario, from_attributes=True)


@router.delete("/api/scenarios/{scenario_id}", status_code=204)
async def delete_scenario(
    scenario_id: uuid.UUID, session: AsyncSession = Depends(get_session)
) -> None:
    await scenario_service.soft_delete_scenario(session, scenario_id)
    await session.commit()
