from __future__ import annotations

from pydantic import Field

from app.schemas.common import CamelModel


class MarketQAQuestion(CamelModel):
    id: str = Field(description="Stable question id for deduping/tracking")
    question: str = Field(
        description="Long, contextual question text referencing the user's idea"
    )
    ask_for: list[str] = Field(
        default_factory=list,
        description="2-4 specific sub-items the user must address in their answer",
    )
    why: str | None = Field(default=None, description="Why we need this info")
    example_answer: str | None = Field(
        default=None,
        description="AI-generated sample answer tailored to the idea (all sub-items)",
    )


class MarketQARequest(CamelModel):
    description: str = Field(min_length=1, description="User provided basic description")
    product_type: str = Field(
        default="",
        description="Selected product type; may be empty while user is still on Product Type step",
    )
    # Optional: allow iterating later
    previous_qa: list[dict] | None = None


class MarketQAResponse(CamelModel):
    questions: list[MarketQAQuestion]


class MarketQAExistingQuestion(CamelModel):
    id: str
    question: str = ""


class MarketQAOneRequest(CamelModel):
    description: str = Field(min_length=1)
    product_type: str = ""
    index: int = Field(ge=0, description="0-based question index to generate")
    target_count: int = Field(default=3, ge=1, le=5)
    existing_questions: list[MarketQAExistingQuestion] = Field(default_factory=list)


class MarketQAOneResponse(CamelModel):
    question: MarketQAQuestion
    index: int
    target_count: int

