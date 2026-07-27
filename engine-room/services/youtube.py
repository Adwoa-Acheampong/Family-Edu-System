"""YouTube lesson ingestion helpers."""

from __future__ import annotations

import asyncio
import re
from urllib.parse import parse_qs, urlparse

import httpx

from models.schemas import TranscriptSegment, YouTubeTranscript

_VIDEO_ID = re.compile(r"^[A-Za-z0-9_-]{11}$")


def extract_video_id(value: str) -> str:
    """Extract and validate a YouTube video ID from common URL formats."""
    candidate = value.strip()
    if _VIDEO_ID.fullmatch(candidate):
        return candidate

    parsed = urlparse(candidate)
    host = parsed.netloc.lower().split(":")[0]
    if host.startswith("www."):
        host = host[4:]

    video_id = ""
    if host == "youtu.be":
        video_id = parsed.path.strip("/").split("/")[0]
    elif host in {"youtube.com", "m.youtube.com", "music.youtube.com"}:
        if parsed.path == "/watch":
            video_id = parse_qs(parsed.query).get("v", [""])[0]
        elif parsed.path.startswith(("/shorts/", "/embed/", "/live/")):
            parts = parsed.path.strip("/").split("/")
            video_id = parts[1] if len(parts) > 1 else ""

    if not _VIDEO_ID.fullmatch(video_id):
        raise ValueError("Enter a valid YouTube video URL")
    return video_id


async def fetch_transcript(
    youtube_url: str,
    languages: list[str] | None = None,
) -> YouTubeTranscript:
    """Fetch public captions and lightweight video metadata."""
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
    except ImportError as exc:
        raise RuntimeError(
            "youtube-transcript-api is not installed in the Engine Room"
        ) from exc

    video_id = extract_video_id(youtube_url)
    preferred_languages = languages or ["en"]

    try:
        fetched = await asyncio.to_thread(
            YouTubeTranscriptApi().fetch,
            video_id,
            languages=preferred_languages,
        )
    except Exception as exc:
        raise ValueError(
            "No accessible transcript was found for this YouTube video"
        ) from exc

    segments = [
        TranscriptSegment(
            text=snippet.text,
            start=float(snippet.start),
            duration=float(snippet.duration),
        )
        for snippet in fetched
    ]
    title = await _fetch_title(video_id)
    canonical_url = f"https://www.youtube.com/watch?v={video_id}"

    return YouTubeTranscript(
        videoId=video_id,
        title=title,
        url=canonical_url,
        language=fetched.language,
        languageCode=fetched.language_code,
        isGenerated=bool(fetched.is_generated),
        transcript=" ".join(segment.text for segment in segments),
        segments=segments,
    )


async def _fetch_title(video_id: str) -> str:
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(
                "https://www.youtube.com/oembed",
                params={
                    "url": f"https://www.youtube.com/watch?v={video_id}",
                    "format": "json",
                },
            )
            response.raise_for_status()
            return response.json().get("title") or f"YouTube lesson {video_id}"
    except Exception:
        return f"YouTube lesson {video_id}"
