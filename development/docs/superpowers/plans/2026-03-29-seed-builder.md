# 005 Seed Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement seed material generation — users configure simulation depth/agents, trigger LLM-powered market analysis, and view/edit results in the project detail page.

**Architecture:** Backend adds a `SeedMaterial` model + `seed_builder_service` with LLM generation. Frontend restructures sidebar to 4 items, rebuilds project detail page as a vertical card journey with floating TOC, and adds simulation config + seed materials display components.

**Tech Stack:** FastAPI, SQLAlchemy, Alembic, AsyncOpenAI, Pydantic | React 19, TypeScript, Tailwind v4, shadcn/ui, React Query, wouter

---

## File Structure

### Backend — New Files

| File | Responsibility |
|------|---------------|
| `server/app/models/seed_material.py` | SeedMaterial ORM model |
| `server/app/schemas/seed_material.py` | Pydantic read/update schemas |
| `server/app/services/seed_builder_service.py` | LLM prompt + generation logic |
| `server/app/routers/seed_materials.py` | 4 API endpoints |
| `server/app/llm/prompts.py` | Add `build_seed_builder_prompt` (extend existing file) |
| `server/app/llm/__init__.py` | Re-export new prompt function (extend existing file) |
| `server/tests/test_seed_materials.py` | Backend tests |

### Backend — Modified Files

| File | Change |
|------|--------|
| `server/app/models/__init__.py` | Register SeedMaterial |
| `server/app/models/scenario.py` | Add `seed_materials` relationship |
| `server/app/main.py` | Include seed_materials router |

### Frontend — New Files

| File | Responsibility |
|------|---------------|
| `src/components/project/project-step-nav.tsx` | Floating TOC component |
| `src/components/project/simulation-config-card.tsx` | Depth selector + agent distribution |
| `src/components/project/seed-materials-card.tsx` | Seed material display + edit |
| `src/components/project/locked-step-card.tsx` | Locked step placeholder |
| `src/components/project/run-history-section.tsx` | Bottom run history |
| `src/hooks/use-scenario.ts` | Scenario fetch/create/update hooks |
| `src/hooks/use-seed-materials.ts` | Seed material hooks |
| `src/lib/agent-templates.ts` | Depth → agent distribution constants |

### Frontend — Modified Files

| File | Change |
|------|--------|
| `src/components/app-sidebar.tsx` | Reduce to 4 navigation items |
| `src/App.tsx` | Remove unused routes and lazy imports |
| `src/pages/project-detail.tsx` | Full rebuild as card journey |
| `src/components/project/project-info-card.tsx` | Add collapsed/expanded mode |

---

## Task 1: Backend — SeedMaterial Model + Migration

**Files:**
- Create: `server/app/models/seed_material.py`
- Modify: `server/app/models/__init__.py`
- Modify: `server/app/models/scenario.py` (add relationship)

- [ ] **Step 1: Create the SeedMaterial model**

Create `server/app/models/seed_material.py`:

```python
import uuid

from sqlalchemy import JSON, CheckConstraint, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, BaseMixin


class SeedMaterial(BaseMixin, Base):
    __tablename__ = "seed_materials"
    __table_args__ = (
        CheckConstraint(
            "status IN ('generating', 'completed', 'failed')",
            name="ck_seed_material_status",
        ),
        Index(
            "ix_seed_material_scenario_id",
            "scenario_id",
            postgresql_where="deleted_at IS NULL",
        ),
    )

    scenario_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("simulation_scenarios.id"), nullable=False
    )
    version: Mapped[int] = mapped_column(Integer, nullable=False, server_default="1")
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default="'generating'"
    )
    market_context: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    competitors: Mapped[list | None] = mapped_column(JSON, nullable=True)
    consumer_personas: Mapped[list | None] = mapped_column(JSON, nullable=True)
    discussion_topics: Mapped[list | None] = mapped_column(JSON, nullable=True)
    raw_response: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    scenario = relationship("SimulationScenario", back_populates="seed_materials")
```

- [ ] **Step 2: Add relationship to SimulationScenario**

In `server/app/models/scenario.py`, add after the `runs` relationship:

```python
    seed_materials = relationship(
        "SeedMaterial", back_populates="scenario", cascade="all, delete-orphan"
    )
```

- [ ] **Step 3: Register in models __init__**

In `server/app/models/__init__.py`, add:

```python
from app.models.seed_material import SeedMaterial
```

And add `"SeedMaterial"` to the `__all__` list.

- [ ] **Step 4: Generate Alembic migration**

```bash
cd server
uv run alembic revision --autogenerate -m "add seed_materials table"
```

- [ ] **Step 5: Apply migration**

```bash
uv run alembic upgrade head
```

- [ ] **Step 6: Commit**

```bash
git add server/app/models/seed_material.py server/app/models/__init__.py server/app/models/scenario.py server/alembic/versions/
git commit -m "feat(005): add SeedMaterial model + migration"
```

---

## Task 2: Backend — SeedMaterial Schemas

**Files:**
- Create: `server/app/schemas/seed_material.py`

- [ ] **Step 1: Create schemas**

Create `server/app/schemas/seed_material.py`:

```python
import uuid
from typing import Literal

from pydantic import Field

from app.schemas.common import CamelModel, TimestampMixin


class MarketContextSchema(CamelModel):
    market_size: str | None = None
    growth_rate: str | None = None
    key_stats: list[dict] | None = None
    summary: str | None = None


class CompetitorSchema(CamelModel):
    name: str
    positioning: str | None = None
    strengths: list[str] | None = None
    weaknesses: list[str] | None = None


class ConsumerPersonaSchema(CamelModel):
    name: str
    emoji: str | None = None
    age_range: str | None = None
    description: str | None = None
    pain_points: list[str] | None = None


class DiscussionTopicSchema(CamelModel):
    topic: str
    description: str | None = None
    relevance: str | None = None


class SeedMaterialRead(TimestampMixin):
    scenario_id: uuid.UUID
    version: int
    status: str
    market_context: dict | None
    competitors: list[dict] | None
    consumer_personas: list[dict] | None
    discussion_topics: list[dict] | None
    error_message: str | None


class SeedMaterialUpdate(CamelModel):
    competitors: list[dict] | None = None
    discussion_topics: list[dict] | None = None
```

- [ ] **Step 2: Commit**

```bash
git add server/app/schemas/seed_material.py
git commit -m "feat(005): add SeedMaterial schemas"
```

---

## Task 3: Backend — Seed Builder Service

**Files:**
- Create: `server/app/services/seed_builder_service.py`
- Modify: `server/app/llm/prompts.py` (add seed builder prompt)
- Modify: `server/app/llm/__init__.py` (re-export)

- [ ] **Step 1: Add seed builder prompt to llm/prompts.py**

Append to `server/app/llm/prompts.py`:

```python
SEED_BUILDER_SYSTEM_PROMPT = """You are a market research analyst AI. Given a business concept, generate comprehensive seed materials for a business validation simulation.

You MUST respond with valid JSON matching the exact structure specified. Be specific, data-driven, and realistic. Use real market data when possible."""


def build_seed_builder_prompt(
    *,
    project_name: str,
    description: str | None,
    product_type: str | None,
    target_market: str | None,
    target_audience: str | None,
    pricing_model: str | None,
    competitors: list[str] | None,
    agent_depth: str,
    agent_distribution: dict[str, int] | None,
) -> str:
    lines = [f"## Business Concept: {project_name}"]
    if description:
        lines.append(f"Description: {description}")
    if product_type:
        lines.append(f"Product Type: {product_type}")
    if target_market:
        lines.append(f"Target Market: {target_market}")
    if target_audience:
        lines.append(f"Target Audience: {target_audience}")
    if pricing_model:
        lines.append(f"Pricing Model: {pricing_model}")
    if competitors:
        lines.append(f"Known Competitors: {', '.join(competitors)}")
    lines.append(f"\nSimulation Depth: {agent_depth}")
    if agent_distribution:
        dist_str = ", ".join(f"{k}: {v}" for k, v in agent_distribution.items())
        lines.append(f"Agent Distribution: {dist_str}")

    lines.append("""
## Required Output (JSON)

Return a JSON object with these exact keys:

{
  "market_context": {
    "market_size": "<e.g. $85M or A$2.1B>",
    "growth_rate": "<e.g. +12% annually>",
    "key_stats": [{"label": "<stat name>", "value": "<stat value>"}],
    "summary": "<2-3 sentence market overview>"
  },
  "competitors": [
    {
      "name": "<competitor name>",
      "positioning": "<brief positioning>",
      "strengths": ["<strength 1>", "<strength 2>"],
      "weaknesses": ["<weakness 1>", "<weakness 2>"]
    }
  ],
  "consumer_personas": [
    {
      "name": "<persona name>",
      "emoji": "<single emoji>",
      "age_range": "<e.g. 25-35>",
      "description": "<2-3 sentence description>",
      "pain_points": ["<pain point 1>", "<pain point 2>"]
    }
  ],
  "discussion_topics": [
    {
      "topic": "<topic name>",
      "description": "<why this matters>",
      "relevance": "<high|medium|low>"
    }
  ]
}

Generate 3-5 competitors, 3-5 consumer personas, and 4-6 discussion topics. Be specific to the business concept and market.""")

    return "\n".join(lines)
```

- [ ] **Step 2: Re-export from llm/__init__.py**

Add to `server/app/llm/__init__.py`:

```python
from app.llm.prompts import SEED_BUILDER_SYSTEM_PROMPT, build_seed_builder_prompt
```

And add both to `__all__`.

- [ ] **Step 3: Create seed_builder_service.py**

Create `server/app/services/seed_builder_service.py`:

```python
import json
import logging
import uuid

import openai
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.llm import (
    LLMResponseError,
    LLMServiceError,
    LLMTimeoutError,
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
```

- [ ] **Step 4: Commit**

```bash
git add server/app/llm/prompts.py server/app/llm/__init__.py server/app/services/seed_builder_service.py
git commit -m "feat(005): add seed builder service + LLM prompt"
```

---

## Task 4: Backend — Seed Materials Router

**Files:**
- Create: `server/app/routers/seed_materials.py`
- Modify: `server/app/main.py` (register router)

- [ ] **Step 1: Create the router**

Create `server/app/routers/seed_materials.py`:

```python
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
```

- [ ] **Step 2: Register router in main.py**

In `server/app/main.py`, add to imports:

```python
from app.routers import agent_templates, health, projects, runs, scenarios, seed_materials
```

And add to `create_app()`:

```python
    application.include_router(seed_materials.router)
```

- [ ] **Step 3: Commit**

```bash
git add server/app/routers/seed_materials.py server/app/main.py
git commit -m "feat(005): add seed materials API endpoints"
```

---

## Task 5: Backend — Tests

**Files:**
- Create: `server/tests/test_seed_materials.py`

- [ ] **Step 1: Write seed material tests**

Create `server/tests/test_seed_materials.py`:

```python
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient


async def _create_project_and_scenario(client: AsyncClient) -> tuple[str, str]:
    """Helper: create a project + scenario, return (project_id, scenario_id)."""
    proj = await client.post(
        "/api/projects",
        json={
            "name": "Test Startup",
            "description": "A pet sitting platform",
            "productType": "SaaS Platform",
            "targetMarket": "Australia",
            "targetAudience": "Pet owners",
            "pricingModel": "Commission 12%",
            "competitors": ["CompA", "CompB"],
        },
    )
    project_id = proj.json()["id"]
    scen = await client.post(
        f"/api/projects/{project_id}/scenarios",
        json={"name": "Default", "agentDepth": "standard"},
    )
    scenario_id = scen.json()["id"]
    return project_id, scenario_id


MOCK_LLM_RESPONSE = {
    "market_context": {
        "market_size": "$85M",
        "growth_rate": "+12%",
        "key_stats": [{"label": "Households", "value": "3.2M"}],
        "summary": "Growing market.",
    },
    "competitors": [
        {
            "name": "CompA",
            "positioning": "Market leader",
            "strengths": ["Brand"],
            "weaknesses": ["Price"],
        }
    ],
    "consumer_personas": [
        {
            "name": "Urban Pro",
            "emoji": "🏙️",
            "age_range": "25-35",
            "description": "Young professional.",
            "pain_points": ["Trust"],
        }
    ],
    "discussion_topics": [
        {"topic": "Trust", "description": "Key concern.", "relevance": "high"}
    ],
}


def _mock_llm_response(content: str):
    """Build a mock OpenAI chat completion response."""
    message = AsyncMock()
    message.content = content
    choice = AsyncMock()
    choice.message = message
    response = AsyncMock()
    response.choices = [choice]
    return response


@pytest.mark.asyncio
async def test_generate_seed_materials(client: AsyncClient):
    _, scenario_id = await _create_project_and_scenario(client)

    import json

    mock_resp = _mock_llm_response(json.dumps(MOCK_LLM_RESPONSE))

    with patch("app.services.seed_builder_service.get_llm_client") as mock_client:
        mock_client.return_value.chat.completions.create = AsyncMock(
            return_value=mock_resp
        )
        resp = await client.post(f"/api/scenarios/{scenario_id}/seed-materials")

    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == "completed"
    assert data["version"] == 1
    assert data["marketContext"]["marketSize"] == "$85M"
    assert len(data["competitors"]) == 1
    assert len(data["consumerPersonas"]) == 1
    assert len(data["discussionTopics"]) == 1


@pytest.mark.asyncio
async def test_generate_seed_materials_increments_version(client: AsyncClient):
    _, scenario_id = await _create_project_and_scenario(client)

    import json

    mock_resp = _mock_llm_response(json.dumps(MOCK_LLM_RESPONSE))

    with patch("app.services.seed_builder_service.get_llm_client") as mock_client:
        mock_client.return_value.chat.completions.create = AsyncMock(
            return_value=mock_resp
        )
        resp1 = await client.post(f"/api/scenarios/{scenario_id}/seed-materials")
        resp2 = await client.post(f"/api/scenarios/{scenario_id}/seed-materials")

    assert resp1.json()["version"] == 1
    assert resp2.json()["version"] == 2


@pytest.mark.asyncio
async def test_list_seed_materials(client: AsyncClient):
    _, scenario_id = await _create_project_and_scenario(client)

    import json

    mock_resp = _mock_llm_response(json.dumps(MOCK_LLM_RESPONSE))

    with patch("app.services.seed_builder_service.get_llm_client") as mock_client:
        mock_client.return_value.chat.completions.create = AsyncMock(
            return_value=mock_resp
        )
        await client.post(f"/api/scenarios/{scenario_id}/seed-materials")

    resp = await client.get(f"/api/scenarios/{scenario_id}/seed-materials")
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) == 1
    assert items[0]["version"] == 1


@pytest.mark.asyncio
async def test_get_seed_material_by_id(client: AsyncClient):
    _, scenario_id = await _create_project_and_scenario(client)

    import json

    mock_resp = _mock_llm_response(json.dumps(MOCK_LLM_RESPONSE))

    with patch("app.services.seed_builder_service.get_llm_client") as mock_client:
        mock_client.return_value.chat.completions.create = AsyncMock(
            return_value=mock_resp
        )
        create_resp = await client.post(
            f"/api/scenarios/{scenario_id}/seed-materials"
        )

    seed_id = create_resp.json()["id"]
    resp = await client.get(f"/api/seed-materials/{seed_id}")
    assert resp.status_code == 200
    assert resp.json()["id"] == seed_id


@pytest.mark.asyncio
async def test_update_seed_material_competitors(client: AsyncClient):
    _, scenario_id = await _create_project_and_scenario(client)

    import json

    mock_resp = _mock_llm_response(json.dumps(MOCK_LLM_RESPONSE))

    with patch("app.services.seed_builder_service.get_llm_client") as mock_client:
        mock_client.return_value.chat.completions.create = AsyncMock(
            return_value=mock_resp
        )
        create_resp = await client.post(
            f"/api/scenarios/{scenario_id}/seed-materials"
        )

    seed_id = create_resp.json()["id"]
    new_competitors = [
        {"name": "NewComp", "positioning": "Challenger", "strengths": [], "weaknesses": []}
    ]
    resp = await client.patch(
        f"/api/seed-materials/{seed_id}",
        json={"competitors": new_competitors},
    )
    assert resp.status_code == 200
    assert resp.json()["competitors"][0]["name"] == "NewComp"
    # discussion_topics should be unchanged
    assert resp.json()["discussionTopics"] == MOCK_LLM_RESPONSE["discussion_topics"]


@pytest.mark.asyncio
async def test_generate_seed_materials_llm_failure(client: AsyncClient):
    _, scenario_id = await _create_project_and_scenario(client)

    with patch("app.services.seed_builder_service.get_llm_client") as mock_client:
        import openai

        mock_client.return_value.chat.completions.create = AsyncMock(
            side_effect=openai.APITimeoutError(request=None)
        )
        resp = await client.post(f"/api/scenarios/{scenario_id}/seed-materials")

    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == "failed"
    assert "timed out" in data["errorMessage"]


@pytest.mark.asyncio
async def test_seed_material_not_found(client: AsyncClient):
    resp = await client.get(
        "/api/seed-materials/00000000-0000-0000-0000-000000000000"
    )
    assert resp.status_code == 404
```

- [ ] **Step 2: Run tests to verify they pass**

```bash
cd server
uv run python -m pytest tests/test_seed_materials.py -v
```

Expected: All 7 tests PASS.

- [ ] **Step 3: Run full test suite to check no regressions**

```bash
uv run python -m pytest tests/ -v
```

Expected: All tests PASS.

- [ ] **Step 4: Run linter**

```bash
uv run python -m ruff check app/ tests/
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add server/tests/test_seed_materials.py
git commit -m "test(005): add seed material API tests"
```

---

## Task 6: Frontend — Agent Template Constants

**Files:**
- Create: `src/lib/agent-templates.ts`

- [ ] **Step 1: Create the constants file**

Create `src/lib/agent-templates.ts`:

```typescript
export const AGENT_ROLES = [
  "consumer",
  "enterprise",
  "competitor",
  "investor",
  "supplier",
  "regulator",
  "expert",
  "mentor",
] as const;

export type AgentRole = (typeof AGENT_ROLES)[number];

export const AGENT_ROLE_LABELS: Record<AgentRole, string> = {
  consumer: "Consumer",
  enterprise: "Enterprise",
  competitor: "Competitor",
  investor: "Investor",
  supplier: "Supplier",
  regulator: "Regulator",
  expert: "Expert",
  mentor: "Mentor",
};

export const AGENT_ROLE_COLORS: Record<AgentRole, string> = {
  consumer: "hsl(145 55% 45%)",
  enterprise: "hsl(217 91% 70%)",
  competitor: "hsl(0 70% 55%)",
  investor: "hsl(43 74% 65%)",
  supplier: "hsl(197 37% 70%)",
  regulator: "hsl(280 50% 55%)",
  expert: "hsl(173 58% 65%)",
  mentor: "hsl(320 50% 55%)",
};

export type SimulationDepth = "quick" | "standard" | "deep";

export interface DepthConfig {
  label: string;
  emoji: string;
  agentCount: number;
  estimatedTime: string;
  description: string;
  distribution: Record<AgentRole, number>;
}

export const DEPTH_CONFIGS: Record<SimulationDepth, DepthConfig> = {
  quick: {
    label: "Quick",
    emoji: "⚡",
    agentCount: 20,
    estimatedTime: "~2 min",
    description: "Validate core hypothesis",
    distribution: {
      consumer: 10,
      enterprise: 3,
      competitor: 2,
      investor: 1,
      supplier: 1,
      regulator: 1,
      expert: 1,
      mentor: 1,
    },
  },
  standard: {
    label: "Standard",
    emoji: "🔬",
    agentCount: 81,
    estimatedTime: "~10 min",
    description: "Full market feedback",
    distribution: {
      consumer: 50,
      enterprise: 15,
      competitor: 5,
      investor: 3,
      supplier: 3,
      regulator: 2,
      expert: 2,
      mentor: 1,
    },
  },
  deep: {
    label: "Deep",
    emoji: "🔭",
    agentCount: 221,
    estimatedTime: "~30 min",
    description: "Competition deep-dive",
    distribution: {
      consumer: 150,
      enterprise: 40,
      competitor: 10,
      investor: 5,
      supplier: 8,
      regulator: 3,
      expert: 3,
      mentor: 2,
    },
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/agent-templates.ts
git commit -m "feat(005): add agent template constants"
```

---

## Task 7: Frontend — Scenario + Seed Material Hooks

**Files:**
- Create: `src/hooks/use-scenario.ts`
- Create: `src/hooks/use-seed-materials.ts`

- [ ] **Step 1: Create use-scenario.ts**

Create `src/hooks/use-scenario.ts`:

```typescript
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ScenarioRead {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  agentCount: number;
  agentDepth: "quick" | "standard" | "deep";
  marketConfig: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface ScenarioUpdate {
  name?: string;
  description?: string | null;
  agentCount?: number;
  agentDepth?: "quick" | "standard" | "deep";
  marketConfig?: Record<string, unknown>;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Fetch the project's scenario (first one, or auto-create).
 * Uses the list endpoint and picks the first result.
 */
export function useProjectScenario(projectId: string | undefined) {
  return useQuery<ScenarioRead | null>({
    queryKey: [`/api/projects/${projectId}/scenarios`, "first"],
    enabled: !!projectId,
    queryFn: async () => {
      const resp = await apiRequest<PaginatedResponse<ScenarioRead>>(
        "GET",
        `/api/projects/${projectId}/scenarios`
      );
      if (resp.items.length > 0) {
        return resp.items[0];
      }
      // Auto-create default scenario
      const created = await apiRequest<ScenarioRead>(
        "POST",
        `/api/projects/${projectId}/scenarios`,
        { name: "Default Simulation", agentDepth: "standard" }
      );
      return created;
    },
  });
}

export function useUpdateScenario(scenarioId: string | undefined) {
  return useMutation({
    mutationFn: (data: ScenarioUpdate) =>
      apiRequest<ScenarioRead>("PATCH", `/api/scenarios/${scenarioId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/scenarios/${scenarioId}`] });
      // Also invalidate the project scenarios list
      queryClient.invalidateQueries({
        predicate: (query) =>
          typeof query.queryKey[0] === "string" &&
          query.queryKey[0].includes("/scenarios"),
      });
    },
  });
}

export type { ScenarioRead, ScenarioUpdate };
```

- [ ] **Step 2: Create use-seed-materials.ts**

Create `src/hooks/use-seed-materials.ts`:

```typescript
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export interface SeedMaterialRead {
  id: string;
  scenarioId: string;
  version: number;
  status: "generating" | "completed" | "failed";
  marketContext: {
    marketSize?: string;
    growthRate?: string;
    keyStats?: { label: string; value: string }[];
    summary?: string;
  } | null;
  competitors: {
    name: string;
    positioning?: string;
    strengths?: string[];
    weaknesses?: string[];
  }[] | null;
  consumerPersonas: {
    name: string;
    emoji?: string;
    ageRange?: string;
    description?: string;
    painPoints?: string[];
  }[] | null;
  discussionTopics: {
    topic: string;
    description?: string;
    relevance?: string;
  }[] | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SeedMaterialUpdate {
  competitors?: Record<string, unknown>[];
  discussionTopics?: Record<string, unknown>[];
}

export function useSeedMaterials(scenarioId: string | undefined) {
  return useQuery<SeedMaterialRead[]>({
    queryKey: [`/api/scenarios/${scenarioId}/seed-materials`],
    enabled: !!scenarioId,
  });
}

export function useLatestSeedMaterial(scenarioId: string | undefined) {
  const query = useSeedMaterials(scenarioId);
  const latest = query.data?.[0] ?? null;
  return { ...query, data: latest };
}

export function useGenerateSeedMaterials(scenarioId: string | undefined) {
  return useMutation({
    mutationFn: () =>
      apiRequest<SeedMaterialRead>(
        "POST",
        `/api/scenarios/${scenarioId}/seed-materials`
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/scenarios/${scenarioId}/seed-materials`],
      });
    },
  });
}

export function useUpdateSeedMaterial(seedMaterialId: string | undefined) {
  return useMutation({
    mutationFn: (data: SeedMaterialUpdate) =>
      apiRequest<SeedMaterialRead>(
        "PATCH",
        `/api/seed-materials/${seedMaterialId}`,
        data
      ),
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: [`/api/scenarios/${result.scenarioId}/seed-materials`],
      });
    },
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/use-scenario.ts src/hooks/use-seed-materials.ts
git commit -m "feat(005): add scenario + seed material hooks"
```

---

## Task 8: Frontend — Sidebar Restructure + Route Cleanup

**Files:**
- Modify: `src/components/app-sidebar.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Simplify app-sidebar.tsx**

Replace the nav item arrays and NavGroup calls in `src/components/app-sidebar.tsx`:

```typescript
import { useCallback } from "react";
import { useLocation, Link } from "wouter";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Settings,
  Beaker,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

const prefetchMap: Record<string, () => Promise<unknown>> = {
  "/agents": () => import("@/pages/agents"),
  "/admin": () => import("@/pages/admin"),
};

const prefetched = new Set<string>();

function usePrefetch() {
  return useCallback((url: string) => {
    if (prefetched.has(url)) return;
    const loader = prefetchMap[url];
    if (loader) {
      prefetched.add(url);
      loader();
    }
  }, []);
}

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Projects", url: "/projects", icon: FolderKanban },
  { title: "Agent Templates", url: "/agents", icon: Users },
];

const systemItems = [
  { title: "Settings", url: "/admin", icon: Settings },
];

function NavGroup({ label, items }: { label: string; items: typeof navItems }) {
  const [location] = useLocation();
  const prefetch = usePrefetch();
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive = location === item.url || (item.url !== "/" && location.startsWith(item.url));
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild data-active={isActive}>
                  <Link
                    href={item.url}
                    data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                    onMouseEnter={() => prefetch(item.url)}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-4">
        <Link href="/" className="flex items-center gap-2" data-testid="nav-logo">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary">
            <Beaker className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-tight">BizSim</span>
            <span className="text-[10px] text-muted-foreground leading-tight">Business Validator</span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <NavGroup label="Navigation" items={navItems} />
        <NavGroup label="System" items={systemItems} />
      </SidebarContent>
      <SidebarFooter className="px-4 py-3">
        <div className="text-[10px] text-muted-foreground">v1.0.0 Research Edition</div>
      </SidebarFooter>
    </Sidebar>
  );
}
```

- [ ] **Step 2: Clean up App.tsx routes**

In `src/App.tsx`, remove the unused lazy imports and routes:

Remove these imports:
```typescript
const SimulationsPage = lazy(() => import("@/pages/simulations"));
const ValidationPage = lazy(() => import("@/pages/validation"));
const ViabilityPage = lazy(() => import("@/pages/viability"));
const ReportsPage = lazy(() => import("@/pages/reports"));
const SimulationLivePage = lazy(() => import("@/pages/simulation-live"));
```

Remove these routes from Router():
```typescript
        <Route path="/simulations" component={SimulationsPage} />
        <Route path="/simulations/live" component={SimulationLivePage} />
        <Route path="/validation" component={ValidationPage} />
        <Route path="/viability" component={ViabilityPage} />
        <Route path="/reports" component={ReportsPage} />
```

Keep: `/`, `/projects/new`, `/projects/:id`, `/projects`, `/agents`, `/admin`, NotFound.

Also remove the `lazy` import from React if no lazy components remain. Check: `AgentsPage` and `AdminPage` are still lazy, so keep `lazy`.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/app-sidebar.tsx src/App.tsx
git commit -m "feat(005): simplify sidebar to 4 items + remove unused routes"
```

---

## Task 9: Frontend — Project Step Nav Component

**Files:**
- Create: `src/components/project/project-step-nav.tsx`

- [ ] **Step 1: Create the floating TOC component**

Create `src/components/project/project-step-nav.tsx`:

```typescript
import { cn } from "@/lib/utils";

export type StepStatus = "completed" | "active" | "locked";

export interface ProjectStep {
  id: string;
  label: string;
  status: StepStatus;
}

interface ProjectStepNavProps {
  steps: ProjectStep[];
  onStepClick?: (stepId: string) => void;
}

export function ProjectStepNav({ steps, onStepClick }: ProjectStepNavProps) {
  return (
    <nav className="space-y-0.5">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-2">
        Outline
      </div>
      {steps.map((step) => (
        <button
          key={step.id}
          onClick={() => step.status !== "locked" && onStepClick?.(step.id)}
          disabled={step.status === "locked"}
          className={cn(
            "relative flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors",
            step.status === "completed" && "text-muted-foreground hover:text-foreground",
            step.status === "active" && "text-foreground font-medium",
            step.status === "locked" && "text-muted-foreground/30 cursor-default"
          )}
        >
          {step.status === "active" && (
            <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-primary" />
          )}
          <span
            className={cn(
              "h-1.5 w-1.5 shrink-0 rounded-full",
              step.status === "completed" && "bg-green-500",
              step.status === "active" && "bg-primary ring-2 ring-primary/20",
              step.status === "locked" && "bg-muted-foreground/30"
            )}
          />
          {step.label}
        </button>
      ))}
    </nav>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/project/project-step-nav.tsx
git commit -m "feat(005): add floating TOC component"
```

---

## Task 10: Frontend — Simulation Config Card

**Files:**
- Create: `src/components/project/simulation-config-card.tsx`

- [ ] **Step 1: Create the simulation config card**

Create `src/components/project/simulation-config-card.tsx`:

```typescript
import { useState, useMemo } from "react";
import { Settings, RotateCcw, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  DEPTH_CONFIGS,
  AGENT_ROLES,
  AGENT_ROLE_LABELS,
  AGENT_ROLE_COLORS,
  type SimulationDepth,
  type AgentRole,
} from "@/lib/agent-templates";

interface SimulationConfigCardProps {
  depth: SimulationDepth;
  distribution: Record<AgentRole, number>;
  onDepthChange: (depth: SimulationDepth) => void;
  onDistributionChange: (dist: Record<AgentRole, number>) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export function SimulationConfigCard({
  depth,
  distribution,
  onDepthChange,
  onDistributionChange,
  onGenerate,
  isGenerating,
}: SimulationConfigCardProps) {
  const total = useMemo(
    () => Object.values(distribution).reduce((a, b) => a + b, 0),
    [distribution]
  );

  function handleDepthSelect(newDepth: SimulationDepth) {
    onDepthChange(newDepth);
    onDistributionChange({ ...DEPTH_CONFIGS[newDepth].distribution });
  }

  function handleCountChange(role: AgentRole, value: string) {
    const num = Math.max(0, parseInt(value) || 0);
    onDistributionChange({ ...distribution, [role]: num });
  }

  function handleReset() {
    onDistributionChange({ ...DEPTH_CONFIGS[depth].distribution });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Settings className="h-4 w-4 text-primary" />
          Simulation Config
        </div>
        <Badge variant="outline" className="text-[10px] text-primary border-primary/20 bg-primary/5">
          Current Step
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Depth Selector */}
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-2.5">
            Simulation Depth
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {(["quick", "standard", "deep"] as const).map((d) => {
              const config = DEPTH_CONFIGS[d];
              const selected = depth === d;
              return (
                <button
                  key={d}
                  onClick={() => handleDepthSelect(d)}
                  className={cn(
                    "rounded-lg border-2 p-3 text-center transition-colors",
                    selected
                      ? "border-primary bg-accent"
                      : "border-transparent bg-muted hover:border-muted-foreground/20"
                  )}
                >
                  <div className={cn("text-sm font-semibold", selected ? "text-primary" : "text-muted-foreground")}>
                    {config.label}
                  </div>
                  <div className="text-xl my-1">{config.emoji}</div>
                  <div className={cn("text-[11px]", selected ? "text-chart-1" : "text-muted-foreground")}>
                    {config.agentCount} Agents · {config.estimatedTime}
                  </div>
                  <div className="text-[10px] text-muted-foreground/60 mt-1">{config.description}</div>
                  {d === "standard" && (
                    <div className="text-[10px] text-primary font-medium mt-0.5">✓ Recommended</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Agent Distribution */}
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-2.5">
            Agent Distribution
          </div>
          <div className="grid grid-cols-4 gap-2">
            {AGENT_ROLES.map((role) => (
              <div key={role} className="text-center">
                <div className="text-[10px] text-muted-foreground mb-1">
                  {AGENT_ROLE_LABELS[role]}
                </div>
                <Input
                  type="number"
                  min={0}
                  value={distribution[role]}
                  onChange={(e) => handleCountChange(role, e.target.value)}
                  className="h-8 text-center text-sm font-semibold"
                />
              </div>
            ))}
          </div>
          {/* Color bar */}
          <div className="flex h-1.5 rounded-full overflow-hidden gap-px mt-2.5">
            {AGENT_ROLES.map((role) =>
              distribution[role] > 0 ? (
                <div
                  key={role}
                  style={{
                    flex: distribution[role],
                    backgroundColor: AGENT_ROLE_COLORS[role],
                  }}
                  className="rounded-sm"
                />
              ) : null
            )}
          </div>
          <div className="text-right text-xs text-muted-foreground mt-1">
            Total: <span className="font-semibold text-foreground">{total}</span> Agents
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Reset to Template
          </Button>
          <Button size="sm" onClick={onGenerate} disabled={isGenerating || total === 0}>
            {isGenerating ? (
              <>
                <div className="h-3.5 w-3.5 mr-1.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Generating...
              </>
            ) : (
              <>
                <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
                Generate Seed Materials
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/project/simulation-config-card.tsx
git commit -m "feat(005): add simulation config card component"
```

---

## Task 11: Frontend — Seed Materials Card

**Files:**
- Create: `src/components/project/seed-materials-card.tsx`

- [ ] **Step 1: Create the seed materials card**

Create `src/components/project/seed-materials-card.tsx`:

```typescript
import { useState } from "react";
import {
  Check,
  TrendingUp,
  Building2,
  Users,
  MessageCircle,
  ChevronRight,
  X,
  Plus,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { SeedMaterialRead } from "@/hooks/use-seed-materials";

interface SeedMaterialsCardProps {
  seedMaterial: SeedMaterialRead;
  onRegenerate: () => void;
  onUpdateCompetitors: (competitors: Record<string, unknown>[]) => void;
  onUpdateTopics: (topics: Record<string, unknown>[]) => void;
  isRegenerating: boolean;
}

export function SeedMaterialsCard({
  seedMaterial,
  onRegenerate,
  onUpdateCompetitors,
  onUpdateTopics,
  isRegenerating,
}: SeedMaterialsCardProps) {
  if (seedMaterial.status === "failed") {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AlertCircle className="h-4 w-4 text-destructive" />
            Seed Materials
          </div>
          <Button variant="ghost" size="sm" className="text-xs" onClick={onRegenerate} disabled={isRegenerating}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Retry
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{seedMaterial.errorMessage || "Generation failed."}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Check className="h-4 w-4 text-green-500" />
          Seed Materials
        </div>
        <Button variant="ghost" size="sm" className="text-xs" onClick={onRegenerate} disabled={isRegenerating}>
          {isRegenerating ? "Regenerating..." : "Regenerate"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Market Context */}
        {seedMaterial.marketContext && (
          <MarketContextSection data={seedMaterial.marketContext} />
        )}

        {/* Competitors (editable) */}
        {seedMaterial.competitors && (
          <EditableTagSection
            icon={<Building2 className="h-3.5 w-3.5" />}
            title="Competitors"
            editable
            items={seedMaterial.competitors.map((c) => c.name)}
            onUpdate={(names) => {
              const updated = names.map((name) => {
                const existing = seedMaterial.competitors?.find((c) => c.name === name);
                return existing || { name };
              });
              onUpdateCompetitors(updated);
            }}
            colorClass="text-chart-5"
          />
        )}

        {/* Consumer Personas */}
        {seedMaterial.consumerPersonas && (
          <TagSection
            icon={<Users className="h-3.5 w-3.5" />}
            title="Consumer Personas"
            items={seedMaterial.consumerPersonas.map(
              (p) => `${p.emoji || "👤"} ${p.name}`
            )}
            colorClass="text-chart-4"
          />
        )}

        {/* Discussion Topics (editable) */}
        {seedMaterial.discussionTopics && (
          <EditableTagSection
            icon={<MessageCircle className="h-3.5 w-3.5" />}
            title="Discussion Topics"
            editable
            items={seedMaterial.discussionTopics.map((t) => t.topic)}
            onUpdate={(topics) => {
              const updated = topics.map((topic) => {
                const existing = seedMaterial.discussionTopics?.find((t) => t.topic === topic);
                return existing || { topic };
              });
              onUpdateTopics(updated);
            }}
            colorClass="text-chart-2"
            tagBg="bg-chart-2/10"
          />
        )}
      </CardContent>
    </Card>
  );
}

function MarketContextSection({ data }: { data: NonNullable<SeedMaterialRead["marketContext"]> }) {
  return (
    <div className="rounded-lg bg-muted p-3 cursor-pointer hover:bg-muted/80 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-medium text-chart-3">
          <TrendingUp className="h-3.5 w-3.5" />
          Market Context
        </div>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
      </div>
      <div className="flex gap-6 mt-2">
        {data.marketSize && (
          <div>
            <div className="text-xl font-bold">{data.marketSize}</div>
            <div className="text-[10px] text-muted-foreground">Market Size</div>
          </div>
        )}
        {data.growthRate && (
          <div>
            <div className="text-xl font-bold text-green-500">{data.growthRate}</div>
            <div className="text-[10px] text-muted-foreground">Annual Growth</div>
          </div>
        )}
        {data.keyStats?.slice(0, 1).map((s, i) => (
          <div key={i}>
            <div className="text-xl font-bold">{s.value}</div>
            <div className="text-[10px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TagSection({
  icon,
  title,
  items,
  colorClass,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
  colorClass: string;
}) {
  return (
    <div className="rounded-lg bg-muted p-3">
      <div className={`flex items-center gap-1.5 text-xs font-medium ${colorClass}`}>
        {icon}
        {title}
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {items.map((item) => (
          <Badge key={item} variant="secondary" className="text-[11px]">
            {item}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function EditableTagSection({
  icon,
  title,
  editable,
  items,
  onUpdate,
  colorClass,
  tagBg,
}: {
  icon: React.ReactNode;
  title: string;
  editable: boolean;
  items: string[];
  onUpdate: (items: string[]) => void;
  colorClass: string;
  tagBg?: string;
}) {
  const [adding, setAdding] = useState(false);
  const [newValue, setNewValue] = useState("");

  function handleRemove(item: string) {
    onUpdate(items.filter((i) => i !== item));
  }

  function handleAdd() {
    const trimmed = newValue.trim();
    if (trimmed && !items.includes(trimmed)) {
      onUpdate([...items, trimmed]);
    }
    setNewValue("");
    setAdding(false);
  }

  return (
    <div className="rounded-lg bg-muted p-3">
      <div className={`flex items-center gap-1.5 text-xs font-medium ${colorClass}`}>
        {icon}
        {title}
        {editable && (
          <span className="text-[10px] text-muted-foreground/60 font-normal ml-1">
            · Can edit
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {items.map((item) => (
          <Badge key={item} variant="secondary" className={`text-[11px] ${tagBg || ""}`}>
            {item}
            <button
              onClick={() => handleRemove(item)}
              className="ml-1 text-muted-foreground/40 hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        {adding ? (
          <Input
            autoFocus
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onBlur={handleAdd}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="h-6 w-32 text-[11px]"
            placeholder={`Add ${title.toLowerCase().replace("s", "")}`}
          />
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 rounded-md border border-dashed border-muted-foreground/20 px-2.5 py-0.5 text-[11px] text-muted-foreground/40 hover:border-primary hover:text-primary transition-colors"
          >
            <Plus className="h-3 w-3" />
            Add
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/project/seed-materials-card.tsx
git commit -m "feat(005): add seed materials card component"
```

---

## Task 12: Frontend — Locked Step Card + Run History

**Files:**
- Create: `src/components/project/locked-step-card.tsx`
- Create: `src/components/project/run-history-section.tsx`

- [ ] **Step 1: Create locked-step-card.tsx**

Create `src/components/project/locked-step-card.tsx`:

```typescript
import { Lock } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";

interface LockedStepCardProps {
  title: string;
  phaseLabel: string;
}

export function LockedStepCard({ title, phaseLabel }: LockedStepCardProps) {
  return (
    <Card className="opacity-40">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Lock className="h-3.5 w-3.5" />
          {title}
        </div>
        <span className="text-[11px] text-muted-foreground/60">{phaseLabel}</span>
      </CardHeader>
    </Card>
  );
}
```

- [ ] **Step 2: Create run-history-section.tsx**

Create `src/components/project/run-history-section.tsx`:

```typescript
import { Clock } from "lucide-react";
import type { SeedMaterialRead } from "@/hooks/use-seed-materials";

interface RunHistorySectionProps {
  seedMaterials: SeedMaterialRead[];
}

export function RunHistorySection({ seedMaterials }: RunHistorySectionProps) {
  return (
    <div className="mt-8">
      <div className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground mb-3">
        <Clock className="h-3.5 w-3.5" />
        Run History
      </div>
      {seedMaterials.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <div className="text-2xl opacity-40 mb-2">📭</div>
          <div className="text-xs text-muted-foreground/60">
            No simulation runs yet. Configure and generate seed materials to start.
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {seedMaterials.map((sm) => (
            <div
              key={sm.id}
              className="flex items-center justify-between rounded-lg bg-card border border-border px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-muted-foreground">
                  v{sm.version}
                </span>
                <span className={`text-xs font-medium ${
                  sm.status === "completed" ? "text-green-500" :
                  sm.status === "failed" ? "text-destructive" :
                  "text-yellow-500"
                }`}>
                  {sm.status}
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground/60">
                {new Date(sm.createdAt).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/project/locked-step-card.tsx src/components/project/run-history-section.tsx
git commit -m "feat(005): add locked step card + run history components"
```

---

## Task 13: Frontend — Project Info Card Collapse Mode

**Files:**
- Modify: `src/components/project/project-info-card.tsx`

- [ ] **Step 1: Add collapsed mode to ProjectInfoCard**

The existing `ProjectInfoCard` shows full details. Add a `collapsed` prop that shows a summary row instead:

Add a new prop to the component's interface:

```typescript
interface ProjectInfoCardProps {
  project: ProjectRead;
  onEdit: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}
```

When `collapsed` is true, render a minimal version:

```typescript
if (collapsed) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Check className="h-4 w-4 text-green-500" />
          Project Information
        </div>
        <Button variant="ghost" size="sm" className="text-xs" onClick={onToggleCollapse}>
          Expand
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4">
          {project.productType && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Briefcase className="h-3.5 w-3.5 opacity-50" />
              <span className="font-medium text-foreground">{project.productType}</span>
            </div>
          )}
          {project.targetMarket && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Globe className="h-3.5 w-3.5 opacity-50" />
              <span className="font-medium text-foreground">{project.targetMarket}</span>
            </div>
          )}
          {project.targetAudience && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5 opacity-50" />
              <span className="font-medium text-foreground">{project.targetAudience}</span>
            </div>
          )}
          {project.pricingModel && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5 opacity-50" />
              <span className="font-medium text-foreground">{project.pricingModel}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

Import the additional icons: `Check`, `ChevronDown`, `Briefcase`, `Globe`, `Users`, `DollarSign`.

The existing expanded render stays the same, but add a collapse button at the top when `onToggleCollapse` is provided.

- [ ] **Step 2: Commit**

```bash
git add src/components/project/project-info-card.tsx
git commit -m "feat(005): add collapsed mode to project info card"
```

---

## Task 14: Frontend — Rebuild Project Detail Page

**Files:**
- Modify: `src/pages/project-detail.tsx`

- [ ] **Step 1: Rewrite the project detail page**

Replace the entire `src/pages/project-detail.tsx` with:

```typescript
import { useState, useCallback, useRef } from "react";
import { Link, useParams } from "wouter";
import { ArrowLeft, Pencil } from "lucide-react";
import { useProject, useUpdateProject } from "@/hooks/use-project";
import { useProjectScenario, useUpdateScenario } from "@/hooks/use-scenario";
import {
  useLatestSeedMaterial,
  useSeedMaterials,
  useGenerateSeedMaterials,
  useUpdateSeedMaterial,
} from "@/hooks/use-seed-materials";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ProjectInfoCard } from "@/components/project/project-info-card";
import { ProjectEditForm } from "@/components/project/project-edit-form";
import { ProjectStepNav, type ProjectStep } from "@/components/project/project-step-nav";
import { SimulationConfigCard } from "@/components/project/simulation-config-card";
import { SeedMaterialsCard } from "@/components/project/seed-materials-card";
import { LockedStepCard } from "@/components/project/locked-step-card";
import { RunHistorySection } from "@/components/project/run-history-section";
import { DEPTH_CONFIGS, type SimulationDepth, type AgentRole } from "@/lib/agent-templates";
import type { ProjectUpdate } from "@/types/api";

function isProjectInfoComplete(project: { name: string; productType?: string | null }): boolean {
  return !!project.name && !!project.productType;
}

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data: project, isLoading: projectLoading, error: projectError } = useProject(id);
  const { data: scenario, isLoading: scenarioLoading } = useProjectScenario(id);
  const { data: latestSeed } = useLatestSeedMaterial(scenario?.id);
  const { data: allSeeds } = useSeedMaterials(scenario?.id);

  const updateProject = useUpdateProject(id!);
  const updateScenario = useUpdateScenario(scenario?.id);
  const generateSeed = useGenerateSeedMaterials(scenario?.id);
  const updateSeed = useUpdateSeedMaterial(latestSeed?.id);

  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [infoCollapsed, setInfoCollapsed] = useState(true);

  // Local simulation config state
  const [depth, setDepth] = useState<SimulationDepth>(
    (scenario?.agentDepth as SimulationDepth) || "standard"
  );
  const [distribution, setDistribution] = useState<Record<AgentRole, number>>(
    () => {
      const dist = (scenario?.marketConfig as Record<string, unknown>)?.agent_distribution;
      if (dist && typeof dist === "object") return dist as Record<AgentRole, number>;
      return { ...DEPTH_CONFIGS["standard"].distribution };
    }
  );

  // Refs for scroll targets
  const infoRef = useRef<HTMLDivElement>(null);
  const configRef = useRef<HTMLDivElement>(null);
  const seedRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<HTMLDivElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const refs: Record<string, React.RefObject<HTMLDivElement | null>> = {
    info: infoRef,
    config: configRef,
    seed: seedRef,
    sim: simRef,
    report: reportRef,
  };

  // Compute step statuses
  const infoComplete = project ? isProjectInfoComplete(project) : false;
  const hasSeed = latestSeed?.status === "completed";

  const steps: ProjectStep[] = [
    { id: "info", label: "Project Info", status: infoComplete ? "completed" : "active" },
    { id: "config", label: "Sim Config", status: infoComplete ? (hasSeed ? "completed" : "active") : "locked" },
    { id: "seed", label: "Seed Materials", status: hasSeed ? "completed" : (infoComplete ? "active" : "locked") },
    { id: "sim", label: "Simulation", status: "locked" },
    { id: "report", label: "Report", status: "locked" },
  ];

  const handleStepClick = useCallback((stepId: string) => {
    refs[stepId]?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  function handleSave(data: ProjectUpdate) {
    updateProject.mutate(data, {
      onSuccess: () => {
        setIsEditing(false);
        toast({ title: "Project updated" });
      },
      onError: () => {
        toast({ title: "Update failed", variant: "destructive" });
      },
    });
  }

  function handleGenerate() {
    // Save scenario config first
    updateScenario.mutate(
      {
        agentDepth: depth,
        agentCount: Object.values(distribution).reduce((a, b) => a + b, 0),
        marketConfig: { agent_distribution: distribution },
      },
      {
        onSuccess: () => {
          generateSeed.mutate(undefined, {
            onSuccess: () => {
              toast({ title: "Seed materials generated" });
            },
            onError: () => {
              toast({ title: "Generation failed", variant: "destructive" });
            },
          });
        },
      }
    );
  }

  if (projectLoading || scenarioLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </div>
    );
  }

  if (projectError || !project) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <p className="text-sm text-muted-foreground">
              {projectError ? "Failed to load project." : "Project not found."}
            </p>
            <Link href="/projects">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Projects
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative flex">
      {/* Floating TOC */}
      <div className="hidden lg:block sticky top-6 self-start ml-6 mt-20 w-40 shrink-0">
        <ProjectStepNav steps={steps} onStepClick={handleStepClick} />
      </div>

      {/* Main content */}
      <div className="flex-1 max-w-3xl mx-auto p-6 space-y-3">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/projects">Projects</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{project.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Page Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold">{project.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {[project.productType, project.targetMarket, project.pricingModel]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-green-500 border-green-500/20 bg-green-500/5">
              {project.status}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => { setInfoCollapsed(false); setIsEditing(true); }}>
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Button>
          </div>
        </div>

        {/* Step 1: Project Info */}
        <div ref={infoRef} className="scroll-mt-6">
          {isEditing ? (
            <ProjectEditForm
              project={project}
              onSave={handleSave}
              onCancel={() => setIsEditing(false)}
              isSaving={updateProject.isPending}
            />
          ) : (
            <ProjectInfoCard
              project={project}
              onEdit={() => setIsEditing(true)}
              collapsed={infoCollapsed}
              onToggleCollapse={() => setInfoCollapsed(!infoCollapsed)}
            />
          )}
        </div>

        {/* Step 2: Simulation Config */}
        <div ref={configRef} className="scroll-mt-6">
          {infoComplete ? (
            <SimulationConfigCard
              depth={depth}
              distribution={distribution}
              onDepthChange={setDepth}
              onDistributionChange={setDistribution}
              onGenerate={handleGenerate}
              isGenerating={generateSeed.isPending}
            />
          ) : (
            <LockedStepCard title="Simulation Config" phaseLabel="Complete project info first" />
          )}
        </div>

        {/* Step 3: Seed Materials */}
        <div ref={seedRef} className="scroll-mt-6">
          {latestSeed ? (
            <SeedMaterialsCard
              seedMaterial={latestSeed}
              onRegenerate={handleGenerate}
              onUpdateCompetitors={(competitors) =>
                updateSeed.mutate({ competitors })
              }
              onUpdateTopics={(topics) =>
                updateSeed.mutate({ discussionTopics: topics })
              }
              isRegenerating={generateSeed.isPending}
            />
          ) : generateSeed.isPending ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">Analyzing market and generating seed materials...</p>
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* Step 4: Simulation (locked) */}
        <div ref={simRef} className="scroll-mt-6">
          <LockedStepCard title="Simulation" phaseLabel="Phase 2" />
        </div>

        {/* Step 5: Report (locked) */}
        <div ref={reportRef} className="scroll-mt-6">
          <LockedStepCard title="Report" phaseLabel="Phase 3" />
        </div>

        {/* Run History */}
        <RunHistorySection seedMaterials={allSeeds || []} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/project-detail.tsx
git commit -m "feat(005): rebuild project detail as card journey with floating TOC"
```

---

## Task 15: Verification — Full Build + Tests

- [ ] **Step 1: Run backend linter**

```bash
cd server
uv run python -m ruff check app/ tests/
```

Expected: No errors.

- [ ] **Step 2: Run backend tests**

```bash
uv run python -m pytest tests/ -v
```

Expected: All tests pass (including new seed material tests).

- [ ] **Step 3: Run frontend type check**

```bash
cd ..
pnpm tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Run frontend build**

```bash
pnpm build
```

Expected: Build succeeds.

- [ ] **Step 5: Regenerate frontend types (if backend schema changed)**

```bash
pnpm generate:types
```

Then re-run `pnpm tsc --noEmit` to verify generated types are compatible.

- [ ] **Step 6: Browser smoke test**

Start dev servers, open a project detail page, and verify:
- Sidebar shows only 4 items
- Floating TOC appears on left
- Depth selector works (click between Quick/Standard/Deep)
- Agent distribution inputs are editable
- "Generate Seed Materials" triggers LLM call
- Seed materials display after generation
- Competitors and topics are editable (add/remove tags)
- Locked cards show Phase 2/3 labels
- Run history section appears at bottom

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "feat(005): seed builder — complete implementation"
```
