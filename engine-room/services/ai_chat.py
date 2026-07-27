"""AI Chat service.

Handles persona-aware AI chat via OpenRouter (primary) or Gemini (fallback).
Injects system prompts based on persona from SYSTEM_DOCUMENTATION §13.
"""

from __future__ import annotations

import logging
import os
import uuid

import httpx

from models.schemas import ChatRequest, ChatResponse

logger = logging.getLogger("engine_room.ai_chat")

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# Persona → OpenRouter model mapping
PERSONA_MODEL_MAP: dict[str, str] = {
    "Architect": "anthropic/claude-3.5-sonnet",
    "Master": "meta-llama/llama-3-70b-instruct",
    "Analyst": "openai/gpt-4o",
    "Explorer": "google/gemini-2.0-flash-001",
    "Discoverer": "google/gemini-2.0-flash-001",
    "Seedling": "google/gemini-2.0-flash-001",
    "Adventurer": "google/gemini-2.0-flash-001",
}


PERSONA_SYSTEM_PROMPTS: dict[str, str] = {
    "Architect": (
        "You are an expert enterprise architecture consultant. "
        "Provide detailed, structured advice on system design, AI integration, "
        "and software architecture. Use industry terminology and cite best practices."
    ),
    "Master": (
        "You are a patient, wise mentor for lifelong learning. "
        "Explain concepts simply but thoroughly. Encourage curiosity. "
        "Focus on practical knowledge: cooking, health, finance, and personal growth."
    ),
    "Analyst": (
        "You are a tech-savvy mentor for an 11-year-old. "
        "Explain coding, data, and technology concepts at an upper-elementary level. "
        "Share interesting facts. Use analogies. Encourage building things."
    ),
    "Explorer": (
        "You are a friendly storyteller for an 8-year-old child. "
        "Use simple words, short sentences, and lots of encouragement. "
        "Talk about science, nature, math, and reading. Be playful and imaginative."
    ),
    "Adventurer": (
        "You are an adventure guide for a 6-year-old child. "
        "Use very simple words, short sentences, and lots of emojis. "
        "Talk about animals, colors, counting, letters, and nature. "
        "Be energetic, positive, and playful. Celebrate every answer."
    ),
    "Discoverer": (
        "You are a fun playmate for a 5-year-old. "
        "Use the simplest words possible, one idea at a time. "
        "Talk about shapes, colors, animals, and phonics. "
        "Use lots of emojis and excitement. Celebrate everything."
    ),
    "Seedling": (
        "You are a gentle nurturer for a 3-year-old. "
        "Use very short phrases, simple words. "
        "Sing nursery rhymes, talk about animals, colors, and everyday things. "
        "Be warm, gentle, and reassuring. Use lots of emojis 🌸"
    ),
}


async def chat(request: ChatRequest) -> ChatResponse:
    """Process a chat message with persona-aware AI.

    Uses OpenRouter by default, falls back to Gemini if OpenRouter key is missing.
    """
    conversation_id = request.conversationId or str(uuid.uuid4())
    system_prompt = PERSONA_SYSTEM_PROMPTS.get(
        request.persona,
        "You are a helpful assistant for a family learning platform.",
    )

    # Prefer OpenRouter
    openrouter_key = os.environ.get("OPENROUTER_API_KEY")
    if openrouter_key:
        response_text = await _chat_openrouter(
            request.message, system_prompt, request.persona, openrouter_key,
        )
    else:
        # Fallback to Gemini
        gemini_key = os.environ.get("GEMINI_API_KEY")
        if gemini_key:
            response_text = await _chat_gemini(
                request.message, system_prompt, gemini_key,
            )
        else:
            logger.warning(
                "No AI API keys configured (OPENROUTER_API_KEY or GEMINI_API_KEY)"
            )
            response_text = (
                f"Hi! I'm your {request.persona} assistant. "
                "I'm not fully configured yet — an API key is needed for AI responses. "
                "Please set OPENROUTER_API_KEY or GEMINI_API_KEY in your .env file."
            )

    return ChatResponse(response=response_text, conversationId=conversation_id)


async def _chat_openrouter(
    message: str,
    system_prompt: str,
    persona: str,
    api_key: str,
) -> str:
    """Call OpenRouter chat completions API."""
    model = PERSONA_MODEL_MAP.get(persona, "openai/gpt-4o")

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            OPENROUTER_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:8000",
            },
            json={
                "model": model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message},
                ],
                "max_tokens": 1024,
            },
            timeout=60,
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]


async def _chat_gemini(message: str, system_prompt: str, api_key: str) -> str:
    """Call Gemini API as fallback."""
    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        "gemini-2.0-flash-001:generateContent"
    )

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{url}?key={api_key}",
            headers={"Content-Type": "application/json"},
            json={
                "contents": [
                    {
                        "parts": [{"text": f"{system_prompt}\n\nUser: {message}"}]
                    }
                ],
                "generationConfig": {
                    "maxOutputTokens": 1024,
                },
            },
            timeout=60,
        )
        resp.raise_for_status()
        data = resp.json()
        try:
            return data["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError):
            logger.warning("Unexpected Gemini response format: %s", data)
            return "Sorry, I couldn't generate a response at this time."