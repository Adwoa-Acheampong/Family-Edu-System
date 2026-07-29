"""Gemini Vision OCR service.

Downloads a document from Drive (or accepts raw bytes) and extracts text via
Gemini multimodal (gemini-2.0-flash / gemini-2.5-flash). Returns plain text and
clean Markdown — no Baidu dependencies.
"""

from __future__ import annotations

import asyncio
import base64
import logging
import os
import re
from typing import Optional

import httpx
from googleapiclient.discovery import Resource

from models.schemas import OCRResponse

logger = logging.getLogger("engine_room.ocr")

# Prefer 2.5-flash; fall back model name if the API rejects it at runtime via second attempt.
_DEFAULT_MODEL = os.environ.get("GEMINI_OCR_MODEL", "gemini-2.0-flash")
_GEMINI_GENERATE_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "{model}:generateContent"
)

_OCR_INSTRUCTION = (
    "Extract and return all text from this image or document accurately. "
    "Format the output as clean Markdown, preserving headings, lists, tables, "
    "and structural layout where applicable.\n\n"
    "Rules:\n"
    "- Return ONLY the extracted content as Markdown.\n"
    "- Do not add commentary, preambles, or code fences around the whole document.\n"
    "- Do not include bounding boxes, coordinates, confidence scores, or raw markup tokens.\n"
)

_MIME_BY_EXT = {
    "pdf": "application/pdf",
    "png": "image/png",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "webp": "image/webp",
    "gif": "image/gif",
    "bmp": "image/bmp",
    "tif": "image/tiff",
    "tiff": "image/tiff",
}


def _gemini_api_key() -> str:
    key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not key:
        raise RuntimeError(
            "GEMINI_API_KEY must be set for OCR. "
            "Add it to engine-room/.env (https://aistudio.google.com/apikey)."
        )
    return key


def _guess_mime(file_type: str, content: bytes) -> str:
    ft = (file_type or "").lower().lstrip(".")
    if ft in _MIME_BY_EXT:
        return _MIME_BY_EXT[ft]
    # Magic bytes
    if content[:4] == b"%PDF":
        return "application/pdf"
    if content[:8] == b"\x89PNG\r\n\x1a\n":
        return "image/png"
    if content[:2] == b"\xff\xd8":
        return "image/jpeg"
    if content[:4] == b"RIFF" and content[8:12] == b"WEBP":
        return "image/webp"
    return "application/octet-stream"


def _clean_markdown(raw: str) -> str:
    """Strip fences, bounding-box noise, and excess blank lines."""
    text = (raw or "").strip()
    # Unwrap single outer ```markdown ... ``` block if present
    fence = re.match(r"^```(?:markdown|md)?\s*\n([\s\S]*?)\n```\s*$", text, re.I)
    if fence:
        text = fence.group(1).strip()
    # Drop lines that look like bbox / confidence dumps
    cleaned_lines: list[str] = []
    for line in text.splitlines():
        if re.search(r"bounding[_\s]?box|bbox\s*[:=]|confidence\s*[:=]\s*0?\.\d+", line, re.I):
            continue
        if re.match(r"^\s*\[\s*\d+(?:\.\d+)?\s*,\s*\d+", line):
            continue
        cleaned_lines.append(line)
    text = "\n".join(cleaned_lines)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    return text


def _markdown_to_plain(md: str) -> str:
    plain = re.sub(r"[#>*_`\[\]()]", "", md)
    plain = re.sub(r"\n{3,}", "\n\n", plain)
    return plain.strip()


async def _call_gemini_vision(
    content: bytes,
    mime_type: str,
    *,
    model: Optional[str] = None,
) -> str:
    api_key = _gemini_api_key()
    model_name = model or _DEFAULT_MODEL
    url = _GEMINI_GENERATE_URL.format(model=model_name)

    # Gemini inlineData has practical size limits; still send full payload and let API error if oversized.
    b64 = base64.b64encode(content).decode("ascii")

    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [
                    {"text": _OCR_INSTRUCTION},
                    {
                        "inlineData": {
                            "mimeType": mime_type,
                            "data": b64,
                        }
                    },
                ],
            }
        ],
        "generationConfig": {
            "temperature": 0.1,
            "maxOutputTokens": 8192,
        },
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(
            f"{url}?key={api_key}",
            headers={"Content-Type": "application/json"},
            json=payload,
        )

        # Retry once with alternate flash model if not found
        if resp.status_code == 404 and model is None and model_name != "gemini-2.5-flash":
            logger.warning("Model %s not available; retrying gemini-2.5-flash", model_name)
            return await _call_gemini_vision(content, mime_type, model="gemini-2.5-flash")
        if resp.status_code == 404 and model is None and model_name != "gemini-2.0-flash":
            logger.warning("Model %s not available; retrying gemini-2.0-flash", model_name)
            return await _call_gemini_vision(content, mime_type, model="gemini-2.0-flash")

        if resp.status_code >= 400:
            detail = resp.text[:500]
            logger.error("Gemini OCR HTTP %s: %s", resp.status_code, detail)
            raise RuntimeError(f"Gemini OCR failed ({resp.status_code}): {detail}")

        data = resp.json()

    try:
        parts = data["candidates"][0]["content"]["parts"]
        texts = [p.get("text", "") for p in parts if isinstance(p, dict)]
        return "\n".join(t for t in texts if t).strip()
    except (KeyError, IndexError, TypeError) as e:
        logger.error("Unexpected Gemini OCR response shape: %s", data)
        raise RuntimeError("Gemini OCR returned an unexpected response") from e


async def process_bytes(
    content: bytes,
    file_type: str = "png",
    mime_type: Optional[str] = None,
) -> OCRResponse:
    """OCR raw image/PDF bytes via Gemini Vision."""
    if not content:
        raise ValueError("Empty file content")

    mime = mime_type or _guess_mime(file_type, content)
    if mime == "application/octet-stream":
        # Default to PNG for unknown images so the API still accepts
        mime = "image/png" if file_type.lower() not in ("pdf",) else "application/pdf"

    logger.info("Gemini OCR: %d bytes as %s", len(content), mime)
    raw = await _call_gemini_vision(content, mime)
    markdown = _clean_markdown(raw)
    plain = _markdown_to_plain(markdown)
    logger.info("OCR completed: %d chars markdown", len(markdown))
    return OCRResponse(text=plain, markdown=markdown)


async def process_document(
    drive: Resource,
    drive_file_id: str,
    file_type: str = "pdf",
) -> OCRResponse:
    """Download a Drive file and OCR it with Gemini Vision.

    Supports multi-page PDFs and common images (PNG, JPEG, WebP, GIF).
    """
    from .drive import download_file as drive_download

    file_content = await asyncio.to_thread(drive_download, drive, drive_file_id)
    logger.info("Downloaded Drive file %s (%d bytes)", drive_file_id, len(file_content))

    # Prefer Drive metadata mime if available
    mime_type: Optional[str] = None
    try:
        meta = await asyncio.to_thread(
            lambda: drive.files()
            .get(fileId=drive_file_id, fields="mimeType,name")
            .execute()
        )
        mime_type = meta.get("mimeType")
        name = meta.get("name") or ""
        if not file_type or file_type == "pdf":
            ext = name.rsplit(".", 1)[-1].lower() if "." in name else file_type
            if ext in _MIME_BY_EXT:
                file_type = ext
    except Exception as e:
        logger.debug("Could not fetch Drive mimeType for %s: %s", drive_file_id, e)

    return await process_bytes(file_content, file_type=file_type, mime_type=mime_type)
