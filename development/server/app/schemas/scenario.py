import uuid
from typing import Literal

from pydantic import Field

from app.schemas.common import CamelModel, TimestampMixin


class ScenarioCreate(CamelModel):
    name: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    agent_count: int = Field(default=100, gt=0)
    agent_depth: Literal["quick", "standard", "deep", "custom"] = "standard"
    market_config: dict = Field(default_factory=dict)


class ScenarioUpdate(CamelModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    agent_count: int | None = Field(default=None, gt=0)
    agent_depth: Literal["quick", "standard", "deep", "custom"] | None = None
    market_config: dict | None = None


class ScenarioRead(TimestampMixin):
    project_id: uuid.UUID
    name: str
    description: str | None
    agent_count: int
    agent_depth: str
    market_config: dict
