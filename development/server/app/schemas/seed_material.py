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


class SeedMaterialGenerate(CamelModel):
    """Optional sim config applied atomically before generation (saves a round trip)."""

    agent_depth: Literal["quick", "standard", "deep", "custom"] | None = None
    agent_count: int | None = Field(default=None, gt=0)
    market_config: dict | None = None


class SeedMaterialRead(TimestampMixin):
    scenario_id: uuid.UUID
    version: int
    status: str
    market_context: dict | None
    competitors: list[dict] | None
    consumer_personas: list[dict] | None
    discussion_topics: list[dict] | None
    simulation_query: str | None = Field(
        default=None,
        description="LLM-synthesized natural-language simulation brief for external runners",
    )
    error_message: str | None


class SimulationQueryRead(CamelModel):
    """Latest simulation query for a project (via its primary scenario)."""

    project_id: uuid.UUID
    scenario_id: uuid.UUID
    seed_material_id: uuid.UUID
    seed_status: str
    simulation_query: str


class SeedMaterialUpdate(CamelModel):
    competitors: list[dict] | None = None
    consumer_personas: list[dict] | None = None
    discussion_topics: list[dict] | None = None
