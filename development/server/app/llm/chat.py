"""Lightweight OpenAI-compatible chat completions via httpx.

The official openai SDK can crash Vercel Python serverless (FUNCTION_INVOCATION_FAILED).
This module uses httpx directly for production reliability.
"""

from __future__ import annotations

import logging

import httpx

from app.config import settings
from app.llm.client import LLMNotConfiguredError, LLMServiceError, LLMTimeoutError

logger = logging.getLogger(__name__)


async def chat_completion(
    *,
    messages: list[dict[str, str]],
    json_mode: bool = True,
    max_tokens: int | None = None,
) -> str:
    """Call an OpenAI-compatible /chat/completions endpoint and return message content."""
    if not settings.llm_base_url:
        raise LLMNotConfiguredError()

    url = f"{settings.llm_base_url.rstrip('/')}/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.llm_api_key}",
        "Content-Type": "application/json",
    }
    base_payload: dict = {
        "model": settings.llm_model,
        "messages": messages,
        "max_tokens": max_tokens if max_tokens is not None else settings.llm_max_tokens,
        "temperature": settings.llm_temperature,
    }

    payloads: list[dict] = []
    if json_mode:
        payloads.append({**base_payload, "response_format": {"type": "json_object"}})
    payloads.append(base_payload)

    last_error: str | None = None
    async with httpx.AsyncClient(timeout=settings.llm_timeout) as client:
        for payload in payloads:
            try:
                response = await client.post(url, headers=headers, json=payload)
            except httpx.TimeoutException as exc:
                logger.error("LLM request timed out: %s", exc)
                raise LLMTimeoutError() from exc
            except httpx.RequestError as exc:
                logger.error("LLM connection failed: %s", exc)
                raise LLMServiceError("LLM service unavailable") from exc

            if response.status_code >= 400:
                last_error = f"{response.status_code}: {response.text[:300]}"
                logger.warning("LLM API error: %s", last_error)
                # Retry without json_mode if provider rejects response_format
                if json_mode and payload is payloads[0] and len(payloads) > 1:
                    continue
                raise LLMServiceError(f"LLM error: {response.status_code}")

            try:
                data = response.json()
                content = data["choices"][0]["message"]["content"]
            except (KeyError, IndexError, TypeError) as exc:
                logger.error("LLM response parse error: %s", response.text[:200])
                raise LLMServiceError("LLM returned invalid response") from exc

            if not content:
                raise LLMServiceError("LLM returned empty response")
            return content

    raise LLMServiceError(last_error or "LLM request failed")
