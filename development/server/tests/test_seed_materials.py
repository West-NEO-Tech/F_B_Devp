import json
from unittest.mock import AsyncMock, MagicMock, patch

import openai
import pytest
from httpx import AsyncClient

MOCK_LLM_RESPONSE = {
    "market_context": {
        "market_size": "$85M",
        "growth_rate": "+12%",
        "key_stats": [{"label": "Households", "value": "3.2M"}],
        "summary": "Growing market.",
    },
    "competitors": [
        {
            "name": "CompA",
            "positioning": "Market leader",
            "strengths": ["Brand"],
            "weaknesses": ["Price"],
        }
    ],
    "consumer_personas": [
        {
            "name": "Urban Pro",
            "emoji": "🏙️",
            "age_range": "25-35",
            "description": "Young professional.",
            "pain_points": ["Trust"],
        }
    ],
    "discussion_topics": [
        {"topic": "Trust", "description": "Key concern.", "relevance": "high"}
    ],
}


def _mock_llm_client() -> MagicMock:
    """Return a mock AsyncOpenAI client that yields MOCK_LLM_RESPONSE."""
    message = MagicMock()
    message.content = json.dumps(MOCK_LLM_RESPONSE)

    choice = MagicMock()
    choice.message = message

    response = MagicMock()
    response.choices = [choice]

    client = MagicMock()
    client.chat.completions.create = AsyncMock(return_value=response)
    return client


async def _create_project_and_scenario(client: AsyncClient) -> tuple[str, str]:
    """Helper: create a project and a scenario, return (project_id, scenario_id)."""
    proj_resp = await client.post(
        "/api/projects", json={"name": "Seed Test Project"}
    )
    project_id = proj_resp.json()["id"]

    scn_resp = await client.post(
        f"/api/projects/{project_id}/scenarios",
        json={"name": "Seed Scenario", "agentDepth": "quick"},
    )
    scenario_id = scn_resp.json()["id"]
    return project_id, scenario_id


@pytest.mark.asyncio
async def test_generate_seed_materials(client: AsyncClient):
    _, scenario_id = await _create_project_and_scenario(client)

    with patch(
        "app.services.seed_builder_service.get_llm_client",
        return_value=_mock_llm_client(),
    ):
        resp = await client.post(
            f"/api/scenarios/{scenario_id}/seed-materials"
        )

    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == "completed"
    assert data["version"] == 1
    assert data["scenarioId"] == scenario_id
    assert data["marketContext"]["market_size"] == "$85M"
    assert len(data["competitors"]) == 1
    assert data["competitors"][0]["name"] == "CompA"
    assert len(data["consumerPersonas"]) == 1
    assert len(data["discussionTopics"]) == 1
    assert data["errorMessage"] is None


@pytest.mark.asyncio
async def test_generate_seed_materials_increments_version(client: AsyncClient):
    _, scenario_id = await _create_project_and_scenario(client)

    with patch(
        "app.services.seed_builder_service.get_llm_client",
        return_value=_mock_llm_client(),
    ):
        resp1 = await client.post(
            f"/api/scenarios/{scenario_id}/seed-materials"
        )
        resp2 = await client.post(
            f"/api/scenarios/{scenario_id}/seed-materials"
        )

    assert resp1.status_code == 201
    assert resp2.status_code == 201
    assert resp1.json()["version"] == 1
    assert resp2.json()["version"] == 2


@pytest.mark.asyncio
async def test_list_seed_materials(client: AsyncClient):
    _, scenario_id = await _create_project_and_scenario(client)

    with patch(
        "app.services.seed_builder_service.get_llm_client",
        return_value=_mock_llm_client(),
    ):
        await client.post(f"/api/scenarios/{scenario_id}/seed-materials")

    resp = await client.get(f"/api/scenarios/{scenario_id}/seed-materials")
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) == 1
    assert items[0]["status"] == "completed"
    assert items[0]["version"] == 1


@pytest.mark.asyncio
async def test_get_seed_material_by_id(client: AsyncClient):
    _, scenario_id = await _create_project_and_scenario(client)

    with patch(
        "app.services.seed_builder_service.get_llm_client",
        return_value=_mock_llm_client(),
    ):
        create_resp = await client.post(
            f"/api/scenarios/{scenario_id}/seed-materials"
        )

    seed_id = create_resp.json()["id"]
    resp = await client.get(f"/api/seed-materials/{seed_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == seed_id
    assert data["status"] == "completed"
    assert data["marketContext"]["growth_rate"] == "+12%"


@pytest.mark.asyncio
async def test_update_seed_material_competitors(client: AsyncClient):
    _, scenario_id = await _create_project_and_scenario(client)

    with patch(
        "app.services.seed_builder_service.get_llm_client",
        return_value=_mock_llm_client(),
    ):
        create_resp = await client.post(
            f"/api/scenarios/{scenario_id}/seed-materials"
        )

    seed_id = create_resp.json()["id"]
    new_competitors = [
        {
            "name": "CompB",
            "positioning": "Budget",
            "strengths": ["Price"],
            "weaknesses": ["Quality"],
        }
    ]
    resp = await client.patch(
        f"/api/seed-materials/{seed_id}",
        json={"competitors": new_competitors},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["competitors"][0]["name"] == "CompB"
    # discussion_topics should remain unchanged
    assert len(data["discussionTopics"]) == 1
    assert data["discussionTopics"][0]["topic"] == "Trust"


@pytest.mark.asyncio
async def test_generate_seed_materials_llm_failure(client: AsyncClient):
    _, scenario_id = await _create_project_and_scenario(client)

    mock_client = MagicMock()
    mock_client.chat.completions.create = AsyncMock(
        side_effect=openai.APITimeoutError(request=MagicMock())
    )

    with patch(
        "app.services.seed_builder_service.get_llm_client",
        return_value=mock_client,
    ):
        resp = await client.post(
            f"/api/scenarios/{scenario_id}/seed-materials"
        )

    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == "failed"
    assert "timed out" in data["errorMessage"].lower()


@pytest.mark.asyncio
async def test_seed_material_not_found(client: AsyncClient):
    fake_id = "00000000-0000-0000-0000-000000000000"
    resp = await client.get(f"/api/seed-materials/{fake_id}")
    assert resp.status_code == 404
