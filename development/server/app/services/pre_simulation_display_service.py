import uuid
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.pre_simulation_display import PreSimulationDisplay
from app.schemas.pre_simulation_display import (
    AgentDistributionRead,
    AgentDistributionUpload,
    AgentKindItem,
    PreSimulationDisplayUpload,
)
from app.services import project_service

_AGENT_ROLE_LABELS: dict[str, str] = {
    "consumer": "Consumer",
    "enterprise_buyer": "Enterprise Buyer",
    "competitor": "Competitor",
    "investor": "Investor",
    "supplier": "Supplier",
    "regulator": "Regulator",
    "technical_expert": "Technical Expert",
    "mentor": "Mentor",
}


def _format_role_label(role: str) -> str:
    return _AGENT_ROLE_LABELS.get(role, role.replace("_", " ").title())


def _normalize_agents(raw: dict) -> dict[str, int]:
    agents: dict[str, int] = {}
    for key, value in raw.items():
        role = str(key)
        if isinstance(value, int):
            count = value
        elif isinstance(value, dict) and "count" in value:
            count = int(value["count"])
        else:
            continue
        if count > 0:
            agents[role] = count
    return agents


def _build_agent_distribution_read(
    project_id: uuid.UUID, agents: dict[str, int]
) -> AgentDistributionRead:
    agent_kinds = [
        AgentKindItem(key=role, label=_format_role_label(role), count=count)
        for role, count in agents.items()
    ]
    return AgentDistributionRead(
        project_id=project_id,
        agents=agents,
        agent_kinds=agent_kinds,
        total=sum(agents.values()),
    )


async def _get_or_create_row(
    session: AsyncSession, project_id: uuid.UUID
) -> PreSimulationDisplay:
    await project_service.get_project(session, project_id)
    result = await session.execute(
        select(PreSimulationDisplay).where(
            PreSimulationDisplay.project_id == project_id,
            PreSimulationDisplay.deleted_at.is_(None),
        )
    )
    row = result.scalar_one_or_none()
    if row is None:
        row = PreSimulationDisplay(project_id=project_id, content={})
        session.add(row)
        await session.flush()
    return row


async def upsert_pre_simulation_display(
    session: AsyncSession,
    project_id: uuid.UUID,
    data: PreSimulationDisplayUpload,
) -> PreSimulationDisplay:
    row = await _get_or_create_row(session, project_id)
    row.content = data.content
    row.updated_at = datetime.now(timezone.utc)
    await session.flush()
    await session.refresh(row)
    return row


async def upsert_agent_distribution(
    session: AsyncSession,
    project_id: uuid.UUID,
    data: AgentDistributionUpload,
) -> AgentDistributionRead:
    row = await _get_or_create_row(session, project_id)
    agents = _normalize_agents(data.agents)
    row.agent_distribution = agents
    row.updated_at = datetime.now(timezone.utc)
    await session.flush()
    return _build_agent_distribution_read(project_id, agents)


async def get_agent_distribution(
    session: AsyncSession, project_id: uuid.UUID
) -> AgentDistributionRead:
    await project_service.get_project(session, project_id)
    result = await session.execute(
        select(PreSimulationDisplay).where(
            PreSimulationDisplay.project_id == project_id,
            PreSimulationDisplay.deleted_at.is_(None),
        )
    )
    row = result.scalar_one_or_none()
    if row is None or not row.agent_distribution:
        raise HTTPException(
            status_code=404, detail="Agent distribution not uploaded yet"
        )
    agents = _normalize_agents(row.agent_distribution)
    return _build_agent_distribution_read(project_id, agents)


async def get_pre_simulation_display(
    session: AsyncSession, project_id: uuid.UUID
) -> PreSimulationDisplay | None:
    await project_service.get_project(session, project_id)
    result = await session.execute(
        select(PreSimulationDisplay).where(
            PreSimulationDisplay.project_id == project_id,
            PreSimulationDisplay.deleted_at.is_(None),
        )
    )
    return result.scalar_one_or_none()
