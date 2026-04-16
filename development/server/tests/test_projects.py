import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_project(client: AsyncClient):
    resp = await client.post("/api/projects", json={"name": "Test Startup"})
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Test Startup"
    assert data["status"] == "active"
    assert "id" in data
    assert "createdAt" in data


@pytest.mark.asyncio
async def test_list_projects_empty(client: AsyncClient):
    resp = await client.get("/api/projects")
    assert resp.status_code == 200
    data = resp.json()
    assert data["items"] == []
    assert data["total"] == 0


@pytest.mark.asyncio
async def test_list_projects_with_pagination(client: AsyncClient):
    # Create two projects
    await client.post("/api/projects", json={"name": "Project A"})
    await client.post("/api/projects", json={"name": "Project B"})

    resp = await client.get("/api/projects", params={"page": 1, "pageSize": 1})
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["items"]) == 1
    assert data["total"] == 2
    assert data["pageSize"] == 1


@pytest.mark.asyncio
async def test_list_projects_filter_by_status(client: AsyncClient):
    resp1 = await client.post("/api/projects", json={"name": "Active One"})
    project_id = resp1.json()["id"]
    await client.patch(f"/api/projects/{project_id}", json={"status": "archived"})

    await client.post("/api/projects", json={"name": "Active Two"})

    resp = await client.get("/api/projects", params={"status": "archived"})
    assert resp.status_code == 200
    data = resp.json()
    assert all(item["status"] == "archived" for item in data["items"])


@pytest.mark.asyncio
async def test_get_project_by_id(client: AsyncClient):
    create_resp = await client.post(
        "/api/projects",
        json={"name": "Get Me", "description": "A test project"},
    )
    project_id = create_resp.json()["id"]

    resp = await client.get(f"/api/projects/{project_id}")
    assert resp.status_code == 200
    assert resp.json()["name"] == "Get Me"
    assert resp.json()["description"] == "A test project"


@pytest.mark.asyncio
async def test_get_project_not_found(client: AsyncClient):
    resp = await client.get("/api/projects/00000000-0000-0000-0000-000000000000")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_update_project(client: AsyncClient):
    create_resp = await client.post("/api/projects", json={"name": "Old Name"})
    project_id = create_resp.json()["id"]

    resp = await client.patch(
        f"/api/projects/{project_id}",
        json={"name": "New Name", "description": "Updated", "status": "archived"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "New Name"
    assert data["description"] == "Updated"
    assert data["status"] == "archived"


@pytest.mark.asyncio
async def test_soft_delete_project(client: AsyncClient):
    create_resp = await client.post("/api/projects", json={"name": "Delete Me"})
    project_id = create_resp.json()["id"]

    del_resp = await client.delete(f"/api/projects/{project_id}")
    assert del_resp.status_code == 204

    get_resp = await client.get(f"/api/projects/{project_id}")
    assert get_resp.status_code == 404


@pytest.mark.asyncio
async def test_create_project_missing_name(client: AsyncClient):
    resp = await client.post("/api/projects", json={})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_create_project_description_too_long(client: AsyncClient):
    resp = await client.post(
        "/api/projects",
        json={"name": "Overflow", "description": "x" * 5001},
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_create_draft_project(client: AsyncClient):
    resp = await client.post(
        "/api/projects", json={"name": "Draft", "status": "draft"}
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == "draft"


@pytest.mark.asyncio
async def test_default_list_excludes_draft(client: AsyncClient):
    await client.post("/api/projects", json={"name": "Active 1"})
    await client.post("/api/projects", json={"name": "Active 2"})
    await client.post("/api/projects", json={"name": "Draft One", "status": "draft"})

    resp = await client.get("/api/projects")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 2
    assert all(item["status"] != "draft" for item in data["items"])


@pytest.mark.asyncio
async def test_list_filter_draft(client: AsyncClient):
    await client.post("/api/projects", json={"name": "Draft One", "status": "draft"})

    resp = await client.get("/api/projects", params={"status": "draft"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 1
    assert data["items"][0]["status"] == "draft"


@pytest.mark.asyncio
async def test_draft_to_active(client: AsyncClient):
    create_resp = await client.post(
        "/api/projects", json={"name": "Draft", "status": "draft"}
    )
    project_id = create_resp.json()["id"]

    resp = await client.patch(
        f"/api/projects/{project_id}", json={"status": "active"}
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "active"


@pytest.mark.asyncio
async def test_active_to_draft_rejected(client: AsyncClient):
    create_resp = await client.post("/api/projects", json={"name": "Active"})
    project_id = create_resp.json()["id"]

    resp = await client.patch(
        f"/api/projects/{project_id}", json={"status": "draft"}
    )
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_archived_to_draft_rejected(client: AsyncClient):
    create_resp = await client.post("/api/projects", json={"name": "Active"})
    project_id = create_resp.json()["id"]

    await client.patch(
        f"/api/projects/{project_id}", json={"status": "archived"}
    )

    resp = await client.patch(
        f"/api/projects/{project_id}", json={"status": "draft"}
    )
    assert resp.status_code == 409
