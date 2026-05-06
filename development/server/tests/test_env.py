import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_env_returns_demo_payload(client: AsyncClient):
    resp = await client.get("/api/env")
    assert resp.status_code == 200
    data = resp.json()
    assert "userPersona" in data
    assert "businessGoal" in data
    assert "constraints" in data
    assert "businessInsights" in data
    assert isinstance(data["businessInsights"], list)
    assert len(data["businessInsights"]) >= 1
    assert all(isinstance(s, str) for s in data["businessInsights"])
