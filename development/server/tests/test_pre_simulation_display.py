import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_upload_pre_simulation_display(client: AsyncClient):
    proj_resp = await client.post("/api/projects", json={"name": "Upload Test"})
    project_id = proj_resp.json()["id"]
    payload = {"content": {"summary": "Market overview", "agents": {"count": 42}}}

    resp = await client.post(
        f"/api/projects/{project_id}/pre-simulation-display",
        json=payload,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["projectId"] == project_id
    assert data["content"] == payload["content"]
    assert "id" in data
    assert "updatedAt" in data


@pytest.mark.asyncio
async def test_upload_pre_simulation_display_upsert(client: AsyncClient):
    proj_resp = await client.post("/api/projects", json={"name": "Upsert Test"})
    project_id = proj_resp.json()["id"]

    await client.post(
        f"/api/projects/{project_id}/pre-simulation-display",
        json={"content": {"version": 1}},
    )
    resp = await client.post(
        f"/api/projects/{project_id}/pre-simulation-display",
        json={"content": {"version": 2, "note": "updated"}},
    )
    assert resp.status_code == 200
    assert resp.json()["content"] == {"version": 2, "note": "updated"}

    get_resp = await client.get(
        f"/api/projects/{project_id}/pre-simulation-display"
    )
    assert get_resp.status_code == 200
    assert get_resp.json()["content"]["version"] == 2


@pytest.mark.asyncio
async def test_get_pre_simulation_display_not_found(client: AsyncClient):
    proj_resp = await client.post("/api/projects", json={"name": "Empty"})
    project_id = proj_resp.json()["id"]

    resp = await client.get(f"/api/projects/{project_id}/pre-simulation-display")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_upload_pre_simulation_display_project_not_found(client: AsyncClient):
    resp = await client.post(
        "/api/projects/00000000-0000-0000-0000-000000000000/pre-simulation-display",
        json={"content": {"x": 1}},
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_upload_agent_distribution(client: AsyncClient):
    proj_resp = await client.post("/api/projects", json={"name": "Agent Dist"})
    project_id = proj_resp.json()["id"]
    payload = {
        "agents": {
            "consumer": 50,
            "enterprise_buyer": 15,
            "competitor": 5,
        }
    }

    resp = await client.post(
        f"/api/projects/{project_id}/pre-simulation-display/agent-distribution",
        json=payload,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["projectId"] == project_id
    assert data["agents"]["consumer"] == 50
    assert data["total"] == 70
    assert len(data["agentKinds"]) == 3
    assert data["agentKinds"][0]["key"] == "consumer"
    assert data["agentKinds"][0]["label"] == "Consumer"
    assert data["agentKinds"][0]["count"] == 50


@pytest.mark.asyncio
async def test_upload_agent_distribution_upsert(client: AsyncClient):
    proj_resp = await client.post("/api/projects", json={"name": "Agent Upsert"})
    project_id = proj_resp.json()["id"]

    await client.post(
        f"/api/projects/{project_id}/pre-simulation-display",
        json={"content": {"summary": "keep me"}},
    )
    await client.post(
        f"/api/projects/{project_id}/pre-simulation-display/agent-distribution",
        json={"agents": {"consumer": 10}},
    )
    resp = await client.post(
        f"/api/projects/{project_id}/pre-simulation-display/agent-distribution",
        json={"agents": {"investor": 3, "mentor": 1}},
    )
    assert resp.status_code == 200
    assert resp.json()["agents"] == {"investor": 3, "mentor": 1}
    assert resp.json()["total"] == 4

    display = await client.get(f"/api/projects/{project_id}/pre-simulation-display")
    assert display.status_code == 200
    assert display.json()["content"]["summary"] == "keep me"
    assert display.json()["agentDistribution"] == {"investor": 3, "mentor": 1}


@pytest.mark.asyncio
async def test_get_agent_distribution(client: AsyncClient):
    proj_resp = await client.post("/api/projects", json={"name": "Agent Get"})
    project_id = proj_resp.json()["id"]
    await client.post(
        f"/api/projects/{project_id}/pre-simulation-display/agent-distribution",
        json={"agents": {"supplier": 2}},
    )

    resp = await client.get(
        f"/api/projects/{project_id}/pre-simulation-display/agent-distribution"
    )
    assert resp.status_code == 200
    assert resp.json()["agents"]["supplier"] == 2


@pytest.mark.asyncio
async def test_get_agent_distribution_not_found(client: AsyncClient):
    proj_resp = await client.post("/api/projects", json={"name": "No Agents"})
    project_id = proj_resp.json()["id"]

    resp = await client.get(
        f"/api/projects/{project_id}/pre-simulation-display/agent-distribution"
    )
    assert resp.status_code == 404
