"""Gemini OCR unit tests — no network, no Baidu."""

from __future__ import annotations

import pytest

from services.ocr import _clean_markdown, _guess_mime, _markdown_to_plain, process_bytes


def test_guess_mime_pdf_magic():
    assert _guess_mime("bin", b"%PDF-1.4...") == "application/pdf"


def test_guess_mime_png_ext():
    assert _guess_mime("png", b"xxxx") == "image/png"


def test_clean_markdown_strips_fence_and_bbox():
    raw = "```markdown\n# Title\nbbox: [1, 2, 3, 4]\nHello\n```"
    out = _clean_markdown(raw)
    assert "# Title" in out
    assert "Hello" in out
    assert "bbox" not in out.lower()


def test_markdown_to_plain():
    assert "Hello" in _markdown_to_plain("# Hello\n\n**world**")


@pytest.mark.asyncio
async def test_process_bytes_requires_gemini_key(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    with pytest.raises(RuntimeError, match="GEMINI_API_KEY"):
        await process_bytes(b"\x89PNG\r\n\x1a\n\x00", file_type="png")


@pytest.mark.asyncio
async def test_process_bytes_rejects_empty():
    with pytest.raises(ValueError, match="Empty"):
        await process_bytes(b"", file_type="png")
