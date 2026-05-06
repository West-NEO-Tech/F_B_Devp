from pydantic import model_validator
from pydantic_settings import BaseSettings


def _normalize_database_url(url: str) -> str:
    if url.startswith("postgresql+asyncpg://"):
        return url
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    return url


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://bizsim:bizsim_dev@localhost:5434/bizsim"
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

    @model_validator(mode="after")
    def normalize_env_urls(self):
        # Render injects DATABASE_URL as postgres://...; SQLAlchemy async engine needs asyncpg.
        self.database_url = _normalize_database_url(self.database_url)
        return self


settings = Settings()
