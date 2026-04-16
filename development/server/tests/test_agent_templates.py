import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_agent_templates_empty(client: AsyncClient):
    resp = await client.get("/api/agent-templates")
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_create_agent_template(client: AsyncClient):
    resp = await client.post(
        "/api/agent-templates",
        json={
            "name": "Custom Agent",
            "role": "analyst",
            "description": "A custom analyst agent",
            "modelTier": "core",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Custom Agent"
    assert data["role"] == "analyst"
    assert data["modelTier"] == "core"


@pytest.mark.asyncio
async def test_get_agent_template_by_id(client: AsyncClient):
    create_resp = await client.post(
        "/api/agent-templates",
        json={"name": "Get Template", "role": "tester"},
    )
    template_id = create_resp.json()["id"]

    resp = await client.get(f"/api/agent-templates/{template_id}")
    assert resp.status_code == 200
    assert resp.json()["name"] == "Get Template"


@pytest.mark.asyncio
async def test_update_agent_template(client: AsyncClient):
    create_resp = await client.post(
        "/api/agent-templates",
        json={"name": "Update Template", "role": "updater"},
    )
    template_id = create_resp.json()["id"]

    resp = await client.patch(
        f"/api/agent-templates/{template_id}",
        json={"name": "Updated Template", "modelTier": "edge"},
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Updated Template"
    assert resp.json()["modelTier"] == "edge"


@pytest.mark.asyncio
async def test_soft_delete_agent_template(client: AsyncClient):
    create_resp = await client.post(
        "/api/agent-templates",
        json={"name": "Delete Template", "role": "deleter"},
    )
    template_id = create_resp.json()["id"]

    del_resp = await client.delete(f"/api/agent-templates/{template_id}")
    assert del_resp.status_code == 204

    get_resp = await client.get(f"/api/agent-templates/{template_id}")
    assert get_resp.status_code == 404


@pytest.mark.asyncio
async def test_list_agent_templates_filter_by_role(client: AsyncClient):
    await client.post(
        "/api/agent-templates",
        json={"name": "Filter A", "role": "filter_role"},
    )
    await client.post(
        "/api/agent-templates",
        json={"name": "Filter B", "role": "other_role"},
    )

    resp = await client.get("/api/agent-templates", params={"role": "filter_role"})
    assert resp.status_code == 200
    data = resp.json()
    assert all(item["role"] == "filter_role" for item in data["items"])
