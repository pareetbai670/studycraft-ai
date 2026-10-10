"""Health and configuration endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.config import Settings, get_settings
from app.models.schemas import HealthResponse
from app.services.generator import Generator

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
async def health(settings: Settings = Depends(get_settings)) -> HealthResponse:
    generator = Generator(settings)
    reachable, detail = await generator.health()
    return HealthResponse(
        status="ok",
        provider=generator.provider,
        model=generator.model_name,
        provider_reachable=reachable,
        detail=detail,
    )


@router.get("/api/config")
async def config(settings: Settings = Depends(get_settings)) -> dict:
    """Expose non-secret config so the frontend can show the active provider."""
    return {
        "provider": settings.llm_provider,
        "model": (
            settings.ollama_model
            if settings.llm_provider == "ollama"
            else settings.vllm_model
            if settings.llm_provider == "vllm"
            else "mock-generator"
        ),
        "max_items": 20,
        "min_items": 5,
    }
