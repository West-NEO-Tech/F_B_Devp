import json
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import openai
import pytest
from httpx import AsyncClient

# Valid JSON that the mock LLM returns for a full completion
_MOCK_LLM_JSON = json.dumps({
    "description": "A pet-sitting marketplace connecting pet owners with trusted sitters.",
    "target_market": "Australian pet owners in metropolitan areas aged 25-45.",
    "target_audience": "Busy professionals who need reliable pet care while traveling.",
    "pricing_model": "Commission-based: 15% service fee per booking.",
    "competitors": ["Mad Paws", "PetCloud", "Rover"],
})


def _make_mock_response(content: str = _MOCK_LLM_JSON) -> MagicMock:
    """Create a mock ChatCompletion response object."""
    choice = MagicMock()
    choice.message.content = content
    response = MagicMock()
    response.choices = [choice]
    return response


def _patch_llm(mock_response=None, side_effect=None):
    """Patch get_llm_client to return a mock AsyncOpenAI client.

    Usage:
        with _patch_llm() as mock_create:
            ...  # mock_create is the patched get_llm_client mock
    """
    if mock_response is None and side_effect is None:
        mock_response = _make_mock_response()

    mock_client = MagicMock()
    mock_create = AsyncMock(return_value=mock_response, side_effect=side_effect)
    mock_client.chat.completions.create = mock_create

    return patch(
        "app.services.ai_complete_service.get_llm_client",
        return_value=mock_client,
    )


@pytest.mark.asyncio
async def test_ai_complete_calls_llm(client: AsyncClient):
    """Empty fields → calls LLM → returns completion values."""
    resp = await client.post(
        "/api/projects",
        json={"name": "PetMatch", "productType": "Marketplace"},
    )
    assert resp.status_code == 201
    project_id = resp.json()["id"]

    with _patch_llm():
        resp = await client.post(f"/api/projects/{project_id}/ai-complete")

    assert resp.status_code == 200
    data = resp.json()
    c = data["completions"]
    assert c["description"] is not None
    assert "pet" in c["description"].lower()
    assert c["targetMarket"] is not None
    assert c["targetAudience"] is not None
    assert c["pricingModel"] is not None
    assert c["competitors"] is not None
    assert len(c["competitors"]) >= 1

    meta = data["metadata"]
    assert "description" in meta["fieldsCompleted"]
    assert meta["model"] == "gpt-4o-mini"


@pytest.mark.asyncio
async def test_ai_complete_skips_filled_fields(client: AsyncClient):
    """Already-filled fields → not in LLM request → completions null."""
    resp = await client.post(
        "/api/projects",
        json={
            "name": "PartialApp",
            "productType": "Mobile App",
            "targetMarket": "Already set market",
        },
    )
    assert resp.status_code == 201
    project_id = resp.json()["id"]

    partial_json = json.dumps({
        "description": "A mobile app for...",
        "target_audience": "Young professionals...",
        "pricing_model": "Freemium...",
        "competitors": ["App A", "App B"],
    })

    with _patch_llm(mock_response=_make_mock_response(partial_json)):
        resp = await client.post(f"/api/projects/{project_id}/ai-complete")

    assert resp.status_code == 200
    data = resp.json()
    c = data["completions"]
    assert c["targetMarket"] is None
    assert c["description"] is not None

    meta = data["metadata"]
    assert "targetMarket" in meta["fieldsSkipped"]
    assert "targetMarket" not in meta["fieldsCompleted"]
    assert "description" in meta["fieldsCompleted"]


@pytest.mark.asyncio
async def test_ai_complete_all_filled_no_llm_call(client: AsyncClient):
    """All fields filled → no LLM call at all."""
    resp = await client.post(
        "/api/projects",
        json={
            "name": "FullProject",
            "productType": "SaaS",
            "description": "Already described",
            "targetMarket": "Existing market",
            "targetAudience": "Existing audience",
            "pricingModel": "Existing pricing",
            "competitors": ["Rival X"],
        },
    )
    assert resp.status_code == 201
    project_id = resp.json()["id"]

    with _patch_llm() as mock_get:
        resp = await client.post(f"/api/projects/{project_id}/ai-complete")
        mock_get.assert_not_called()

    assert resp.status_code == 200
    data = resp.json()
    c = data["completions"]
    assert c["description"] is None
    assert c["targetMarket"] is None
    assert c["targetAudience"] is None
    assert c["pricingModel"] is None
    assert c["competitors"] is None

    meta = data["metadata"]
    assert meta["fieldsCompleted"] == []
    assert set(meta["fieldsSkipped"]) == {
        "description",
        "targetMarket",
        "targetAudience",
        "pricingModel",
        "competitors",
    }


@pytest.mark.asyncio
async def test_ai_complete_not_found(client: AsyncClient):
    """Non-existent project → 404."""
    fake_id = str(uuid.uuid4())
    resp = await client.post(f"/api/projects/{fake_id}/ai-complete")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_ai_complete_llm_unavailable(client: AsyncClient):
    """LLM connection error → HTTP 502."""
    resp = await client.post(
        "/api/projects",
        json={"name": "ErrorTest", "productType": "SaaS"},
    )
    assert resp.status_code == 201
    project_id = resp.json()["id"]

    error = openai.APIConnectionError(request=MagicMock())
    with _patch_llm(side_effect=error):
        resp = await client.post(f"/api/projects/{project_id}/ai-complete")

    assert resp.status_code == 502
    assert resp.json()["detail"] == "LLM service unavailable"


@pytest.mark.asyncio
async def test_ai_complete_llm_timeout(client: AsyncClient):
    """LLM timeout → HTTP 504."""
    resp = await client.post(
        "/api/projects",
        json={"name": "TimeoutTest", "productType": "SaaS"},
    )
    assert resp.status_code == 201
    project_id = resp.json()["id"]

    error = openai.APITimeoutError(request=MagicMock())
    with _patch_llm(side_effect=error):
        resp = await client.post(f"/api/projects/{project_id}/ai-complete")

    assert resp.status_code == 504
    assert resp.json()["detail"] == "LLM request timed out"


@pytest.mark.asyncio
async def test_ai_complete_llm_bad_json(client: AsyncClient):
    """LLM returns non-JSON → HTTP 502."""
    resp = await client.post(
        "/api/projects",
        json={"name": "BadJsonTest", "productType": "SaaS"},
    )
    assert resp.status_code == 201
    project_id = resp.json()["id"]

    with _patch_llm(mock_response=_make_mock_response("This is not JSON at all")):
        resp = await client.post(f"/api/projects/{project_id}/ai-complete")

    assert resp.status_code == 502
    assert resp.json()["detail"] == "LLM returned invalid response"


@pytest.mark.asyncio
async def test_ai_complete_llm_not_configured(client: AsyncClient):
    """LLM_BASE_URL not set → HTTP 503."""
    resp = await client.post(
        "/api/projects",
        json={"name": "NoConfigTest", "productType": "SaaS"},
    )
    assert resp.status_code == 201
    project_id = resp.json()["id"]

    with patch("app.services.ai_complete_service.settings.llm_base_url", None):
        resp = await client.post(f"/api/projects/{project_id}/ai-complete")
    assert resp.status_code == 503
    assert resp.json()["detail"] == "LLM service not configured"


@pytest.mark.asyncio
async def test_ai_complete_partial_llm_response(client: AsyncClient):
    """LLM returns only some fields → missing ones are null in completions."""
    resp = await client.post(
        "/api/projects",
        json={"name": "PartialLLM", "productType": "SaaS"},
    )
    assert resp.status_code == 201
    project_id = resp.json()["id"]

    partial = json.dumps({
        "description": "A great SaaS product.",
        "target_market": "Enterprise customers.",
    })

    with _patch_llm(mock_response=_make_mock_response(partial)):
        resp = await client.post(f"/api/projects/{project_id}/ai-complete")

    assert resp.status_code == 200
    data = resp.json()
    c = data["completions"]
    assert c["description"] == "A great SaaS product."
    assert c["targetMarket"] == "Enterprise customers."
    assert c["targetAudience"] is None
    assert c["pricingModel"] is None
    assert c["competitors"] is None

    meta = data["metadata"]
    assert "description" in meta["fieldsCompleted"]
    assert "targetMarket" in meta["fieldsCompleted"]
    assert "targetAudience" in meta["fieldsSkipped"]
    assert "pricingModel" in meta["fieldsSkipped"]
    assert "competitors" in meta["fieldsSkipped"]


@pytest.mark.asyncio
async def test_ai_complete_prompt_includes_context(client: AsyncClient):
    """Verify the prompt sent to LLM includes existing fields as context."""
    resp = await client.post(
        "/api/projects",
        json={
            "name": "ContextTest",
            "productType": "Marketplace",
            "description": "An online marketplace for handmade goods",
        },
    )
    assert resp.status_code == 201
    project_id = resp.json()["id"]

    with _patch_llm() as mock_get:
        resp = await client.post(f"/api/projects/{project_id}/ai-complete")

    assert resp.status_code == 200

    mock_client = mock_get.return_value
    call_args = mock_client.chat.completions.create.call_args
    messages = call_args.kwargs["messages"]

    assert messages[0]["role"] == "system"

    user_msg = messages[1]["content"]
    assert "ContextTest" in user_msg
    assert "Marketplace" in user_msg
    assert "An online marketplace for handmade goods" in user_msg
    assert "target_market" in user_msg
    assert "target_audience" in user_msg
