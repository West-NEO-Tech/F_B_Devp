from pydantic import Field

from app.schemas.common import CamelModel


class EnvTestResponse(CamelModel):
    """Test Env endpoint: persona, goals, constraints, and sample business insights."""

    user_persona: str = Field(description="Target user and market persona")
    business_goal: str = Field(description="Business outcome to achieve in this phase")
    constraints: str = Field(description="Budget, timeline, compliance, and other limits")
    business_insights: list[str] = Field(
        description="Sample commercial takeaways derived from the three inputs (static test data)",
    )
