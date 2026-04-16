from app.schemas.common import CamelModel


class AICompleteCompletions(CamelModel):
    description: str | None = None
    target_market: str | None = None
    target_audience: str | None = None
    pricing_model: str | None = None
    competitors: list[str] | None = None


class AICompleteMetadata(CamelModel):
    model: str
    fields_completed: list[str]
    fields_skipped: list[str]


class AICompleteResponse(CamelModel):
    completions: AICompleteCompletions
    metadata: AICompleteMetadata
