import json
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient

MOCK_ONE = json.dumps(
    {
        "id": "target_market",
        "question": "Which market will you enter first?",
        "ask_for": ["Geography", "Segment", "Why now"],
        "why": "Need market scope.",
        "example_answer": "US mid-market SaaS first.",
    }
)


@pytest.mark.asyncio
async def test_generate_one_question_endpoint(client: AsyncClient):
    with patch(
        "app.services.market_qa_service.chat_completion",
        AsyncMock(return_value=MOCK_ONE),
    ):
        resp = await client.post(
            "/api/market-qa/questions/one",
            json={
                "description": "AI tool for ops teams.",
                "productType": "SaaS",
                "index": 0,
                "targetCount": 3,
                "existingQuestions": [],
            },
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data["index"] == 0
    assert data["targetCount"] == 3
    assert data["question"]["id"] == "target_market"
    assert data["question"]["askFor"] == []


@pytest.mark.asyncio
async def test_generate_one_avoids_duplicate_ids(client: AsyncClient):
    with patch(
        "app.services.market_qa_service.chat_completion",
        AsyncMock(return_value=MOCK_ONE),
    ):
        resp = await client.post(
            "/api/market-qa/questions/one",
            json={
                "description": "AI tool for ops teams.",
                "productType": "SaaS",
                "index": 1,
                "targetCount": 3,
                "existingQuestions": [
                    {"id": "target_market", "question": "First question?"},
                ],
            },
        )
    assert resp.status_code == 200
    qid = resp.json()["question"]["id"]
    assert qid != "target_market" or qid.endswith("_2")
