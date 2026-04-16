import pytest
from httpx import AsyncClient


async def _create_project_and_scenario(client: AsyncClient) -> tuple[str, str]:
    project_resp = await client.post("/api/projects", json={"name": "Run Test Project"})
    project_id = project_resp.json()["id"]
    scenario_resp = await client.post(
        f"/api/projects/{project_id}/scenarios",
        json={"name": "Run Test Scenario"},
    )
    return project_id, scenario_resp.json()["id"]


@pytest.mark.asyncio
async def test_create_run(client: AsyncClient):
    _, scenario_id = await _create_project_and_scenario(client)
    resp = await client.post(f"/api/scenarios/{scenario_id}/runs", json={})
    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == "pending"
    assert data["scenarioId"] == scenario_id


@pytest.mark.asyncio
async def test_list_runs_by_scenario(client: AsyncClient):
    _, scenario_id = await _create_project_and_scenario(client)
    await client.post(f"/api/scenarios/{scenario_id}/runs", json={})
    await client.post(f"/api/scenarios/{scenario_id}/runs", json={})

    resp = await client.get(f"/api/scenarios/{scenario_id}/runs")
    assert resp.status_code == 200
    assert resp.json()["total"] == 2


@pytest.mark.asyncio
async def test_get_run_by_id(client: AsyncClient):
    _, scenario_id = await _create_project_and_scenario(client)
    create_resp = await client.post(f"/api/scenarios/{scenario_id}/runs", json={})
    run_id = create_resp.json()["id"]

    resp = await client.get(f"/api/runs/{run_id}")
    assert resp.status_code == 200
    assert resp.json()["status"] == "pending"


@pytest.mark.asyncio
async def test_status_transition_pending_to_running(client: AsyncClient):
    _, scenario_id = await _create_project_and_scenario(client)
    create_resp = await client.post(f"/api/scenarios/{scenario_id}/runs", json={})
    run_id = create_resp.json()["id"]

    resp = await client.patch(
        f"/api/runs/{run_id}",
        json={"status": "running", "startedAt": "2026-01-01T00:00:00Z"},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "running"


@pytest.mark.asyncio
async def test_status_transition_running_to_completed(client: AsyncClient):
    _, scenario_id = await _create_project_and_scenario(client)
    create_resp = await client.post(f"/api/scenarios/{scenario_id}/runs", json={})
    run_id = create_resp.json()["id"]

    await client.patch(f"/api/runs/{run_id}", json={"status": "running"})
    resp = await client.patch(
        f"/api/runs/{run_id}",
        json={"status": "completed", "completedAt": "2026-01-01T01:00:00Z"},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "completed"


@pytest.mark.asyncio
async def test_status_transition_running_to_failed(client: AsyncClient):
    _, scenario_id = await _create_project_and_scenario(client)
    create_resp = await client.post(f"/api/scenarios/{scenario_id}/runs", json={})
    run_id = create_resp.json()["id"]

    await client.patch(f"/api/runs/{run_id}", json={"status": "running"})
    resp = await client.patch(
        f"/api/runs/{run_id}",
        json={
            "status": "failed",
            "resultSummary": {"error": "LLM quota exceeded"},
        },
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "failed"


@pytest.mark.asyncio
async def test_invalid_status_transition_returns_409(client: AsyncClient):
    _, scenario_id = await _create_project_and_scenario(client)
    create_resp = await client.post(f"/api/scenarios/{scenario_id}/runs", json={})
    run_id = create_resp.json()["id"]

    # pending -> running -> completed
    await client.patch(f"/api/runs/{run_id}", json={"status": "running"})
    await client.patch(f"/api/runs/{run_id}", json={"status": "completed"})

    # completed -> pending is invalid
    resp = await client.patch(f"/api/runs/{run_id}", json={"status": "running"})
    assert resp.status_code == 409
    assert "Invalid status transition" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_create_run_nonexistent_scenario(client: AsyncClient):
    resp = await client.post(
        "/api/scenarios/00000000-0000-0000-0000-000000000000/runs", json={}
    )
    assert resp.status_code == 404
