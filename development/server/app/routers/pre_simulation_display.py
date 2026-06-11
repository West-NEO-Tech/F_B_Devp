import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.schemas.pre_simulation_display import (
    AgentDistributionRead,
    AgentDistributionUpload,
    PreSimulationDisplayRead,
    PreSimulationDisplayUpload,
)
from app.services import pre_simulation_display_service

router = APIRouter(prefix="/api/projects", tags=["pre-simulation-display"])


@router.post(
    "/{project_id}/pre-simulation-display",
    response_model=PreSimulationDisplayRead,
)
async def upload_pre_simulation_display(
    project_id: uuid.UUID,
    data: PreSimulationDisplayUpload,
    session: AsyncSession = Depends(get_session),
) -> PreSimulationDisplayRead:
    """Receive display payload from the external simulation runner."""
    row = await pre_simulation_display_service.upsert_pre_simulation_display(
        session, project_id, data
    )
    await session.commit()
    return PreSimulationDisplayRead.model_validate(row, from_attributes=True)


@router.post(
    "/{project_id}/pre-simulation-display/agent-distribution",
    response_model=AgentDistributionRead,
)
async def upload_agent_distribution(
    project_id: uuid.UUID,
    data: AgentDistributionUpload,
    session: AsyncSession = Depends(get_session),
) -> AgentDistributionRead:
    """Receive agent kinds for the Pre-Simulation Display distribution module."""
    result = await pre_simulation_display_service.upsert_agent_distribution(
        session, project_id, data
    )
    await session.commit()
    return result


@router.get(
    "/{project_id}/pre-simulation-display/agent-distribution",
    response_model=AgentDistributionRead,
)
async def get_agent_distribution(
    project_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
) -> AgentDistributionRead:
    return await pre_simulation_display_service.get_agent_distribution(
        session, project_id
    )


@router.get(
    "/{project_id}/pre-simulation-display",
    response_model=PreSimulationDisplayRead,
)
async def get_pre_simulation_display(
    project_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
) -> PreSimulationDisplayRead:
    row = await pre_simulation_display_service.get_pre_simulation_display(
        session, project_id
    )
    if row is None:
        raise HTTPException(
            status_code=404, detail="Pre-simulation display not uploaded yet"
        )
    return PreSimulationDisplayRead.model_validate(row, from_attributes=True)
