import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_session
from app.models.project import Project
from app.models.scenario import SimulationScenario
from app.schemas.seed_material import SeedMaterialRead, SeedMaterialUpdate
from app.services import scenario_service, seed_builder_service

router = APIRouter(tags=["seed-materials"])


@router.post(
    "/api/scenarios/{scenario_id}/seed-materials",
    response_model=SeedMaterialRead,
    status_code=201,
)
async def generate_seed_materials(
    scenario_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
) -> SeedMaterialRead:
    result = await session.execute(
        select(SimulationScenario)
        .options(selectinload(SimulationScenario.project))
        .where(
            SimulationScenario.id == scenario_id,
            SimulationScenario.deleted_at.is_(None),
        )
    )
    scenario = result.scalar_one_or_none()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    project: Project = scenario.project
    seed = await seed_builder_service.generate_seed_materials(session, scenario, project)
    await session.commit()
    return SeedMaterialRead.model_validate(seed, from_attributes=True)


@router.get(
    "/api/scenarios/{scenario_id}/seed-materials",
    response_model=list[SeedMaterialRead],
)
async def list_seed_materials(
    scenario_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
) -> list[SeedMaterialRead]:
    # Verify scenario exists
    await scenario_service.get_scenario(session, scenario_id)
    items = await seed_builder_service.get_seed_materials(session, scenario_id)
    return [SeedMaterialRead.model_validate(i, from_attributes=True) for i in items]


@router.get(
    "/api/seed-materials/{seed_material_id}",
    response_model=SeedMaterialRead,
)
async def get_seed_material(
    seed_material_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
) -> SeedMaterialRead:
    seed = await seed_builder_service.get_seed_material(session, seed_material_id)
    return SeedMaterialRead.model_validate(seed, from_attributes=True)


@router.patch(
    "/api/seed-materials/{seed_material_id}",
    response_model=SeedMaterialRead,
)
async def update_seed_material(
    seed_material_id: uuid.UUID,
    data: SeedMaterialUpdate,
    session: AsyncSession = Depends(get_session),
) -> SeedMaterialRead:
    seed = await seed_builder_service.update_seed_material(
        session, seed_material_id, data
    )
    await session.commit()
    return SeedMaterialRead.model_validate(seed, from_attributes=True)
