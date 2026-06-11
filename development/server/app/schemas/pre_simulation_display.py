import uuid

from pydantic import Field

from app.schemas.common import CamelModel, TimestampMixin


class PreSimulationDisplayUpload(CamelModel):
    """Payload from the simulation runner; fields are extensible via `content`."""

    content: dict = Field(
        default_factory=dict,
        description="Flexible display payload for the Pre-Simulation UI",
    )


class AgentKindItem(CamelModel):
    key: str
    label: str
    count: int


class AgentDistributionUpload(CamelModel):
    """Agent kinds for the Pre-Simulation Display distribution module."""

    agents: dict = Field(
        default_factory=dict,
        description="Role key to agent count; additional fields may be added later",
    )


class AgentDistributionRead(CamelModel):
    project_id: uuid.UUID
    agents: dict[str, int]
    agent_kinds: list[AgentKindItem]
    total: int


class PreSimulationDisplayRead(TimestampMixin):
    project_id: uuid.UUID
    content: dict
    agent_distribution: dict[str, int] | None = None
