"""Text extraction for uploaded files (.txt, .md, .pdf)."""
from __future__ import annotations

import io

from fastapi import HTTPException, UploadFile

ALLOWED_EXTENSIONS = {".txt", ".md", ".markdown", ".pdf"}
MAX_BYTES = 10 * 1024 * 1024  # 10 MB


def _extension(filename: str) -> str:
    name = (filename or "").lower()
    dot = name.rfind(".")
    return name[dot:] if dot != -1 else ""


async def extract_text(file: UploadFile) -> str:
    ext = _extension(file.filename or "")
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: .txt, .md, .pdf",
        )

    data = await file.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="File too large (max 10 MB).")

    if ext == ".pdf":
        return _extract_pdf(data)
    try:
        return data.decode("utf-8")
    except UnicodeDecodeError:
        return data.decode("latin-1", errors="replace")


def _extract_pdf(data: bytes) -> str:
    try:
        from pypdf import PdfReader
    except ImportError as exc:  # pragma: no cover
        raise HTTPException(
            status_code=500,
            detail="PDF support requires the 'pypdf' package.",
        ) from exc

    try:
        reader = PdfReader(io.BytesIO(data))
        pages = [page.extract_text() or "" for page in reader.pages]
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=f"Could not read PDF: {exc}") from exc

    text = "\n\n".join(p.strip() for p in pages if p.strip())
    if not text.strip():
        raise HTTPException(
            status_code=400,
            detail="No extractable text found (the PDF may be scanned images).",
        )
    return text
