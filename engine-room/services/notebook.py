"""Official Gemini Notebook Enterprise API client.

The API is currently v1alpha/Preview. Configuration is explicit so personal
NotebookLM accounts are never driven through brittle browser automation.
"""

from __future__ import annotations

import os
from dataclasses import dataclass

import httpx


@dataclass(frozen=True)
class NotebookConfig:
    project_number: str
    location: str
    endpoint_location: str

    @property
    def api_base(self) -> str:
        return (
            f"https://{self.endpoint_location}-discoveryengine.googleapis.com/"
            f"v1alpha/projects/{self.project_number}/locations/{self.location}"
        )


def get_config() -> NotebookConfig | None:
    project_number = os.environ.get("NOTEBOOKLM_PROJECT_NUMBER", "").strip()
    if not project_number:
        return None
    location = os.environ.get("NOTEBOOKLM_LOCATION", "global").strip() or "global"
    endpoint = (
        os.environ.get("NOTEBOOKLM_ENDPOINT_LOCATION", location).strip() or location
    )
    if endpoint not in {"us", "eu", "global"}:
        raise RuntimeError(
            "NOTEBOOKLM_ENDPOINT_LOCATION must be one of: us, eu, global"
        )
    return NotebookConfig(project_number, location, endpoint)


async def create_notebook(access_token: str, title: str) -> dict:
    config = _require_config()
    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(
            f"{config.api_base}/notebooks",
            headers=_headers(access_token),
            json={"title": title},
        )
        response.raise_for_status()
        return response.json()


async def add_youtube_source(
    access_token: str,
    notebook_id: str,
    youtube_url: str,
) -> dict:
    config = _require_config()
    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(
            f"{config.api_base}/notebooks/{notebook_id}/sources:batchCreate",
            headers=_headers(access_token),
            json={
                "userContents": [
                    {"videoContent": {"youtubeUrl": youtube_url}}
                ]
            },
        )
        response.raise_for_status()
        return response.json()


def notebook_url(notebook_id: str) -> str:
    config = _require_config()
    return (
        f"https://notebook.cloud.google.com/{config.location}/notebook/"
        f"{notebook_id}?project={config.project_number}"
    )


def _require_config() -> NotebookConfig:
    config = get_config()
    if config is None:
        raise RuntimeError("Gemini Notebook Enterprise is not configured")
    return config


def _headers(access_token: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }
