"""Lesson ingestion API tests."""

import pytest
from httpx import AsyncClient

from models.schemas import TranscriptSegment, YouTubeTranscript


@pytest.mark.asyncio
async def test_ingest_and_list_lesson(client: AsyncClient, monkeypatch):
    async def fake_transcript(_url, _languages):
        return YouTubeTranscript(
            videoId="dQw4w9WgXcQ",
            title="A useful lesson",
            url="https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            language="English",
            languageCode="en",
            isGenerated=False,
            transcript="A concise transcript.",
            segments=[
                TranscriptSegment(text="A concise transcript.", start=0, duration=2)
            ],
        )

    monkeypatch.setattr("services.youtube.fetch_transcript", fake_transcript)

    response = await client.post(
        "/v1/lessons/ingest",
        json={
            "userId": "aba",
            "persona": "Architect",
            "youtubeUrl": "https://youtu.be/dQw4w9WgXcQ",
            "addToNotebook": False,
        },
    )

    assert response.status_code == 200
    lesson = response.json()["lesson"]
    assert lesson["title"] == "A useful lesson"
    assert lesson["notebookStatus"] == "not_requested"

    listed = await client.get("/v1/lessons", params={"userId": "aba"})
    assert listed.status_code == 200
    assert [item["id"] for item in listed.json()["lessons"]] == [lesson["id"]]
