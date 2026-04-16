import uuid
from datetime import datetime
from typing import Literal

from app.schemas.common import CamelModel, TimestampMixin


class RunCreate(CamelModel):
    pass


class RunStatusUpdate(CamelModel):
    status: Literal["running", "completed", "failed"]
    started_at: datetime | None = None
    completed_at: datetime | None = None
    result_summary: dict | None = None


class RunRead(TimestampMixin):
    scenario_id: uuid.UUID
    status: str
    started_at: datetime | None
    completed_at: datetime | None
    result_summary: dict | None
