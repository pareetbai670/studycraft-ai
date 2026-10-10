"""Application configuration loaded from environment variables."""
from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central settings object. Values can be overridden via a `.env` file."""

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # Provider: "ollama" | "vllm" | "mock"
    llm_provider: str = "mock"

    # Ollama
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.2"

    # vLLM / OpenAI-compatible
    vllm_base_url: str = "http://localhost:8000/v1"
    vllm_model: str = "google/gemma-2-9b-it"
    vllm_api_key: str = "not-needed"

    # Tuning
    llm_temperature: float = 0.4
    llm_timeout_seconds: int = 180
    llm_max_retries: int = 2

    # CORS
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
