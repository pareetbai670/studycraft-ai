"""Generation orchestrator: prompt -> LLM -> JSON repair -> schema validation.

Implements retry logic and graceful fallback to the mock generator so a request
never hard-fails during a demo. Validates the parsed JSON against the strict
Pydantic schema for the requested asset type.
"""
from __future__ import annotations

import logging

from pydantic import ValidationError

from app.config import Settings
from app.models.schemas import (
    AssetType,
    FlashcardDeck,
    GenerateMeta,
    GenerateRequest,
    GenerateResponse,
    MindMap,
    Quiz,
    Summary,
    Worksheet,
)
from app.prompts.system_prompts import build_system_prompt, build_user_prompt
from app.services.json_repair import JSONRepairError, repair_json
from app.services.llm_client import LLMUnavailableError, OllamaClient, VLLMClient
from app.services.mock_generator import generate_mock

logger = logging.getLogger("studycraft.generator")

VALIDATOR_BY_TYPE = {
    AssetType.quiz: Quiz,
    AssetType.worksheet: Worksheet,
    AssetType.flashcards: FlashcardDeck,
    AssetType.mindmap: MindMap,
    AssetType.summary: Summary,
}


def _validate(asset_type: AssetType, data: dict):
    """Validate parsed JSON against the schema; tolerate a missing `type` field."""
    model = VALIDATOR_BY_TYPE[asset_type]
    data.setdefault("type", asset_type.value)
    return model.model_validate(data)


class Generator:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.provider = settings.llm_provider.lower()
        if self.provider == "ollama":
            self.client = OllamaClient(settings)
            self.model_name = settings.ollama_model
        elif self.provider == "vllm":
            self.client = VLLMClient(settings)
            self.model_name = settings.vllm_model
        else:
            self.client = None
            self.model_name = "mock-generator"

    async def health(self) -> tuple[bool, str]:
        if self.client is None:
            return True, "Mock generator active (no model needed)."
        return await self.client.health()

    async def generate(self, req: GenerateRequest) -> GenerateResponse:
        use_mock = self.client is None or req.force_mock or self.provider == "mock"

        if use_mock:
            data = generate_mock(req)
            asset = _validate(req.asset_type, data)
            return GenerateResponse(
                meta=GenerateMeta(
                    provider="mock",
                    model="mock-generator",
                    asset_type=req.asset_type,
                    mock=True,
                ),
                asset=asset,
            )

        system = build_system_prompt(req.asset_type)
        user = build_user_prompt(
            asset_type=req.asset_type,
            content=req.content,
            difficulty=req.difficulty,
            question_style=req.question_style,
            academic_level=req.academic_level,
            count=req.count,
        )

        last_error: str = ""
        repaired_any = False
        attempts = self.settings.llm_max_retries + 1

        for attempt in range(attempts):
            try:
                raw = await self.client.generate(system, user)
            except LLMUnavailableError as exc:
                # Backend down: fall back to mock so the demo keeps working.
                logger.warning("LLM unavailable (%s); falling back to mock.", exc)
                data = generate_mock(req)
                asset = _validate(req.asset_type, data)
                return GenerateResponse(
                    meta=GenerateMeta(
                        provider=self.provider,
                        model=self.model_name,
                        asset_type=req.asset_type,
                        mock=True,
                        retries=attempt,
                    ),
                    asset=asset,
                )

            try:
                data, repaired = repair_json(raw)
                repaired_any = repaired_any or repaired
                asset = _validate(req.asset_type, data)
                return GenerateResponse(
                    meta=GenerateMeta(
                        provider=self.provider,
                        model=self.model_name,
                        asset_type=req.asset_type,
                        repaired=repaired_any,
                        retries=attempt,
                    ),
                    asset=asset,
                )
            except (JSONRepairError, ValidationError) as exc:
                last_error = str(exc)
                logger.info("Attempt %d/%d failed validation: %s", attempt + 1, attempts, exc)
                # Tighten the instruction for the retry.
                user += (
                    "\n\nYOUR PREVIOUS RESPONSE WAS NOT VALID JSON MATCHING THE SCHEMA. "
                    "Return ONLY the corrected JSON object — no prose, no code fences."
                )

        # All retries exhausted: final fallback to mock.
        logger.warning("All LLM attempts failed (%s); falling back to mock.", last_error)
        data = generate_mock(req)
        asset = _validate(req.asset_type, data)
        return GenerateResponse(
            meta=GenerateMeta(
                provider=self.provider,
                model=self.model_name,
                asset_type=req.asset_type,
                mock=True,
                repaired=repaired_any,
                retries=attempts,
            ),
            asset=asset,
        )
