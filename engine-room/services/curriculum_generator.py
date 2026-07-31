"""Advanced Curriculum Generator Service.

Uses Gemini 1.5 Pro to parse certification materials (text prompts or PDFs)
and generate structured JSON curriculum trees with modules, projects, quizzes,
and web-enriched resources.
"""

from __future__ import annotations

import json
import logging
import os
from typing import Optional

import httpx

from models.schemas import (
    GenerateCurriculumRequest,
    GenerateCurriculumResponse,
    CurriculumTree,
    CurriculumModule,
    ModuleTopic,
    ReadingGuide,
    PracticalProject,
    QuizQuestion,
)

logger = logging.getLogger("engine_room.curriculum_generator")

GEMINI_15_PRO_MODEL = "gemini-1.5-pro"


async def generate_curriculum_from_prompt(
    request: GenerateCurriculumRequest,
) -> GenerateCurriculumResponse:
    """Generate a curriculum from a text prompt using Gemini 1.5 Pro."""
    gemini_key = os.environ.get("GEMINI_API_KEY")
    if not gemini_key:
        raise RuntimeError("GEMINI_API_KEY not configured")

    prompt = request.prompt or f"Create a comprehensive study curriculum for {request.certificationName or 'professional certification'}"
    
    system_instruction = """
You are an expert curriculum designer for professional certifications. Your task is to create comprehensive, 
structured learning paths that prepare students for real-world certification exams and practical application.

For each curriculum, you MUST output valid JSON with this exact structure:
{
    "certificationName": "Name of the certification",
    "sourceType": "text_prompt",
    "sourceDescription": "Description of the source material",
    "modules": [
        {
            "id": "module-1",
            "title": "Module Title",
            "description": "Module description",
            "domain": "Domain/Knowledge Area this maps to",
            "topics": [
                {
                    "id": "topic-1-1",
                    "title": "Topic Title",
                    "description": "Topic description",
                    "readingGuides": [
                        {
                            "title": "Reading Title",
                            "keyConcepts": ["concept1", "concept2"],
                            "pages": "optional page range",
                            "summary": "Brief summary"
                        }
                    ],
                    "practicalProjects": [
                        {
                            "id": "project-1",
                            "title": "Project Title",
                            "description": "What the student will create",
                            "deliverables": ["Deliverable 1", "Deliverable 2"],
                            "rubric": {"Criteria 1": 10, "Criteria 2": 10},
                            "estimatedHours": 5
                        }
                    ],
                    "quizzes": [
                        {
                            "id": "quiz-1",
                            "type": "multiple_choice",
                            "question": "Question text?",
                            "options": ["A", "B", "C", "D"],
                            "correctAnswer": "A",
                            "explanation": "Why A is correct",
                            "points": 1
                        }
                    ],
                    "webResources": [
                        {"title": "Resource Title", "url": "https://example.com"}
                    ],
                    "caseStudies": [
                        {"title": "Case Study Title", "url": "https://example.com", "summary": "Brief summary"}
                    ]
                }
            ],
            "estimatedHours": 10
        }
    ],
    "totalEstimatedHours": 40,
    "metadata": {"version": "1.0", "generatedBy": "Gemini 1.5 Pro"}
}

Key Requirements:
1. Map modules to certification domains/knowledge areas
2. Include practical, real-world projects (not just theory)
3. Create exam-style quizzes (both multiple choice and scenario-based)
4. Provide reading guides with key concepts
5. Design projects that produce actual deliverables (documents, diagrams, analysis)

Make the curriculum comprehensive, practical, and aligned with industry best practices.
"""

    try:
        curriculum_json = await _call_gemini_15_pro(
            system_instruction, prompt, gemini_key
        )
        
        # Parse the JSON response
        curriculum_data = json.loads(curriculum_json)
        
        # Build the curriculum tree from the parsed data
        curriculum_tree = _build_curriculum_tree(curriculum_data)
        
        return GenerateCurriculumResponse(
            curriculum=curriculum_tree,
            classroomSynced=False,
            message=f"Successfully generated curriculum for {curriculum_tree.certificationName}"
        )
        
    except json.JSONDecodeError as e:
        logger.error("Failed to parse curriculum JSON: %s", e)
        raise RuntimeError(f"Invalid JSON response from Gemini: {e}")
    except Exception as e:
        logger.error("Curriculum generation failed: %s", e)
        raise


async def generate_curriculum_from_pdf(
    pdf_content: bytes,
    filename: str,
    request: GenerateCurriculumRequest,
) -> GenerateCurriculumResponse:
    """Generate a curriculum from an uploaded PDF using Gemini 1.5 Pro's vision capabilities."""
    gemini_key = os.environ.get("GEMINI_API_KEY")
    if not gemini_key:
        raise RuntimeError("GEMINI_API_KEY not configured")

    # Encode PDF as base64 for Gemini Vision API
    import base64
    pdf_base64 = base64.b64encode(pdf_content).decode('utf-8')
    
    system_instruction = """
You are analyzing a complete certification guide or textbook (PDF). Your task is to extract 
the entire curriculum structure and present it as a comprehensive learning path.

Analyze the document thoroughly and create a structured JSON curriculum that includes:
1. All major knowledge areas/domains as modules
2. Sub-topics within each domain
3. Key concepts and reading guides for each topic
4. Practical projects based on real-world applications described in the text
5. Exam-style quiz questions covering important concepts
6. Case studies mentioned in the document

Output ONLY valid JSON matching this schema:
{
    "certificationName": "Extract from document title",
    "sourceType": "pdf_upload",
    "sourceDescription": "Brief description of the document",
    "modules": [...],
    "totalEstimatedHours": <sum of all module hours>,
    "metadata": {"documentPages": <estimate>, "version": "1.0"}
}

Be comprehensive - cover ALL knowledge areas in the document. This curriculum will be used 
to prepare students for the actual certification exam and real-world practice.
"""

    user_prompt = f"""
Analyze this PDF document: {filename}

{request.prompt or 'Create a comprehensive curriculum based on this entire document.'}

Ensure you cover all chapters, knowledge areas, and key concepts. Include practical projects 
that would help someone master the material and pass the certification exam.
"""

    try:
        curriculum_json = await _call_gemini_15_pro_with_file(
            system_instruction,
            user_prompt,
            pdf_base64,
            "application/pdf",
            gemini_key,
        )
        
        curriculum_data = json.loads(curriculum_json)
        curriculum_tree = _build_curriculum_tree(curriculum_data)
        
        return GenerateCurriculumResponse(
            curriculum=curriculum_tree,
            classroomSynced=False,
            message=f"Successfully analyzed {filename} and generated curriculum for {curriculum_tree.certificationName}"
        )
        
    except json.JSONDecodeError as e:
        logger.error("Failed to parse curriculum JSON from PDF: %s", e)
        raise RuntimeError(f"Invalid JSON response from Gemini: {e}")
    except Exception as e:
        logger.error("PDF curriculum generation failed: %s", e)
        raise


def _build_curriculum_tree(data: dict) -> CurriculumTree:
    """Convert raw JSON data into a CurriculumTree model."""
    modules = []
    total_hours = 0
    
    for mod_data in data.get("modules", []):
        topics = []
        for topic_data in mod_data.get("topics", []):
            reading_guides = [
                ReadingGuide(**rg) for rg in topic_data.get("readingGuides", [])
            ]
            practical_projects = [
                PracticalProject(**pp) for pp in topic_data.get("practicalProjects", [])
            ]
            quizzes = [
                QuizQuestion(**q) for q in topic_data.get("quizzes", [])
            ]
            
            topic = ModuleTopic(
                id=topic_data.get("id", f"topic-{len(topics)}"),
                title=topic_data.get("title", "Untitled Topic"),
                description=topic_data.get("description", ""),
                readingGuides=reading_guides,
                practicalProjects=practical_projects,
                quizzes=quizzes,
                webResources=topic_data.get("webResources", []),
                caseStudies=topic_data.get("caseStudies", []),
            )
            topics.append(topic)
        
        module = CurriculumModule(
            id=mod_data.get("id", f"module-{len(modules)}"),
            title=mod_data.get("title", "Untitled Module"),
            description=mod_data.get("description", ""),
            domain=mod_data.get("domain"),
            topics=topics,
            estimatedHours=mod_data.get("estimatedHours", 10),
        )
        modules.append(module)
        total_hours += module.estimatedHours
    
    return CurriculumTree(
        certificationName=data.get("certificationName", "Unknown Certification"),
        sourceType=data.get("sourceType", "text_prompt"),
        sourceDescription=data.get("sourceDescription", ""),
        modules=modules,
        totalEstimatedHours=total_hours,
        metadata=data.get("metadata", {}),
    )


async def _call_gemini_15_pro(
    system_instruction: str,
    user_prompt: str,
    api_key: str,
) -> str:
    """Call Gemini 1.5 Pro API for text-only curriculum generation."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_15_PRO_MODEL}:generateContent?key={api_key}",
            headers={"Content-Type": "application/json"},
            json={
                "systemInstruction": {"parts": [{"text": system_instruction}]},
                "contents": [
                    {"parts": [{"text": user_prompt}]}
                ],
                "generationConfig": {
                    "maxOutputTokens": 8192,
                    "response_mime_type": "application/json",
                    "temperature": 0.7,
                },
            },
            timeout=120,
        )
        resp.raise_for_status()
        data = resp.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]


async def _call_gemini_15_pro_with_file(
    system_instruction: str,
    user_prompt: str,
    file_base64: str,
    mime_type: str,
    api_key: str,
) -> str:
    """Call Gemini 1.5 Pro API with a file attachment (for PDF parsing)."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_15_PRO_MODEL}:generateContent?key={api_key}",
            headers={"Content-Type": "application/json"},
            json={
                "systemInstruction": {"parts": [{"text": system_instruction}]},
                "contents": [
                    {
                        "parts": [
                            {"text": user_prompt},
                            {
                                "inline_data": {
                                    "mime_type": mime_type,
                                    "data": file_base64,
                                }
                            },
                        ]
                    }
                ],
                "generationConfig": {
                    "maxOutputTokens": 8192,
                    "response_mime_type": "application/json",
                    "temperature": 0.7,
                },
            },
            timeout=300,  # Longer timeout for large PDFs
        )
        resp.raise_for_status()
        data = resp.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]
