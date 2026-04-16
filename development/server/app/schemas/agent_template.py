from typing import Literal

from pydantic import Field

from app.schemas.common import CamelModel, TimestampMixin


class AgentTemplateCreate(CamelModel):
    name: str = Field(min_length=1, max_length=200)
    role: str = Field(min_length=1, max_length=100)
    description: str | None = None
    model_tier: Literal["core", "community", "edge"] = "community"
    typical_count_min: int | None = None
    typical_count_max: int | None = None
    default_config: dict = Field(default_factory=dict)


class AgentTemplateUpdate(CamelModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    role: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = None
    model_tier: Literal["core", "community", "edge"] | None = None
    typical_count_min: int | None = None
    typical_count_max: int | None = None
    default_config: dict | None = None


class AgentTemplateRead(TimestampMixin):
    name: str
    role: str
    description: str | None
    model_tier: str
    typical_count_min: int | None
    typical_count_max: int | None
    default_config: dict
