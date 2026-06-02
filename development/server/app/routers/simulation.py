import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.schemas.simulation import (
    SimulationAgentsResponse,
    SimulationStartRequest,
    SimulationStartResponse,
)
from app.services import simulation_service

router = APIRouter(tags=["simulation"])


@router.post(
    "/api/scenarios/{scenario_id}/simulation/start",
    response_model=SimulationStartResponse,
    status_code=201,
)
async def start_simulation(
    scenario_id: uuid.UUID,
    data: SimulationStartRequest,
    session: AsyncSession = Depends(get_session),
) -> SimulationStartResponse:
    result = await simulation_service.start_simulation(
        session,
        scenario_id,
        data.user_id,
        data.seed_material_id,
    )
    await session.commit()
    return result


@router.get(
    "/api/runs/{run_id}/agents",
    response_model=SimulationAgentsResponse,
)
async def get_simulation_agents(
    run_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
) -> SimulationAgentsResponse:
    result = await simulation_service.get_run_agents(session, run_id)
    await session.commit()
    return result
