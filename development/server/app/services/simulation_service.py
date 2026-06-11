"""Start simulation runs and expose run input for external simulation clients."""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.run import SimulationRun
from app.models.scenario import SimulationScenario
from app.models.seed_material import SeedMaterial
from app.schemas.simulation import (
    MarketInfoQAItem,
    SimulationAgentsResponse,
    SimulationStartResponse,
)
from app.services.market_qa_parse import base_description, parse_additional_information

DEPTH_MINUTES: dict[str, int] = {
    "quick": 2,
    "standard": 6,
    "deep": 12,
    "custom": 6,
}


def _expected_minutes(scenario: SimulationScenario) -> int:
    depth = getattr(scenario, "agent_depth", "") or "standard"
    if depth == "custom":
        count = getattr(scenario, "agent_count", 81) or 81
        return max(2, min(60, count // 15 + 2))
    return DEPTH_MINUTES.get(depth, 6)


def _as_json_list(value: object | None) -> list:
    """Ensure seed JSON fields are always serialized as JSON arrays."""
    if value is None:
        return []
    if isinstance(value, list):
        return value
    if isinstance(value, dict):
        return [value]
    return []


def _persona_name_strings(personas: object | None) -> list[str]:
    names: list[str] = []
    for item in _as_json_list(personas):
        if isinstance(item, str):
            text = item.strip()
            if text:
                names.append(text)
        elif isinstance(item, dict):
            name = item.get("name")
            if name is not None:
                text = str(name).strip()
                if text:
                    names.append(text)
    return names


def _topic_title_strings(topics: object | None) -> list[str]:
    titles: list[str] = []
    for item in _as_json_list(topics):
        if isinstance(item, str):
            text = item.strip()
            if text:
                titles.append(text)
        elif isinstance(item, dict):
            topic = item.get("topic")
            if topic is not None:
                text = str(topic).strip()
                if text:
                    titles.append(text)
    return titles


async def start_simulation(
    session: AsyncSession,
    scenario_id: uuid.UUID,
    user_id: uuid.UUID,
    seed_material_id: uuid.UUID,
) -> SimulationStartResponse:
    """Create a run for the external simulation client."""
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

    seed = await _get_completed_seed(session, seed_material_id, scenario_id)

    expected_minutes = _expected_minutes(scenario)
    expected_done_at = datetime.now(timezone.utc) + timedelta(minutes=expected_minutes)

    run = SimulationRun(
        scenario_id=scenario_id,
        status="running",
        started_at=datetime.now(timezone.utc),
        result_summary={
            "user_id": str(user_id),
            "seed_material_id": str(seed_material_id),
            "seed_version": seed.version,
            "expected_minutes": expected_minutes,
            "expected_done_at": expected_done_at.isoformat(),
            "simulation_status": "running",
        },
    )
    session.add(run)
    await session.flush()
    await session.refresh(run)

    return SimulationStartResponse(
        run_id=run.id,
        scenario_id=scenario_id,
        status=run.status,
        agents_status="ready",
    )


async def get_run_agents(
    session: AsyncSession, run_id: uuid.UUID
) -> SimulationAgentsResponse:
    """Return project + sim config input for the simulation client."""
    run = await _get_run(session, run_id)
    summary = dict(run.result_summary or {})
    user_id = uuid.UUID(summary["user_id"])
    seed_material_id = uuid.UUID(summary["seed_material_id"])

    seed = await _get_completed_seed(session, seed_material_id, run.scenario_id)
    scenario = await _get_scenario_with_project(session, run.scenario_id)
    project = scenario.project
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    full_description = project.description or ""
    qa_raw = parse_additional_information(full_description)

    agent_depth = scenario.agent_depth
    if agent_depth not in ("quick", "standard", "deep", "custom"):
        agent_depth = "standard"

    return SimulationAgentsResponse(
        user_id=user_id,
        scenario_id=run.scenario_id,
        seed_material_id=seed_material_id,
        status="ready",
        description=base_description(full_description),
        product_type=project.product_type,
        consumer_personas=_persona_name_strings(seed.consumer_personas),
        discussion_topics=_topic_title_strings(seed.discussion_topics),
        additional_information=[MarketInfoQAItem.model_validate(q) for q in qa_raw],
        sim_config_type=agent_depth,  # type: ignore[arg-type]
        simulation_query=seed.simulation_query,
    )


async def _get_run(session: AsyncSession, run_id: uuid.UUID) -> SimulationRun:
    result = await session.execute(
        select(SimulationRun).where(
            SimulationRun.id == run_id,
            SimulationRun.deleted_at.is_(None),
        )
    )
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="Simulation run not found")
    return run


async def _get_scenario_with_project(
    session: AsyncSession, scenario_id: uuid.UUID
) -> SimulationScenario:
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
    return scenario


async def _get_completed_seed(
    session: AsyncSession, seed_material_id: uuid.UUID, scenario_id: uuid.UUID
) -> SeedMaterial:
    result = await session.execute(
        select(SeedMaterial).where(
            SeedMaterial.id == seed_material_id,
            SeedMaterial.scenario_id == scenario_id,
            SeedMaterial.deleted_at.is_(None),
        )
    )
    seed = result.scalar_one_or_none()
    if not seed:
        raise HTTPException(status_code=404, detail="Seed material not found")
    if seed.status != "completed":
        raise HTTPException(
            status_code=409,
            detail="Pre-simulation display must be completed before starting simulation",
        )
    return seed
