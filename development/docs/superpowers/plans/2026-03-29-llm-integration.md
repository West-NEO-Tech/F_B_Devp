# LLM Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace stub AI Complete with real LLM calls via AsyncOpenAI, controlled entirely by environment variables.

**Architecture:** All environments use a single `AsyncOpenAI(base_url=..., api_key=...)` client configured from env vars. Local dev routes through LiteLLM→GitHub Copilot ($0), production routes through OpenRouter. Tests mock `AsyncOpenAI` — no external calls.

**Tech Stack:** Python 3.13, FastAPI, AsyncOpenAI SDK, LiteLLM (dev), pytest + unittest.mock

**Spec:** `specs-archive/004-llm-integration/spec.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `pyproject.toml` | Modify | +`openai` (prod dep), +`litellm` (dev dep) |
| `app/config.py` | Modify | +6 LLM settings with rich comments |
| `app/llm/client.py` | Rewrite | `get_llm_client()` singleton + 4 exception classes |
| `app/llm/__init__.py` | Modify | Export public API |
| `app/llm/prompts.py` | Create | `SYSTEM_PROMPT` + `build_ai_complete_prompt()` |
| `app/services/ai_complete_service.py` | Rewrite | Prompt → LLM call → JSON parse → response |
| `app/main.py` | Modify | +`LLMServiceError` exception handler |
| `.env.example` | Modify | +LLM config block with rich comments |
| `tests/test_ai_complete.py` | Rewrite | 10 tests with mock AsyncOpenAI |
| `README.md` | Modify | +LiteLLM instructions, +LLM env vars |

---

### Task 1: Add Dependencies

**Files:**
- Modify: `pyproject.toml`

- [ ] **Step 1: Add openai to production dependencies**

In `pyproject.toml`, add `"openai>=1.30.0"` to the `dependencies` list:

```toml
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.30.0",
    "sqlalchemy[asyncio]>=2.0.30",
    "asyncpg>=0.29.0",
    "aiosqlite>=0.20.0",
    "alembic>=1.13.0",
    "pydantic-settings>=2.2.0",
    "python-json-logger>=2.0.0",
    "redis>=5.0.0",
    "httpx>=0.27.0",
    "openai>=1.30.0",
]
```

- [ ] **Step 2: Add litellm to dev dependencies**

In `pyproject.toml`, add `"litellm>=1.40.0"` to the `[dependency-groups] dev` list:

```toml
[dependency-groups]
dev = [
    "pytest>=8.0.0",
    "pytest-asyncio>=0.23.0",
    "ruff>=0.4.0",
    "litellm>=1.40.0",
]
```

- [ ] **Step 3: Install dependencies**

Run: `cd development/server && uv sync --dev --no-install-project`
Expected: All dependencies install successfully, including `openai` and `litellm`.

- [ ] **Step 4: Verify openai import**

Run: `cd development/server && uv run python -c "from openai import AsyncOpenAI; print('openai OK')"`
Expected: `openai OK`

- [ ] **Step 5: Verify litellm CLI**

Run: `cd development/server && uv run litellm --help | head -5`
Expected: LiteLLM help output (no error).

- [ ] **Step 6: Commit**

```bash
git add pyproject.toml uv.lock
git commit -m "deps: add openai (prod) and litellm (dev)"
```

---

### Task 2: Add LLM Environment Variables

**Files:**
- Modify: `app/config.py`
- Modify: `.env.example`

- [ ] **Step 1: Add LLM settings to config.py**

Replace the entire contents of `app/config.py` with:

```python
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://bizsim:bizsim_dev@localhost:5432/bizsim"
    redis_url: str = "redis://localhost:6379/0"
    log_level: str = "INFO"
    app_version: str = "0.1.0"
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    # ── LLM Configuration ──────────────────────────────────────────
    # Unified entry point: all environments switch LLM backend via base_url + api_key.
    #   Local dev  → LiteLLM proxying Copilot:  http://localhost:4100/v1
    #   Production → OpenRouter:                 https://openrouter.ai/api/v1
    #   CI/Tests   → Not used (tests mock AsyncOpenAI)
    #
    # When llm_base_url is None (default), the AI Complete endpoint returns 503.
    llm_base_url: str | None = None
    llm_api_key: str = "sk-no-key"
    llm_model: str = "gpt-4o-mini"
    llm_timeout: int = 60
    llm_max_tokens: int = 2000
    llm_temperature: float = 0.7

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()
```

- [ ] **Step 2: Update .env.example with LLM config block**

Replace the entire contents of `.env.example` with:

```env
# BizSim Server Configuration
# Copy this file to .env and fill in the values

# ── Database ────────────────────────────────────────────────────
DATABASE_URL=postgresql+asyncpg://bizsim:bizsim_dev@localhost:5434/bizsim

# ── Redis ───────────────────────────────────────────────────────
REDIS_URL=redis://localhost:6379/0

# ── Application ─────────────────────────────────────────────────
LOG_LEVEL=DEBUG
APP_VERSION=0.1.0
CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]

# ── LLM Unified Entry Point ────────────────────────────────────
# All environments use the same code path — only env vars change.
# No "mode" branches, no feature flags. Just swap the URL and key.
#
# ┌─────────────┬──────────────────────────────────────────────────┐
# │ Environment │ Configuration                                    │
# ├─────────────┼──────────────────────────────────────────────────┤
# │ Local dev   │ LiteLLM → GitHub Copilot ($0)                   │
# │             │   LLM_BASE_URL=http://localhost:4100/v1          │
# │             │   LLM_API_KEY=sk-anything                        │
# │             │   LLM_MODEL=github/gpt-4o-mini                   │
# ├─────────────┼──────────────────────────────────────────────────┤
# │ Production  │ OpenRouter (real billing)                        │
# │             │   LLM_BASE_URL=https://openrouter.ai/api/v1     │
# │             │   LLM_API_KEY=sk-or-v1-your-key-here            │
# │             │   LLM_MODEL=deepseek/deepseek-chat-v3-0324      │
# ├─────────────┼──────────────────────────────────────────────────┤
# │ CI / Tests  │ Not used — tests mock AsyncOpenAI                │
# └─────────────┴──────────────────────────────────────────────────┘
#
# To start LiteLLM proxy for local development:
#   uv run litellm --model github/gpt-4o-mini --port 4000

LLM_BASE_URL=http://localhost:4100/v1
LLM_API_KEY=sk-anything
LLM_MODEL=github/gpt-4o-mini
LLM_TIMEOUT=60
LLM_MAX_TOKENS=2000
LLM_TEMPERATURE=0.7
```

- [ ] **Step 3: Verify config loads correctly**

Run: `cd development/server && uv run python -c "from app.config import settings; print('base_url:', settings.llm_base_url); print('model:', settings.llm_model); print('timeout:', settings.llm_timeout)"`
Expected: `base_url: None` (no .env loaded in this context), `model: gpt-4o-mini`, `timeout: 60`

- [ ] **Step 4: Commit**

```bash
git add app/config.py .env.example
git commit -m "config: add LLM environment variables with rich comments"
```

---

### Task 3: LLM Client and Exception Classes

**Files:**
- Rewrite: `app/llm/client.py`
- Modify: `app/llm/__init__.py`

- [ ] **Step 1: Rewrite app/llm/client.py**

Replace the entire contents of `app/llm/client.py` with:

```python
from openai import AsyncOpenAI

from app.config import settings


class LLMServiceError(Exception):
    """Base exception for LLM-related errors."""

    def __init__(self, detail: str = "LLM service error", status_code: int = 502):
        self.detail = detail
        self.status_code = status_code
        super().__init__(detail)


class LLMNotConfiguredError(LLMServiceError):
    """Raised when LLM_BASE_URL is not set."""

    def __init__(self):
        super().__init__(detail="LLM service not configured", status_code=503)


class LLMTimeoutError(LLMServiceError):
    """Raised when the LLM request exceeds LLM_TIMEOUT."""

    def __init__(self):
        super().__init__(detail="LLM request timed out", status_code=504)


class LLMResponseError(LLMServiceError):
    """Raised when the LLM returns invalid or unparseable response."""

    def __init__(self):
        super().__init__(detail="LLM returned invalid response", status_code=502)


_client: AsyncOpenAI | None = None


def get_llm_client() -> AsyncOpenAI:
    """Return a singleton AsyncOpenAI client configured from environment variables.

    Raises LLMNotConfiguredError if LLM_BASE_URL is not set.
    """
    global _client
    if _client is None:
        if not settings.llm_base_url:
            raise LLMNotConfiguredError()
        _client = AsyncOpenAI(
            base_url=settings.llm_base_url,
            api_key=settings.llm_api_key,
            timeout=settings.llm_timeout,
        )
    return _client


def reset_llm_client() -> None:
    """Reset the singleton client. Used by tests to clear cached state."""
    global _client
    _client = None
```

- [ ] **Step 2: Update app/llm/__init__.py with exports**

Replace the empty `app/llm/__init__.py` with:

```python
from app.llm.client import (
    LLMNotConfiguredError,
    LLMResponseError,
    LLMServiceError,
    LLMTimeoutError,
    get_llm_client,
    reset_llm_client,
)

__all__ = [
    "LLMServiceError",
    "LLMNotConfiguredError",
    "LLMTimeoutError",
    "LLMResponseError",
    "get_llm_client",
    "reset_llm_client",
]
```

- [ ] **Step 3: Verify import works**

Run: `cd development/server && uv run python -c "from app.llm import LLMServiceError, LLMNotConfiguredError, get_llm_client; print('imports OK')"`
Expected: `imports OK`

- [ ] **Step 4: Commit**

```bash
git add app/llm/client.py app/llm/__init__.py
git commit -m "feat: LLM client singleton + custom exception classes"
```

---

### Task 4: Register LLM Exception Handler in main.py

**Files:**
- Modify: `app/main.py`

- [ ] **Step 1: Add LLMServiceError import and exception handler**

In `app/main.py`, add the import at the top (after existing imports):

```python
from app.llm import LLMServiceError
```

Then inside `create_app()`, after the existing `db_exception_handler`, add:

```python
    @application.exception_handler(LLMServiceError)
    async def llm_exception_handler(
        request: Request, exc: LLMServiceError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
        )
```

The final `create_app()` function should have this structure (only showing the exception handlers section):

```python
    @application.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        return JSONResponse(status_code=422, content={"detail": exc.errors()})

    @application.exception_handler(OperationalError)
    async def db_exception_handler(
        request: Request, exc: OperationalError
    ) -> JSONResponse:
        logging.getLogger("bizsim").error("Database error: %s", str(exc))
        return JSONResponse(
            status_code=503,
            content={
                "detail": "Service temporarily unavailable. Please retry later."
            },
        )

    @application.exception_handler(LLMServiceError)
    async def llm_exception_handler(
        request: Request, exc: LLMServiceError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
        )

    return application
```

- [ ] **Step 2: Verify app still starts**

Run: `cd development/server && uv run python -c "from app.main import app; print('app created OK')"`
Expected: `app created OK`

- [ ] **Step 3: Commit**

```bash
git add app/main.py
git commit -m "feat: register LLMServiceError exception handler"
```

---

### Task 5: Prompt Templates

**Files:**
- Create: `app/llm/prompts.py`

- [ ] **Step 1: Create app/llm/prompts.py**

Create the file with the following content:

```python
SYSTEM_PROMPT = (
    "You are a business analyst helping entrepreneurs validate their business ideas. "
    "You analyze market conditions, target audiences, and competitive landscapes. "
    "Always respond in valid JSON format with the exact keys requested. "
    "Do not include any text outside the JSON object."
)

# Map of field names to human-readable descriptions and format hints for the LLM.
FIELD_DESCRIPTIONS: dict[str, str] = {
    "description": "A concise product description (max 500 characters)",
    "target_market": "The primary target market and geographic focus (max 200 characters)",
    "target_audience": "Detailed target audience profile and demographics",
    "pricing_model": "Pricing strategy with specific price points (max 100 characters)",
    "competitors": "A JSON array of 3-5 competitor names with brief descriptions",
}


def build_ai_complete_prompt(
    project_name: str,
    product_type: str | None,
    existing_fields: dict[str, str | list[str]],
    empty_fields: list[str],
) -> str:
    """Build the user prompt for AI Complete.

    Args:
        project_name: The project name (e.g. "PetMatch").
        product_type: The product type (e.g. "Marketplace"), or None.
        existing_fields: Fields that already have values, as context for the LLM.
        empty_fields: Field names (snake_case) that need to be completed.

    Returns:
        A formatted prompt string for the user message.
    """
    lines: list[str] = []

    # Project context
    lines.append(f"Project: {project_name}")
    if product_type:
        lines.append(f"Product Type: {product_type}")
    lines.append("")

    # Existing fields as context
    if existing_fields:
        lines.append("The following fields are already filled (use as context, do NOT repeat them):")
        for field, value in existing_fields.items():
            lines.append(f"  - {field}: {value}")
        lines.append("")

    # Fields to complete
    lines.append("Please complete the following fields. Return a JSON object with these exact keys:")
    lines.append("")
    for field in empty_fields:
        hint = FIELD_DESCRIPTIONS.get(field, field)
        if field == "competitors":
            lines.append(f'  "{field}": {hint}')
        else:
            lines.append(f'  "{field}": "{hint}"')
    lines.append("")
    lines.append("Return ONLY the JSON object, no additional text.")

    return "\n".join(lines)
```

- [ ] **Step 2: Add prompts export to __init__.py**

In `app/llm/__init__.py`, add the import:

```python
from app.llm.prompts import SYSTEM_PROMPT, build_ai_complete_prompt
```

And add to `__all__`:

```python
__all__ = [
    "LLMServiceError",
    "LLMNotConfiguredError",
    "LLMTimeoutError",
    "LLMResponseError",
    "get_llm_client",
    "reset_llm_client",
    "SYSTEM_PROMPT",
    "build_ai_complete_prompt",
]
```

- [ ] **Step 3: Verify import**

Run: `cd development/server && uv run python -c "from app.llm import build_ai_complete_prompt; p = build_ai_complete_prompt('Test', 'SaaS', {'description': 'existing'}, ['target_market']); print(p)"`
Expected: A formatted prompt containing "Project: Test", "Product Type: SaaS", "description: existing", and "target_market".

- [ ] **Step 4: Commit**

```bash
git add app/llm/prompts.py app/llm/__init__.py
git commit -m "feat: AI Complete prompt template with field descriptions"
```

---

### Task 6: Rewrite AI Complete Service

**Files:**
- Rewrite: `app/services/ai_complete_service.py`

- [ ] **Step 1: Rewrite the service**

Replace the entire contents of `app/services/ai_complete_service.py` with:

```python
import json
import logging

import openai

from app.config import settings
from app.llm import (
    LLMResponseError,
    LLMServiceError,
    LLMTimeoutError,
    SYSTEM_PROMPT,
    build_ai_complete_prompt,
    get_llm_client,
)
from app.models.project import Project
from app.schemas.ai_complete import (
    AICompleteCompletions,
    AICompleteMetadata,
    AICompleteResponse,
)

logger = logging.getLogger(__name__)

# Map snake_case field names to camelCase for metadata
_FIELD_CAMEL: dict[str, str] = {
    "description": "description",
    "target_market": "targetMarket",
    "target_audience": "targetAudience",
    "pricing_model": "pricingModel",
    "competitors": "competitors",
}

_COMPLETABLE_FIELDS = list(_FIELD_CAMEL.keys())


def _is_empty(value: object) -> bool:
    """Return True if value is considered empty (None, empty string, empty list)."""
    if value is None:
        return True
    if isinstance(value, str) and value.strip() == "":
        return True
    if isinstance(value, list) and len(value) == 0:
        return True
    return False


def _analyze_fields(project: Project) -> tuple[list[str], dict[str, str | list[str]], list[str]]:
    """Separate completable fields into empty (to fill) and existing (as context).

    Returns:
        (empty_fields, existing_fields, fields_skipped_camel)
    """
    empty_fields: list[str] = []
    existing_fields: dict[str, str | list[str]] = {}
    fields_skipped: list[str] = []

    for field in _COMPLETABLE_FIELDS:
        value = getattr(project, field, None)
        if _is_empty(value):
            empty_fields.append(field)
        else:
            existing_fields[field] = value
            fields_skipped.append(_FIELD_CAMEL[field])

    return empty_fields, existing_fields, fields_skipped


def _build_completions(
    raw: dict, empty_fields: list[str]
) -> tuple[dict[str, str | list[str] | None], list[str], list[str]]:
    """Extract completion values from LLM response JSON.

    Returns:
        (completions_data, fields_completed_camel, fields_skipped_camel)
    For fields present in raw with non-empty values → completed.
    For fields missing from raw or with empty values → skipped.
    """
    completions_data: dict[str, str | list[str] | None] = {}
    fields_completed: list[str] = []
    fields_skipped: list[str] = []

    for field in _COMPLETABLE_FIELDS:
        if field in empty_fields:
            value = raw.get(field)
            if value is not None and value != "" and value != []:
                completions_data[field] = value
                fields_completed.append(_FIELD_CAMEL[field])
            else:
                completions_data[field] = None
                fields_skipped.append(_FIELD_CAMEL[field])
        else:
            completions_data[field] = None

    return completions_data, fields_completed, fields_skipped


async def generate_completions(project: Project) -> AICompleteResponse:
    """Generate AI completions for empty project fields using LLM."""
    name = project.name or "Product"

    # 1. Analyze fields
    empty_fields, existing_fields, already_skipped = _analyze_fields(project)

    # 2. Short-circuit: all fields filled → no LLM call
    if not empty_fields:
        return AICompleteResponse(
            completions=AICompleteCompletions(),
            metadata=AICompleteMetadata(
                model=settings.llm_model,
                fields_completed=[],
                fields_skipped=already_skipped,
            ),
        )

    # 3. Build prompt
    prompt = build_ai_complete_prompt(
        project_name=name,
        product_type=project.product_type,
        existing_fields=existing_fields,
        empty_fields=empty_fields,
    )

    # 4. Call LLM
    try:
        client = get_llm_client()
        response = await client.chat.completions.create(
            model=settings.llm_model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            max_tokens=settings.llm_max_tokens,
            temperature=settings.llm_temperature,
        )
    except openai.APIConnectionError as exc:
        logger.error("LLM connection failed: %s", exc)
        raise LLMServiceError("LLM service unavailable") from exc
    except openai.APITimeoutError as exc:
        logger.error("LLM request timed out: %s", exc)
        raise LLMTimeoutError() from exc
    except openai.APIStatusError as exc:
        logger.error("LLM API error %s: %s", exc.status_code, exc.message)
        raise LLMServiceError(f"LLM error: {exc.status_code}") from exc

    # 5. Parse JSON response
    content = response.choices[0].message.content
    if not content:
        raise LLMResponseError()
    try:
        raw = json.loads(content)
    except json.JSONDecodeError as exc:
        logger.error("LLM returned invalid JSON: %s", content[:200])
        raise LLMResponseError() from exc

    # 6. Build response
    completions_data, fields_completed, parse_skipped = _build_completions(raw, empty_fields)

    return AICompleteResponse(
        completions=AICompleteCompletions(**completions_data),
        metadata=AICompleteMetadata(
            model=settings.llm_model,
            fields_completed=fields_completed,
            fields_skipped=already_skipped + parse_skipped,
        ),
    )
```

- [ ] **Step 2: Verify ruff passes on the service**

Run: `cd development/server && uv run python -m ruff check app/services/ai_complete_service.py`
Expected: No errors (or `All checks passed`).

- [ ] **Step 3: Commit**

```bash
git add app/services/ai_complete_service.py
git commit -m "feat: replace stub AI Complete with real LLM calls"
```

---

### Task 7: Rewrite Tests

**Files:**
- Rewrite: `tests/test_ai_complete.py`
- Modify: `tests/conftest.py` (add fixture for LLM client reset)

- [ ] **Step 1: Add LLM client reset fixture to conftest.py**

In `tests/conftest.py`, add after the existing imports at the top:

```python
from app.llm import reset_llm_client
```

Then add a new fixture after the existing `client` fixture:

```python
@pytest.fixture(autouse=True)
def _reset_llm_client():
    """Reset singleton LLM client before each test to prevent state leakage."""
    reset_llm_client()
    yield
    reset_llm_client()
```

- [ ] **Step 2: Rewrite tests/test_ai_complete.py**

Replace the entire contents of `tests/test_ai_complete.py` with:

```python
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
            ...  # mock_create is the chat.completions.create AsyncMock
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

    with _patch_llm() as mock_get:
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
    assert meta["model"] == "gpt-4o-mini"  # default from settings


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

    # LLM returns only the empty fields
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
    assert c["targetMarket"] is None  # already filled → not completed
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
        # get_llm_client should NOT be called
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

    # Don't patch get_llm_client — let LLMNotConfiguredError propagate
    # (default settings have llm_base_url=None)
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

    # LLM only returns description and target_market, missing others
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

    # Get the actual call args to inspect the prompt
    mock_client = mock_get.return_value
    call_args = mock_client.chat.completions.create.call_args
    messages = call_args.kwargs["messages"]

    # System message exists
    assert messages[0]["role"] == "system"

    # User message contains project context
    user_msg = messages[1]["content"]
    assert "ContextTest" in user_msg
    assert "Marketplace" in user_msg
    assert "An online marketplace for handmade goods" in user_msg

    # User message requests only empty fields
    assert "target_market" in user_msg
    assert "target_audience" in user_msg
    # description is already filled, should NOT be in the "complete these" section
    # (it appears in the context section, not the request section)
```

- [ ] **Step 3: Run all tests**

Run: `cd development/server && uv run python -m pytest tests/test_ai_complete.py -v`
Expected: All 10 tests pass.

- [ ] **Step 4: Run full test suite**

Run: `cd development/server && uv run python -m pytest tests/ -v`
Expected: All tests pass (AI complete tests + other existing tests).

- [ ] **Step 5: Commit**

```bash
git add tests/test_ai_complete.py tests/conftest.py
git commit -m "test: rewrite AI Complete tests with mock LLM (10 test cases)"
```

---

### Task 8: Update README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update README with LLM env vars and LiteLLM instructions**

In `README.md`, update the Environment Variables table to add LLM variables. After the existing `CORS_ORIGINS` row, add:

```
| `LLM_BASE_URL` | `None` | LLM API base URL. `None` = AI Complete returns 503 |
| `LLM_API_KEY` | `sk-no-key` | LLM API key |
| `LLM_MODEL` | `gpt-4o-mini` | Model name for chat completions |
| `LLM_TIMEOUT` | `60` | LLM request timeout in seconds |
| `LLM_MAX_TOKENS` | `2000` | Max tokens for LLM response |
| `LLM_TEMPERATURE` | `0.7` | LLM sampling temperature |
```

Update the API Endpoints table — change the ai-complete description from `AI-assisted field completion (stub)` to `AI-assisted field completion (LLM)`.

Add a new section after "Local Development" and before "Environment Variables":

```markdown
## LLM Setup (Local Development)

AI Complete uses a real LLM via the OpenAI-compatible API. For local development, use LiteLLM to proxy GitHub Copilot (free):

```bash
# Terminal 1: Start LiteLLM proxy
cd business-validation-demo/development/server
uv run litellm --model github/gpt-4o-mini --port 4000

# Terminal 2: Start API server (with LLM env vars in .env)
cd business-validation-demo/development/server
uv run uvicorn app.main:app --reload --port 8000
```

The `.env.example` file has the default local dev configuration. Copy it to `.env`:

```bash
cp .env.example .env
```

Without LLM configuration (`LLM_BASE_URL` not set), AI Complete returns HTTP 503.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add LLM setup instructions and env vars to README"
```

---

### Task 9: Lint and Full Verification

**Files:** All changed files.

- [ ] **Step 1: Run ruff on all code**

Run: `cd development/server && uv run python -m ruff check app/ tests/ seed/`
Expected: No errors.

- [ ] **Step 2: Run full test suite**

Run: `cd development/server && uv run python -m pytest tests/ -v`
Expected: All tests pass.

- [ ] **Step 3: Verify frontend unaffected**

Run: `cd development && pnpm tsc --noEmit`
Expected: No type errors.

- [ ] **Step 4: Final commit (if any ruff fixes were needed)**

```bash
git add -A
git commit -m "chore: lint fixes" --allow-empty
```

- [ ] **Step 5: Squash or push**

Use `superpowers:finishing-a-development-branch` to decide merge strategy.
