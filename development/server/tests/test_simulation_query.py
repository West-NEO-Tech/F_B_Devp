from unittest.mock import AsyncMock, patch

import pytest

from app.services.simulation_query_service import (
    fallback_simulation_query,
    generate_simulation_query,
)

_QA_BLOCK = """
### Market Info (Q&A)

- Q: What is your simulation goal?
  A: Validate willingness to pay $15 per booking.
"""


class _Project:
    name = "PetMatch"
    product_type = "Marketplace"
    description = f"Pet sitting marketplace.{_QA_BLOCK}"


class _Scenario:
    agent_depth = "standard"
    agent_count = 81
    market_config = {
        "agent_distribution": {
            "consumer": 50,
            "enterprise_buyer": 15,
            "competitor": 5,
            "investor": 3,
            "supplier": 3,
            "regulator": 2,
            "technical_expert": 2,
            "mentor": 1,
        }
    }


@pytest.mark.asyncio
async def test_generate_simulation_query_uses_llm():
    with patch(
        "app.services.simulation_query_service.chat_completion",
        AsyncMock(return_value="Simulate how pet owners respond to pricing."),
    ):
        text = await generate_simulation_query(_Project(), _Scenario())
    assert "pet owners" in text.lower() or "pricing" in text.lower()


def test_fallback_simulation_query_includes_qa():
    text = fallback_simulation_query(_Project(), _Scenario())
    assert "Pet sitting marketplace" in text
    assert "willingness to pay" in text.lower()
    assert "consumers" in text.lower()
