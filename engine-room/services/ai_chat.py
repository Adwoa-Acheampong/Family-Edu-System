"""AI Chat service — OpenRouter primary, Gemini fallback. Persona-normalized.

Includes command routing for /generate commands to trigger curriculum generation.
"""

from __future__ import annotations

import logging
import os
import uuid

import httpx

from models.schemas import ChatRequest, ChatResponse, GenerateCurriculumRequest

logger = logging.getLogger("engine_room.ai_chat")

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

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
        "Be warm, gentle, and reassuring. Use lots of emojis."
    ),
}


def normalize_persona(persona: str, ai_assistant_role: str | None = None) -> str:
    """Map 'The Architect' / role strings → Architect, Adventurer, etc."""
    blob = f"{persona or ''} {ai_assistant_role or ''}".lower()
    if "architect" in blob or "strategic" in blob:
        return "Architect"
    if "master" in blob or "patient companion" in blob:
        return "Master"
    if "analyst" in blob or "tech mentor" in blob:
        return "Analyst"
    if "explorer" in blob or "storyteller" in blob:
        return "Explorer"
    if "adventurer" in blob or "adventure guide" in blob:
        return "Adventurer"
    if "discoverer" in blob or "playmate" in blob:
        return "Discoverer"
    if "seedling" in blob or "nurturer" in blob:
        return "Seedling"
    # Exact key match (already normalized)
    for key in PERSONA_SYSTEM_PROMPTS:
        if key.lower() == (persona or "").strip().lower():
            return key
    return "Architect"


async def chat(request: ChatRequest) -> ChatResponse:
    """Process a chat message with optional command routing.
    
    If the message starts with /generate, route to curriculum generation.
    Otherwise, handle as normal chat.
    """
    conversation_id = request.conversationId or str(uuid.uuid4())
    
    # Check for command interception
    if request.message.strip().startswith("/generate"):
        return await _handle_generate_command(request, conversation_id)
    
    persona_key = normalize_persona(request.persona)
    system_prompt = PERSONA_SYSTEM_PROMPTS.get(
        persona_key,
        "You are a helpful assistant for a family learning platform.",
    )

    openrouter_key = os.environ.get("OPENROUTER_API_KEY")
    if openrouter_key:
        response_text = await _chat_openrouter(
            request.message, system_prompt, persona_key, openrouter_key
        )
    else:
        gemini_key = os.environ.get("GEMINI_API_KEY")
        if gemini_key:
            response_text = await _chat_gemini(request.message, system_prompt, gemini_key)
        else:
            logger.warning("No AI API keys configured")
            response_text = (
                f"Hi! I'm your {persona_key} assistant. "
                "Set OPENROUTER_API_KEY or GEMINI_API_KEY in engine-room/.env for live AI."
            )

    return ChatResponse(
        response=response_text,
        conversationId=conversation_id,
        routed=False,
    )


async def _handle_generate_command(
    request: ChatRequest,
    conversation_id: str,
) -> ChatResponse:
    """Handle /generate command to trigger curriculum generation.
    
    Extracts the certification/topic from the message and returns a structured response.
    """
    # Parse the command: /generate Business Analyst Certification
    message = request.message.strip()
    prompt_text = message.removeprefix("/generate").strip()
    
    if not prompt_text:
        return ChatResponse(
            response="Please specify what you'd like to generate. Example: /generate Business Analyst Certification",
            conversationId=conversation_id,
            routed=True,
            commandResult={"error": "Missing prompt"},
        )
    
    # Import here to avoid circular dependency
    from services.curriculum_generator import generate_curriculum_from_prompt
    
    try:
        gen_request = GenerateCurriculumRequest(
            prompt=prompt_text,
            certificationName=prompt_text,
            persona=request.persona,
        )
        
        result = await generate_curriculum_from_prompt(gen_request)
        
        # Format a summary response for the chat
        curriculum = result.curriculum
        module_summary = "\n".join([
            f"- **{m.title}**: {len(m.topics)} topics ({m.estimatedHours}h)"
            for m in curriculum.modules[:5]
        ])
        if len(curriculum.modules) > 5:
            module_summary += f"\n- ... and {len(curriculum.modules) - 5} more modules"
        
        response_text = (
            f"✅ **Curriculum Generated: {curriculum.certificationName}**\n\n"
            f"**Source Type:** {curriculum.sourceType}\n"
            f"**Total Estimated Hours:** {curriculum.totalEstimatedHours} hours\n\n"
            f"**Modules:**\n{module_summary}\n\n"
            f"The complete curriculum has been generated with:\n"
            f"- Reading guides with key concepts\n"
            f"- Practical real-world projects\n"
            f"- Exam-style quizzes\n"
            f"- Web resources and case studies\n\n"
            f"You can now push this to Google Classroom or start studying!"
        )
        
        return ChatResponse(
            response=response_text,
            conversationId=conversation_id,
            routed=True,
            commandResult={
                "type": "curriculum_generated",
                "curriculum": curriculum.model_dump(),
                "message": result.message,
            },
        )
        
    except Exception as e:
        logger.error("Generate command failed: %s", e)
        return ChatResponse(
            response=f"❌ Failed to generate curriculum: {str(e)}",
            conversationId=conversation_id,
            routed=True,
            commandResult={"error": str(e)},
        )


async def _chat_openrouter(
    message: str, system_prompt: str, persona: str, api_key: str
) -> str:
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
    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        "gemini-2.0-flash:generateContent"
    )
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{url}?key={api_key}",
            headers={"Content-Type": "application/json"},
            json={
                "contents": [
                    {"parts": [{"text": f"{system_prompt}\n\nUser: {message}"}]}
                ],
                "generationConfig": {"maxOutputTokens": 1024},
            },
            timeout=60,
        )
        resp.raise_for_status()
        data = resp.json()
        try:
            return data["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError):
            logger.warning("Unexpected Gemini response: %s", data)
            return "Sorry, I couldn't generate a response at this time."
