"""StudyCraft AI — FastAPI application entrypoint."""
from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.config import get_settings
from app.routers import generate, health

logging.basicConfig(level=logging.INFO)

settings = get_settings()

app = FastAPI(
    title="StudyCraft AI API",
    version=__version__,
    description="Transform study material into customized learning assets using "
    "local open-weight LLMs (Ollama / vLLM) with an offline mock mode.",
)

# A wildcard origin ("*") cannot be combined with credentials per the CORS spec,
# so disable credentials in that case to keep browsers happy.
_origins = settings.cors_origin_list
_allow_wildcard = _origins == ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=not _allow_wildcard,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(generate.router)


@app.get("/")
async def root() -> dict:
    return {
        "name": "StudyCraft AI API",
        "version": __version__,
        "docs": "/docs",
        "provider": settings.llm_provider,
    }
