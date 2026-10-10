"""Generation and file-extraction endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, File, UploadFile

from app.config import Settings, get_settings
from app.models.schemas import GenerateRequest, GenerateResponse
from app.services.generator import Generator
from app.utils.extract import extract_text

router = APIRouter(prefix="/api", tags=["generate"])


@router.post("/generate", response_model=GenerateResponse)
async def generate_asset(
    req: GenerateRequest,
    settings: Settings = Depends(get_settings),
) -> GenerateResponse:
    """Generate a learning asset from study material."""
    generator = Generator(settings)
    return await generator.generate(req)


@router.post("/extract")
async def extract_file(file: UploadFile = File(...)) -> dict:
    """Extract raw text from an uploaded .txt, .md, or .pdf file."""
    text = await extract_text(file)
    return {"filename": file.filename, "characters": len(text), "content": text}
