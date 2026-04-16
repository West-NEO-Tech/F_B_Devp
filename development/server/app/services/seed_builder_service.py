import json
import logging
import uuid

import openai
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.llm import (
    SEED_BUILDER_SYSTEM_PROMPT,
    build_seed_builder_prompt,
    get_llm_client,
)
from app.models.project import Project
from app.models.scenario import SimulationScenario
from app.models.seed_material import SeedMaterial
from app.schemas.seed_material import SeedMaterialUpdate

logger = logging.getLogger(__name__)


async def _next_version(session: AsyncSession, scenario_id: uuid.UUID) -> int:
    result = await session.execute(
        select(func.coalesce(func.max(SeedMaterial.version), 0)).where(
            SeedMaterial.scenario_id == scenario_id,
            SeedMaterial.deleted_at.is_(None),
        )
    )
    return (result.scalar() or 0) + 1


async def generate_seed_materials(
    session: AsyncSession,
    scenario: SimulationScenario,
    project: Project,
) -> SeedMaterial:
    """Generate seed materials via LLM for the given scenario."""
    version = await _next_version(session, scenario.id)

    seed = SeedMaterial(
        scenario_id=scenario.id,
        version=version,
        status="generating",
    )
    session.add(seed)
    await session.flush()

    # Build prompt
    agent_distribution = (scenario.market_config or {}).get("agent_distribution")
    prompt = build_seed_builder_prompt(
        project_name=project.name,
        description=project.description,
        product_type=project.product_type,
        target_market=project.target_market,
        target_audience=project.target_audience,
        pricing_model=project.pricing_model,
        competitors=project.competitors if isinstance(project.competitors, list) else None,
        agent_depth=scenario.agent_depth,
        agent_distribution=agent_distribution,
    )

    try:
        client = get_llm_client()
        response = await client.chat.completions.create(
            model=settings.llm_model,
            messages=[
                {"role": "system", "content": SEED_BUILDER_SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            max_tokens=settings.llm_max_tokens,
            temperature=settings.llm_temperature,
        )
    except openai.APITimeoutError as exc:
        logger.error("Seed builder LLM timed out: %s", exc)
        seed.status = "failed"
        seed.error_message = "LLM request timed out"
        return seed
    except (openai.APIConnectionError, openai.APIStatusError) as exc:
        logger.error("Seed builder LLM error: %s", exc)
        seed.status = "failed"
        seed.error_message = f"LLM error: {exc}"
        return seed

    content = response.choices[0].message.content
    if not content:
        seed.status = "failed"
        seed.error_message = "LLM returned empty response"
        return seed

    try:
        raw = json.loads(content)
    except json.JSONDecodeError:
        logger.error("Seed builder: invalid JSON: %s", content[:200])
        seed.status = "failed"
        seed.error_message = "LLM returned invalid JSON"
        seed.raw_response = {"raw": content[:2000]}
        return seed

    seed.status = "completed"
    seed.raw_response = raw
    seed.market_context = raw.get("market_context")
    seed.competitors = raw.get("competitors")
    seed.consumer_personas = raw.get("consumer_personas")
    seed.discussion_topics = raw.get("discussion_topics")
    return seed


async def get_seed_materials(
    session: AsyncSession, scenario_id: uuid.UUID
) -> list[SeedMaterial]:
    """Get all seed materials for a scenario, newest first."""
    result = await session.execute(
        select(SeedMaterial)
        .where(
            SeedMaterial.scenario_id == scenario_id,
            SeedMaterial.deleted_at.is_(None),
        )
        .order_by(SeedMaterial.version.desc())
    )
    return list(result.scalars().all())


async def get_seed_material(
    session: AsyncSession, seed_material_id: uuid.UUID
) -> SeedMaterial:
    """Get a single seed material by ID. Raises 404 if not found."""
    from fastapi import HTTPException

    result = await session.execute(
        select(SeedMaterial).where(
            SeedMaterial.id == seed_material_id,
            SeedMaterial.deleted_at.is_(None),
        )
    )
    seed = result.scalar_one_or_none()
    if seed is None:
        raise HTTPException(status_code=404, detail="Seed material not found")
    return seed


async def update_seed_material(
    session: AsyncSession,
    seed_material_id: uuid.UUID,
    data: SeedMaterialUpdate,
) -> SeedMaterial:
    """Update editable fields (competitors, discussion_topics) of a seed material."""
    seed = await get_seed_material(session, seed_material_id)
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(seed, key, value)
    return seed
