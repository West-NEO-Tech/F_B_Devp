import json
import logging

import openai

from app.config import settings
from app.llm import (
    SYSTEM_PROMPT,
    LLMResponseError,
    LLMServiceError,
    LLMTimeoutError,
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
                # If LLM returned a list of dicts for competitors, extract a string from each
                if field == "competitors" and isinstance(value, list):
                    value = [
                        (v.get("name") or v.get("competitor") or str(v))
                        if isinstance(v, dict)
                        else str(v)
                        for v in value
                    ]
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
    except openai.APITimeoutError as exc:
        logger.error("LLM request timed out: %s", exc)
        raise LLMTimeoutError() from exc
    except openai.APIConnectionError as exc:
        logger.error("LLM connection failed: %s", exc)
        raise LLMServiceError("LLM service unavailable") from exc
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
