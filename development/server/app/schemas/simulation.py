import uuid
from typing import Literal

from pydantic import Field

from app.schemas.common import CamelModel


class SimulationStartRequest(CamelModel):
    user_id: uuid.UUID = Field(description="User initiating the simulation run")
    seed_material_id: uuid.UUID = Field(description="Completed seed material to simulate from")


class SimulationStartResponse(CamelModel):
    run_id: uuid.UUID
    scenario_id: uuid.UUID
    status: str
    agents_status: Literal["generating", "ready"]


class MarketInfoQAItem(CamelModel):
    question: str
    answer: str


class SimulationAgentsResponse(CamelModel):
    """Simulation input payload for external runners (GET /api/runs/{run_id}/agents)."""

    user_id: uuid.UUID
    scenario_id: uuid.UUID
    seed_material_id: uuid.UUID
    status: Literal["generating", "ready"]
    message: str | None = None
    description: str = Field(
        description="Project description from Project Info (excludes Market Info Q&A block)"
    )
    product_type: str | None = Field(
        default=None, description="Product type from Project Info"
    )
    consumer_personas: list[str] = Field(
        default_factory=list,
        description="Consumer persona names from seed materials (string array)",
    )
    discussion_topics: list[str] = Field(
        default_factory=list,
        description="Discussion topic titles from seed materials (string array)",
    )
    additional_information: list[MarketInfoQAItem] = Field(
        default_factory=list,
        description="Questions and answers from the Market Info wizard step",
    )
    sim_config_type: Literal["quick", "standard", "deep", "custom"] = Field(
        description="Simulation depth selected in Sim Config (agent_depth)"
    )
    simulation_query: str | None = Field(
        default=None,
        description="Natural-language simulation brief generated at pre-simulation display",
    )
