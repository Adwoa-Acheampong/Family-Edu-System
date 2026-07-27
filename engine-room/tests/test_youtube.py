"""YouTube URL normalization tests."""

import pytest

from services.youtube import extract_video_id


@pytest.mark.parametrize(
    "value",
    [
        "dQw4w9WgXcQ",
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "https://youtu.be/dQw4w9WgXcQ?t=10",
        "https://www.youtube.com/shorts/dQw4w9WgXcQ",
        "https://www.youtube.com/embed/dQw4w9WgXcQ",
        "https://www.youtube.com/live/dQw4w9WgXcQ",
    ],
)
def test_extract_video_id(value: str):
    assert extract_video_id(value) == "dQw4w9WgXcQ"


def test_extract_video_id_rejects_non_youtube_url():
    with pytest.raises(ValueError, match="valid YouTube"):
        extract_video_id("https://example.com/not-a-video")
