from typing import Literal

from pydantic import Field

from app.schemas.common import CamelModel, TimestampMixin


class ProjectCreate(CamelModel):
    name: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    product_type: str | None = Field(default=None, max_length=50)
    target_market: str | None = Field(default=None, max_length=200)
    target_audience: str | None = None
    pricing_model: str | None = Field(default=None, max_length=100)
    competitors: list[str] = Field(default_factory=list)
    status: Literal["draft", "active"] | None = None


class ProjectUpdate(CamelModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    product_type: str | None = Field(default=None, max_length=50)
    target_market: str | None = Field(default=None, max_length=200)
    target_audience: str | None = None
    pricing_model: str | None = Field(default=None, max_length=100)
    competitors: list[str] | None = None
    status: Literal["draft", "active", "archived"] | None = None


class ProjectRead(TimestampMixin):
    name: str
    description: str | None
    product_type: str | None
    target_market: str | None
    target_audience: str | None
    pricing_model: str | None
    competitors: list[str]
    status: str
