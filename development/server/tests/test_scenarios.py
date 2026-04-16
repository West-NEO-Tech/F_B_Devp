import pytest
from httpx import AsyncClient


async def _create_project(client: AsyncClient) -> str:
    resp = await client.post("/api/projects", json={"name": "Scenario Test Project"})
    return resp.json()["id"]


@pytest.mark.asyncio
async def test_create_scenario(client: AsyncClient):
    project_id = await _create_project(client)
    resp = await client.post(
        f"/api/projects/{project_id}/scenarios",
        json={"name": "Test Scenario", "agentCount": 50, "agentDepth": "quick"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Test Scenario"
    assert data["agentCount"] == 50
    assert data["agentDepth"] == "quick"
    assert data["projectId"] == project_id


@pytest.mark.asyncio
async def test_list_scenarios_by_project(client: AsyncClient):
    project_id = await _create_project(client)
    await client.post(
        f"/api/projects/{project_id}/scenarios",
        json={"name": "Scenario A"},
    )
    await client.post(
        f"/api/projects/{project_id}/scenarios",
        json={"name": "Scenario B"},
    )

    resp = await client.get(f"/api/projects/{project_id}/scenarios")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 2


@pytest.mark.asyncio
async def test_get_scenario_by_id(client: AsyncClient):
    project_id = await _create_project(client)
    create_resp = await client.post(
        f"/api/projects/{project_id}/scenarios",
        json={"name": "Detail Scenario"},
    )
    scenario_id = create_resp.json()["id"]

    resp = await client.get(f"/api/scenarios/{scenario_id}")
    assert resp.status_code == 200
    assert resp.json()["name"] == "Detail Scenario"


@pytest.mark.asyncio
async def test_update_scenario(client: AsyncClient):
    project_id = await _create_project(client)
    create_resp = await client.post(
        f"/api/projects/{project_id}/scenarios",
        json={"name": "Old Scenario"},
    )
    scenario_id = create_resp.json()["id"]

    resp = await client.patch(
        f"/api/scenarios/{scenario_id}",
        json={"name": "New Scenario", "agentDepth": "deep"},
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "New Scenario"
    assert resp.json()["agentDepth"] == "deep"


@pytest.mark.asyncio
async def test_soft_delete_scenario(client: AsyncClient):
    project_id = await _create_project(client)
    create_resp = await client.post(
        f"/api/projects/{project_id}/scenarios",
        json={"name": "Delete Scenario"},
    )
    scenario_id = create_resp.json()["id"]

    del_resp = await client.delete(f"/api/scenarios/{scenario_id}")
    assert del_resp.status_code == 204

    get_resp = await client.get(f"/api/scenarios/{scenario_id}")
    assert get_resp.status_code == 404


@pytest.mark.asyncio
async def test_create_scenario_nonexistent_project(client: AsyncClient):
    resp = await client.post(
        "/api/projects/00000000-0000-0000-0000-000000000000/scenarios",
        json={"name": "Orphan Scenario"},
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_validate_agent_depth_enum(client: AsyncClient):
    project_id = await _create_project(client)
    resp = await client.post(
        f"/api/projects/{project_id}/scenarios",
        json={"name": "Bad Depth", "agentDepth": "invalid"},
    )
    assert resp.status_code == 422
