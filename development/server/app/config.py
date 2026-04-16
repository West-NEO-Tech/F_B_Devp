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
