"""Baidu OCR service.

Downloads a document from Drive, sends it to Baidu OCR API,
and returns extracted text in plain and Markdown formats.
"""

from __future__ import annotations

import base64
import logging
import os

import httpx
from googleapiclient.discovery import Resource

from models.schemas import OCRResponse

logger = logging.getLogger("engine_room.ocr")

_BAIDU_ACCESS_TOKEN_URL = "https://aip.baidubce.com/oauth/2.0/token"
_BAIDU_OCR_URL = "https://aip.baidubce.com/rest/2.0/ocr/v1/accurate_basic"


async def _get_baidu_access_token() -> str:
    """Obtain a Baidu API access token using client credentials."""
    api_key = os.environ.get("BAIDU_API_KEY", "")
    secret_key = os.environ.get("BAIDU_SECRET_KEY", "")

    if not api_key or not secret_key:
        raise RuntimeError("BAIDU_API_KEY and BAIDU_SECRET_KEY must be set")

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            _BAIDU_ACCESS_TOKEN_URL,
            params={
                "grant_type": "client_credentials",
                "client_id": api_key,
                "client_secret": secret_key,
            },
        )
        resp.raise_for_status()
        data = resp.json()
        return data["access_token"]


async def process_document(
    drive: Resource,
    drive_file_id: str,
    file_type: str = "pdf",
) -> OCRResponse:
    """Download a document from Drive, OCR it via Baidu, return text + markdown.

    For PDFs, Baidu requires the image content (first page or pre-rendered).
    For images (jpg, png, bmp), sends the image directly.
    """
    # Download file from Drive (sync googleapiclient call via thread)
    from .drive import download_file as drive_download
    import asyncio
    file_content = await asyncio.to_thread(drive_download, drive, drive_file_id)
    logger.info("Downloaded file %s (%d bytes)", drive_file_id, len(file_content))

    # Baidu OCR expects base64-encoded image data
    image_base64 = base64.b64encode(file_content).decode("utf-8")

    access_token = await _get_baidu_access_token()

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{_BAIDU_OCR_URL}?access_token={access_token}",
            data={
                "image": image_base64,
                "detect_direction": "true",
                "probability": "false",
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        resp.raise_for_status()
        result = resp.json()

    if "error_code" in result:
        raise RuntimeError(
            f"Baidu OCR error {result['error_code']}: {result.get('error_msg', 'unknown')}"
        )

    # Build plain text and markdown from results
    words_results = result.get("words_result", [])
    lines = [item["words"] for item in words_results]

    plain_text = "\n".join(lines)
    markdown_text = "\n\n".join(lines)

    logger.info("OCR completed: %d words extracted from %s", len(lines), drive_file_id)

    return OCRResponse(text=plain_text, markdown=markdown_text)