"""Clients for local open-weight LLM backends: Ollama and vLLM.

Both expose an async `generate(system, user) -> str` method returning the raw
model text. Ollama uses its native /api/chat endpoint with `format: "json"`
(constrained JSON decoding). vLLM uses the OpenAI-compatible /chat/completions
endpoint with `response_format={"type": "json_object"}`.
"""
from __future__ import annotations

import httpx

from app.config import Settings


class LLMUnavailableError(RuntimeError):
    """Raised when the configured LLM backend cannot be reached."""


class OllamaClient:
    def __init__(self, settings: Settings) -> None:
        self.base_url = settings.ollama_base_url.rstrip("/")
        self.model = settings.ollama_model
        self.temperature = settings.llm_temperature
        self.timeout = settings.llm_timeout_seconds

    async def generate(self, system: str, user: str) -> str:
        payload = {
            "model": self.model,
            "stream": False,
            "format": "json",  # Ollama constrains output to valid JSON.
            "options": {"temperature": self.temperature},
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        }
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(f"{self.base_url}/api/chat", json=payload)
                resp.raise_for_status()
                data = resp.json()
        except httpx.HTTPError as exc:
            raise LLMUnavailableError(f"Ollama request failed: {exc}") from exc
        return data.get("message", {}).get("content", "")

    async def health(self) -> tuple[bool, str]:
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                resp = await client.get(f"{self.base_url}/api/tags")
                resp.raise_for_status()
            return True, "Ollama reachable"
        except httpx.HTTPError as exc:
            return False, f"Ollama unreachable: {exc}"


class VLLMClient:
    def __init__(self, settings: Settings) -> None:
        self.base_url = settings.vllm_base_url.rstrip("/")
        self.model = settings.vllm_model
        self.api_key = settings.vllm_api_key
        self.temperature = settings.llm_temperature
        self.timeout = settings.llm_timeout_seconds

    async def generate(self, system: str, user: str) -> str:
        payload = {
            "model": self.model,
            "temperature": self.temperature,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        }
        headers = {"Authorization": f"Bearer {self.api_key}"}
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(
                    f"{self.base_url}/chat/completions", json=payload, headers=headers
                )
                resp.raise_for_status()
                data = resp.json()
        except httpx.HTTPError as exc:
            raise LLMUnavailableError(f"vLLM request failed: {exc}") from exc
        return data["choices"][0]["message"]["content"]

    async def health(self) -> tuple[bool, str]:
        headers = {"Authorization": f"Bearer {self.api_key}"}
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                resp = await client.get(f"{self.base_url}/models", headers=headers)
                resp.raise_for_status()
            return True, "vLLM reachable"
        except httpx.HTTPError as exc:
            return False, f"vLLM unreachable: {exc}"
