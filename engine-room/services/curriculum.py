"""Curriculum generation service.

Generates study blocks and assignment drafts based on persona and topic.
Uses OpenRouter or Gemini to produce structured learning content.
"""

from __future__ import annotations

import logging
import os
import json
from typing import Optional

import httpx

from models.schemas import CurriculumRequest, CurriculumResponse, StudyMaterial, AssignmentDraft

logger = logging.getLogger("engine_room.curriculum")


async def generate_curriculum(request: CurriculumRequest) -> CurriculumResponse:
    """Generate study materials and an assignment draft for a given persona and topic.

    Uses OpenRouter primary, Gemini fallback.
    """
    system_prompt = (
        f"You are a curriculum designer for a family learning platform. "
        f"Create age-appropriate study materials for a learner with persona '{request.persona}' "
        f"on the topic '{request.topic}'. "
        f"Respond in JSON format with keys: studyMaterials (array of {{type, title, url}}), "
        f"assignment ({{title, description, rubric}}). "
        f"Make the content engaging and appropriate for the persona's age and learning level."
    )

    openrouter_key = os.environ.get("OPENROUTER_API_KEY")
    gemini_key = os.environ.get("GEMINI_API_KEY")

    response_text: Optional[str] = None

    if openrouter_key:
        response_text = await _call_openrouter(system_prompt, request.topic, openrouter_key)
    elif gemini_key:
        response_text = await _call_gemini(system_prompt, request.topic, gemini_key)

    if response_text:
        try:
            data = json.loads(response_text)
            # Clean common LLM wrapping
            if isinstance(data, dict) and "studyMaterials" in data and "assignment" in data:
                materials = [StudyMaterial(**m) for m in data["studyMaterials"]]
                assignment = AssignmentDraft(**data["assignment"])
                return CurriculumResponse(studyMaterials=materials, assignment=assignment)
        except (json.JSONDecodeError, TypeError, ValueError) as e:
            logger.warning("Failed to parse curriculum response as JSON: %s", e)

    # Fallback: return default curriculum
    return CurriculumResponse(
        studyMaterials=[
            StudyMaterial(
                type="article",
                title=f"Introduction to {request.topic}",
                url="https://example.com/intro",
            ),
            StudyMaterial(
                type="video",
                title=f"Learning {request.topic}",
                url="https://example.com/video",
            ),
        ],
        assignment=AssignmentDraft(
            title=f"{request.topic} Assignment",
            description=f"Write a short summary of what you learned about {request.topic}.",
            rubric="Completeness (50%), Creativity (50%)",
        ),
    )


async def _call_openrouter(system_prompt: str, topic: str, api_key: str) -> str:
    """Call OpenRouter for curriculum generation."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:8000",
            },
            json={
                "model": "openai/gpt-4o",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Create a curriculum about {topic}"},
                ],
                "max_tokens": 2048,
                "response_format": {"type": "json_object"},
            },
            timeout=60,
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]


async def _call_gemini(system_prompt: str, topic: str, api_key: str) -> str:
    """Call Gemini API for curriculum generation."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key={api_key}",
            headers={"Content-Type": "application/json"},
            json={
                "contents": [
                    {
                        "parts": [
                            {"text": f"{system_prompt}\n\nTopic: {topic}\n\nGenerate a JSON curriculum."}
                        ]
                    }
                ],
                "generationConfig": {
                    "maxOutputTokens": 2048,
                    "response_mime_type": "application/json",
                },
            },
            timeout=60,
        )
        resp.raise_for_status()
        data = resp.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]