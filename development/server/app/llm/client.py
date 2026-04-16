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
