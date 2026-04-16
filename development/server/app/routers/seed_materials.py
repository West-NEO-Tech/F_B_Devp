import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
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
    scenario = await scenario_service.get_scenario(session, scenario_id)
    # Load the project via relationship
    await session.refresh(scenario, ["project"])
    seed = await seed_builder_service.generate_seed_materials(
        session, scenario, scenario.project
    )
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
