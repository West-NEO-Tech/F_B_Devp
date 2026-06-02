import uuid
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient

from app.llm import LLMTimeoutError
from app.services.simulation_service import _persona_name_strings, _topic_title_strings

MOCK_LLM_SEED = """{
  "market_context": {"market_size": "$10M", "growth_rate": "+5%", "summary": "Test"},
  "competitors": [{"name": "CompA", "positioning": "Leader"}],
  "consumer_personas": [{"name": "Alex", "emoji": "🧑", "description": "Busy pro"}],
  "discussion_topics": [{"topic": "Pricing", "description": "Important"}]
}"""


def test_persona_and_topic_extractors_return_string_lists():
    personas = [{"name": "Alex", "emoji": "🧑"}, {"name": "  "}, "legacy-string"]
    topics = [{"topic": "Pricing"}, {"topic": "Trust"}]
    assert _persona_name_strings(personas) == ["Alex", "legacy-string"]
    assert _topic_title_strings(topics) == ["Pricing", "Trust"]


async def _seed_completed_material(client: AsyncClient) -> tuple[str, str, str]:
    proj = await client.post(
        "/api/projects",
        json={
            "name": "Sim Project",
            "productType": "SaaS",
            "description": (
                "AI workflow tool for ops teams.\n\n"
                "### Market Info (Q&A)\n\n"
                "- Q: Who is the buyer?\n"
                "  A: VP Operations at mid-market SaaS.\n"
            ),
        },
    )
    project_id = proj.json()["id"]
    scn = await client.post(
        f"/api/projects/{project_id}/scenarios",
        json={
            "name": "Sim Scenario",
            "agentDepth": "quick",
            "marketConfig": {"agent_distribution": {"consumer": 5, "competitor": 2}},
        },
    )
    scenario_id = scn.json()["id"]

    with patch(
        "app.services.seed_builder_service.chat_completion",
        AsyncMock(return_value=MOCK_LLM_SEED),
    ):
        seed_resp = await client.post(f"/api/scenarios/{scenario_id}/seed-materials")

    seed_id = seed_resp.json()["id"]
    return project_id, scenario_id, seed_id


@pytest.mark.asyncio
async def test_start_simulation(client: AsyncClient):
    project_id, scenario_id, seed_id = await _seed_completed_material(client)
    user_id = str(uuid.uuid4())

    resp = await client.post(
        f"/api/scenarios/{scenario_id}/simulation/start",
        json={"userId": user_id, "seedMaterialId": seed_id},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["agentsStatus"] == "ready"
    assert data["scenarioId"] == scenario_id
    assert "runId" in data

    agents_resp = await client.get(f"/api/runs/{data['runId']}/agents")
    assert agents_resp.status_code == 200
    agents_data = agents_resp.json()
    assert agents_data["status"] == "ready"
    assert agents_data["userId"] == user_id
    assert agents_data["seedMaterialId"] == seed_id
    assert agents_data["simConfigType"] == "quick"
    assert agents_data["productType"] == "SaaS"
    assert agents_data["description"] == "AI workflow tool for ops teams."
    assert isinstance(agents_data["consumerPersonas"], list)
    assert isinstance(agents_data["discussionTopics"], list)
    assert agents_data["consumerPersonas"] == ["Alex"]
    assert agents_data["discussionTopics"] == ["Pricing"]
    assert len(agents_data["additionalInformation"]) == 1
    assert agents_data["additionalInformation"][0]["question"] == "Who is the buyer?"
    assert "VP Operations" in agents_data["additionalInformation"][0]["answer"]
    assert "runId" not in agents_data
    assert "agents" not in agents_data
    assert "llmParsed" not in agents_data


@pytest.mark.asyncio
async def test_get_run_agents_input(client: AsyncClient):
    _, scenario_id, seed_id = await _seed_completed_material(client)
    user_id = str(uuid.uuid4())

    start = await client.post(
        f"/api/scenarios/{scenario_id}/simulation/start",
        json={"userId": user_id, "seedMaterialId": seed_id},
    )
    run_id = start.json()["runId"]

    agents_resp = await client.get(f"/api/runs/{run_id}/agents")
    data = agents_resp.json()
    assert data["status"] == "ready"
    assert data["simConfigType"] == "quick"
    assert data["description"]
    assert isinstance(data["additionalInformation"], list)
    assert isinstance(data["consumerPersonas"], list)
    assert isinstance(data["discussionTopics"], list)


@pytest.mark.asyncio
async def test_get_run_agents_empty_personas_and_topics_lists(client: AsyncClient):
    """consumerPersonas and discussionTopics are always JSON arrays."""
    proj = await client.post("/api/projects", json={"name": "Empty Lists", "productType": "SaaS"})
    project_id = proj.json()["id"]
    scn = await client.post(
        f"/api/projects/{project_id}/scenarios",
        json={"name": "S", "agentDepth": "standard"},
    )
    scenario_id = scn.json()["id"]

    empty_seed = """{
      "market_context": {"summary": "x"},
      "competitors": [],
      "consumer_personas": [],
      "discussion_topics": []
    }"""
    with patch(
        "app.services.seed_builder_service.chat_completion",
        AsyncMock(return_value=empty_seed),
    ):
        seed_resp = await client.post(f"/api/scenarios/{scenario_id}/seed-materials")

    seed_id = seed_resp.json()["id"]
    start = await client.post(
        f"/api/scenarios/{scenario_id}/simulation/start",
        json={"userId": str(uuid.uuid4()), "seedMaterialId": seed_id},
    )
    agents = (await client.get(f"/api/runs/{start.json()['runId']}/agents")).json()
    assert agents["consumerPersonas"] == []
    assert agents["discussionTopics"] == []


@pytest.mark.asyncio
async def test_start_simulation_requires_completed_seed(client: AsyncClient):
    proj = await client.post("/api/projects", json={"name": "X", "productType": "Y"})
    scn = await client.post(
        f"/api/projects/{proj.json()['id']}/scenarios",
        json={"name": "S"},
    )
    scenario_id = scn.json()["id"]

    with patch(
        "app.services.seed_builder_service.chat_completion",
        AsyncMock(side_effect=LLMTimeoutError()),
    ):
        seed_resp = await client.post(f"/api/scenarios/{scenario_id}/seed-materials")

    seed_id = seed_resp.json()["id"]
    resp = await client.post(
        f"/api/scenarios/{scenario_id}/simulation/start",
        json={"userId": str(uuid.uuid4()), "seedMaterialId": seed_id},
    )
    assert resp.status_code == 409
