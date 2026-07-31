"""Automated Grading Service.

Evaluates student submissions (quiz responses or project files) against
grading rubrics using Gemini LLM, provides detailed feedback, and pushes
grades back to Google Classroom.
"""

from __future__ import annotations

import json
import logging
import os
from typing import Optional

import httpx

from models.schemas import (
    GradeSubmissionRequest,
    GradeSubmissionResponse,
    GradingFeedback,
)

logger = logging.getLogger("engine_room.grader")

GEMINI_MODEL = "gemini-2.0-flash"


async def grade_submission(
    request: GradeSubmissionRequest,
    rubric: dict[str, int],
    assignment_description: str,
    access_token: Optional[str] = None,
) -> GradeSubmissionResponse:
    """Grade a student submission against a rubric.
    
    Args:
        request: The grading request with submission content
        rubric: Dictionary mapping criteria to max points
        assignment_description: Full description of what was expected
        access_token: Optional Google OAuth token for Classroom sync
    
    Returns:
        GradeSubmissionResponse with score, feedback, and XP earned
    """
    gemini_key = os.environ.get("GEMINI_API_KEY")
    if not gemini_key:
        raise RuntimeError("GEMINI_API_KEY not configured")
    
    # Build the grading prompt
    system_instruction = """
You are an expert educational assessor. Your task is to evaluate student submissions 
fairly and constructively against provided rubrics.

For each submission, you must:
1. Score each rubric criterion objectively (0 to max points)
2. Provide specific, actionable feedback
3. Identify strengths in the student's work
4. Suggest concrete areas for improvement
5. Calculate total score and XP earned

Output ONLY valid JSON with this exact structure:
{
    "score": <total points earned>,
    "maxScore": <total possible points>,
    "feedback": "<overall constructive feedback paragraph>",
    "strengths": ["<strength 1>", "<strength 2>"],
    "areasForImprovement": ["<area 1>", "<area 2>"],
    "xpEarned": <XP points, typically equal to score>,
    "rubricBreakdown": {
        "<criterion 1>": {"earned": X, "max": Y, "comment": "..."},
        "<criterion 2>": {"earned": X, "max": Y, "comment": "..."}
    }
}

Be encouraging but honest. Focus on helping the student learn and improve.
"""

    user_prompt = f"""
Assignment Description:
{assignment_description}

Grading Rubric:
{_format_rubric(rubric)}

Student Submission ({request.submissionType}):
{request.submissionContent}

{f"Attachments referenced: {', '.join(request.attachments)}" if request.attachments else ""}

Evaluate this submission fairly against the rubric. Provide detailed, constructive feedback 
that helps the student understand what they did well and how to improve.
"""

    try:
        response_text = await _call_gemini_for_grading(
            system_instruction, user_prompt, gemini_key
        )
        
        # Parse the JSON response
        grading_data = json.loads(response_text)
        
        # Build the grading feedback object
        feedback = GradingFeedback(
            score=grading_data.get("score", 0),
            maxScore=grading_data.get("maxScore", sum(rubric.values())),
            feedback=grading_data.get("feedback", ""),
            strengths=grading_data.get("strengths", []),
            areasForImprovement=grading_data.get("areasForImprovement", []),
            xpEarned=grading_data.get("xpEarned", grading_data.get("score", 0)),
        )
        
        # TODO: Push grade to Google Classroom if access_token provided
        pushed_to_classroom = False
        if access_token:
            try:
                # This would call classroom.py to update the gradebook
                # pushed_to_classroom = await push_grade_to_classroom(...)
                pushed_to_classroom = False  # Placeholder
            except Exception as e:
                logger.warning("Failed to push grade to Classroom: %s", e)
        
        # TODO: Update XP in database
        xp_updated = False  # Would integrate with frontend dashboard DB
        
        return GradeSubmissionResponse(
            submissionId=request.assignmentId,  # In real impl, generate unique ID
            grading=feedback,
            pushedToClassroom=pushed_to_classroom,
            xpUpdated=xp_updated,
        )
        
    except json.JSONDecodeError as e:
        logger.error("Failed to parse grading JSON: %s", e)
        raise RuntimeError(f"Invalid JSON response from Gemini: {e}")
    except Exception as e:
        logger.error("Grading failed: %s", e)
        raise


async def grade_quiz_submission(
    quiz_questions: list[dict],
    student_answers: dict[str, str],
    assignment_id: str,
    course_id: str,
) -> GradeSubmissionResponse:
    """Grade a multiple-choice or scenario-based quiz submission.
    
    Args:
        quiz_questions: List of quiz questions with correct answers
        student_answers: Dict mapping question IDs to student's selected answers
        assignment_id: The assignment/coursework ID
        course_id: The course ID
    
    Returns:
        GradeSubmissionResponse with score and feedback
    """
    total_points = sum(q.get("points", 1) for q in quiz_questions)
    earned_points = 0
    correct_count = 0
    incorrect_answers = []
    
    for question in quiz_questions:
        q_id = question.get("id")
        student_answer = student_answers.get(q_id, "")
        correct_answer = question.get("correctAnswer", "")
        points = question.get("points", 1)
        explanation = question.get("explanation", "")
        
        if student_answer.upper() == correct_answer.upper():
            earned_points += points
            correct_count += 1
        else:
            incorrect_answers.append({
                "question": question.get("question"),
                "student_answer": student_answer,
                "correct_answer": correct_answer,
                "explanation": explanation,
            })
    
    # Generate feedback
    percentage = (earned_points / total_points * 100) if total_points > 0 else 0
    
    strengths = []
    if correct_count == len(quiz_questions):
        strengths.append("Perfect score! You demonstrated excellent understanding of all concepts.")
    elif correct_count > len(quiz_questions) * 0.8:
        strengths.append("Strong performance - you clearly understand most of the material.")
    elif correct_count > len(quiz_questions) * 0.6:
        strengths.append("Good effort - you have a solid foundation to build on.")
    
    areas_for_improvement = []
    if incorrect_answers:
        areas_for_improvement.append(
            "Review the following concepts where you lost points:\n" +
            "\n".join([f"- {item['question'][:100]}..." for item in incorrect_answers[:3]])
        )
    
    feedback_text = f"You scored {earned_points}/{total_points} ({percentage:.1f}%). "
    if incorrect_answers:
        feedback_text += f"\n\nYou missed {len(incorrect_answers)} questions. "
        feedback_text += "Review the explanations below to understand the correct answers:\n\n"
        for i, item in enumerate(incorrect_answers[:5], 1):
            feedback_text += f"{i}. {item['explanation']}\n"
    
    feedback = GradingFeedback(
        score=earned_points,
        maxScore=total_points,
        feedback=feedback_text,
        strengths=strengths,
        areasForImprovement=areas_for_improvement,
        xpEarned=earned_points,
    )
    
    return GradeSubmissionResponse(
        submissionId=assignment_id,
        grading=feedback,
        pushedToClassroom=False,
        xpUpdated=False,
    )


async def grade_project_submission(
    project_description: str,
    deliverables: list[str],
    rubric: dict[str, int],
    student_submission: str,
    assignment_id: str,
    course_id: str,
) -> GradeSubmissionResponse:
    """Grade a practical project submission using LLM evaluation.
    
    Args:
        project_description: What the student was asked to create
        deliverables: List of expected deliverables
        rubric: Grading criteria with point values
        student_submission: Student's description of what they created
        assignment_id: The assignment ID
        course_id: The course ID
    
    Returns:
        GradeSubmissionResponse with detailed feedback
    """
    request = GradeSubmissionRequest(
        assignmentId=assignment_id,
        courseId=course_id,
        submissionType="project",
        submissionContent=f"""
Project Requirements:
{project_description}

Expected Deliverables:
{chr(10).join(['- ' + d for d in deliverables])}

Student's Submission:
{student_submission}
""",
    )
    
    assignment_desc = f"""
Create a practical project that demonstrates mastery of the topic.

Expected deliverables:
{chr(10).join(['- ' + d for d in deliverables])}

Your submission should be professional-quality and ready for use in a real-world setting.
"""
    
    return await grade_submission(request, rubric, assignment_desc)


def _format_rubric(rubric: dict[str, int]) -> str:
    """Format a rubric dictionary as a readable string."""
    lines = []
    for criterion, max_points in rubric.items():
        lines.append(f"- {criterion}: {max_points} points")
    return "\n".join(lines)


async def _call_gemini_for_grading(
    system_instruction: str,
    user_prompt: str,
    api_key: str,
) -> str:
    """Call Gemini API for grading evaluation."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={api_key}",
            headers={"Content-Type": "application/json"},
            json={
                "systemInstruction": {"parts": [{"text": system_instruction}]},
                "contents": [
                    {"parts": [{"text": user_prompt}]}
                ],
                "generationConfig": {
                    "maxOutputTokens": 2048,
                    "response_mime_type": "application/json",
                    "temperature": 0.3,  # Lower temperature for more consistent grading
                },
            },
            timeout=60,
        )
        resp.raise_for_status()
        data = resp.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]


# Placeholder for future Classroom integration
async def push_grade_to_classroom(
    course_id: str,
    coursework_id: str,
    student_id: str,
    score: float,
    max_score: float,
    feedback: str,
    access_token: str,
) -> bool:
    """Push a grade back to Google Classroom.
    
    This is a placeholder - would integrate with classroom.py service.
    """
    logger.info(
        "Would push grade %s/%s to Classroom course=%s coursework=%s student=%s",
        score, max_score, course_id, coursework_id, student_id
    )
    # TODO: Implement using Google Classroom API
    # classroom.courses().courseWork().studentSubmissions().patch(...)
    return True
