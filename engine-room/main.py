"""Family Educational ERP — AI Engine Room

Run: uvicorn main:app --reload --port 8000
"""

from __future__ import annotations

import asyncio
import logging
import os
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Optional

import httpx
from fastapi import FastAPI, File, Form, Header, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from db.sqlite import init_db, save_profile, save_tokens
from models.schemas import (
    AuthExchangeRequest,
    AuthExchangeResponse,
    AuthRefreshRequest,
    AuthRefreshResponse,
    ChatRequest,
    ChatResponse,
    CurriculumRequest,
    CurriculumResponse,
    DriveUsage,
    GenerateCurriculumRequest,
    GenerateCurriculumResponse,
    GradeSubmissionRequest,
    GradeSubmissionResponse,
    HealthResponse,
    LessonIngestRequest,
    LessonIngestResponse,
    LessonListResponse,
    LessonResource,
    OCRRequest,
    OCRResponse,
    ProgressAnalytics,
    SubmissionResponse,
    SyncClassroomRequest,
    SyncClassroomResponse,
    UserProfile,
)

log_level = os.environ.get("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, log_level, logging.INFO),
    format="%(asctime)s  %(name)-12s  %(levelname)-5s  %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger("engine_room")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Engine Room starting up...")
    try:
        await init_db()
    except Exception as e:
        logger.warning("DB init deferred/failed: %s", e)
    gemini = bool(os.environ.get("GEMINI_API_KEY", "").strip())
    logger.info(
        "OCR backend: Gemini Vision (%s)",
        "ready" if gemini else "GEMINI_API_KEY not set — OCR will 503 until configured",
    )
    logger.info("Engine Room ready")
    yield
    logger.info("Engine Room shutting down...")


app = FastAPI(
    title="Family Edu Engine Room",
    description="Local AI orchestrator for the Family Educational ERP",
    version="1.2.0",
    lifespan=lifespan,
)

cors_origins = os.environ.get(
    "CORS_ORIGINS", "http://localhost:5173,http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in cors_origins if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def require_access_token(
    authorization: Optional[str] = None,
    x_google_user_id: Optional[str] = None,
) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401, detail="Missing or invalid Authorization header"
        )
    bearer = authorization.removeprefix("Bearer ").strip()
    if not bearer:
        raise HTTPException(status_code=401, detail="Empty Bearer token")

    from auth.google_auth import resolve_access_token

    return await resolve_access_token(bearer, x_google_user_id)


@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(status="ok")


@app.get("/health/detail")
async def health_detail():
    return {
        "status": "ok",
        "gemini": bool(os.environ.get("GEMINI_API_KEY", "").strip()),
        "openrouter": bool(os.environ.get("OPENROUTER_API_KEY", "").strip()),
        "ocr": "gemini-vision",
        "google_oauth": bool(
            os.environ.get("GOOGLE_CLIENT_ID") and os.environ.get("GOOGLE_CLIENT_SECRET")
        ),
    }


@app.post("/v1/auth/exchange-code", response_model=AuthExchangeResponse)
async def auth_exchange(request: AuthExchangeRequest):
    try:
        from auth.google_auth import exchange_code

        result = await exchange_code(request.code)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except httpx.HTTPStatusError as e:
        logger.error("OAuth exchange failed: %s", e)
        raise HTTPException(status_code=400, detail="Failed to exchange authorization code")

    user = result["user"]
    try:
        await save_tokens(
            google_user_id=user["id"],
            access_token=result["access_token"],
            refresh_token=result["refresh_token"],
            expires_in=result["expires_in"],
        )
        await save_profile(
            google_user_id=user["id"],
            display_name=user["name"],
            email=user["email"],
            picture=user.get("picture"),
        )
    except Exception as e:
        logger.warning("Could not persist tokens/profile: %s", e)

    logger.info("User %s authenticated successfully", user["email"])
    return AuthExchangeResponse(
        access_token=result["access_token"],
        refresh_token=result["refresh_token"],
        expires_in=result["expires_in"],
        user=UserProfile(
            id=user["id"],
            name=user["name"],
            email=user["email"],
            picture=user.get("picture"),
        ),
    )


@app.post("/v1/auth/refresh", response_model=AuthRefreshResponse)
async def auth_refresh(request: AuthRefreshRequest):
    try:
        from auth.google_auth import refresh_access_token

        result = await refresh_access_token(request.refresh_token)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except httpx.HTTPStatusError as e:
        logger.error("Token refresh failed: %s", e)
        raise HTTPException(status_code=400, detail="Failed to refresh token")

    return AuthRefreshResponse(
        access_token=result["access_token"],
        expires_in=result["expires_in"],
    )


@app.get("/v1/auth/url")
async def auth_url(state: Optional[str] = Query(None, min_length=16, max_length=256)):
    try:
        from auth.google_auth import get_auth_url

        url, oauth_state = get_auth_url(state)
        return {"url": url, "state": oauth_state}
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))


@app.get("/v1/drive-usage", response_model=DriveUsage)
async def drive_usage(
    authorization: Optional[str] = Header(None),
    x_google_user_id: Optional[str] = Header(None, alias="X-Google-User-Id"),
):
    token = await require_access_token(authorization, x_google_user_id)
    from auth.google_auth import build_google_client
    from services.drive import get_drive_usage

    try:
        drive = build_google_client("drive", "v3", token)
        return await asyncio.to_thread(get_drive_usage, drive)
    except Exception as e:
        logger.error("Drive usage check failed: %s", e)
        raise HTTPException(status_code=502, detail="Failed to fetch Drive usage")


@app.post("/v1/drive/ensure-folders")
async def ensure_drive_folders(
    authorization: Optional[str] = Header(None),
    x_google_user_id: Optional[str] = Header(None, alias="X-Google-User-Id"),
):
    token = await require_access_token(authorization, x_google_user_id)
    from auth.google_auth import build_google_client
    from services.drive import ensure_folder_tree

    try:
        drive = build_google_client("drive", "v3", token)
        folder_ids = await asyncio.to_thread(ensure_folder_tree, drive)
        return {
            "created": True,
            "path": [
                "Educational ERP",
                "Educational ERP/Study Materials",
                "Educational ERP/Assignments",
                "Educational ERP/Submissions",
                "Educational ERP/Archives",
            ],
            "folderIds": folder_ids,
        }
    except Exception as e:
        logger.error("Folder creation failed: %s", e)
        raise HTTPException(status_code=502, detail="Failed to create Drive folders")


@app.post("/v1/sync-classroom", response_model=SyncClassroomResponse)
async def sync_classroom(
    request: SyncClassroomRequest,
    authorization: Optional[str] = Header(None),
    x_google_user_id: Optional[str] = Header(None, alias="X-Google-User-Id"),
):
    token = await require_access_token(authorization, x_google_user_id)
    from auth.google_auth import build_google_client
    from services.classroom import sync_classroom as sync_classroom_service

    try:
        classroom = build_google_client("classroom", "v1", token)
        courses, assignments = await asyncio.to_thread(
            sync_classroom_service, classroom, course_id=request.courseId
        )
        return SyncClassroomResponse(courses=courses, assignments=assignments)
    except Exception as e:
        logger.error("Classroom sync failed: %s", e)
        raise HTTPException(status_code=502, detail="Failed to sync Classroom")


@app.post("/v1/submit-assignment", response_model=SubmissionResponse)
async def handle_submit_assignment(
    courseId: str = Form(...),
    courseWorkId: str = Form(...),
    textResponse: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    authorization: Optional[str] = Header(None),
    x_google_user_id: Optional[str] = Header(None, alias="X-Google-User-Id"),
):
    token = await require_access_token(authorization, x_google_user_id)
    from auth.google_auth import build_google_client
    from services.classroom import submit_assignment as classroom_submit
    from services.drive import ensure_folder_tree

    file_content = None
    file_name = None
    file_mime_type = None
    if file and file.filename:
        file_content = await file.read()
        file_name = file.filename
        file_mime_type = file.content_type or "application/octet-stream"

    try:
        classroom = build_google_client("classroom", "v1", token)
        drive = build_google_client("drive", "v3", token)
        folder_ids = await asyncio.to_thread(ensure_folder_tree, drive)
        submissions_folder_id = folder_ids[3] if len(folder_ids) > 3 else None

        result = await asyncio.to_thread(
            classroom_submit,
            classroom,
            drive,
            courseId,
            courseWorkId,
            token,
            file_content=file_content,
            file_name=file_name,
            file_mime_type=file_mime_type,
            text_response=textResponse,
            submissions_folder_id=submissions_folder_id,
        )
        return result
    except Exception as e:
        logger.error("Assignment submission failed: %s", e)
        raise HTTPException(status_code=502, detail=f"Failed to submit assignment: {e}")


@app.post("/v1/process-document", response_model=OCRResponse)
async def process_document(
    request: OCRRequest,
    authorization: Optional[str] = Header(None),
    x_google_user_id: Optional[str] = Header(None, alias="X-Google-User-Id"),
):
    """OCR a Drive file via Gemini Vision (PDF / PNG / JPEG / WebP)."""
    token = await require_access_token(authorization, x_google_user_id)
    from auth.google_auth import build_google_client
    from services.ocr import process_document as ocr_process

    try:
        drive = build_google_client("drive", "v3", token)
        return await ocr_process(drive, request.driveFileId, request.fileType)
    except RuntimeError as e:
        msg = str(e)
        if "GEMINI_API_KEY" in msg:
            raise HTTPException(status_code=503, detail=msg)
        logger.error("OCR processing failed: %s", e)
        raise HTTPException(status_code=502, detail=f"OCR failed: {e}")
    except Exception as e:
        logger.error("OCR processing failed: %s", e)
        raise HTTPException(status_code=502, detail=f"OCR failed: {e}")


@app.post("/v1/process-document/upload", response_model=OCRResponse)
async def process_document_upload(
    file: UploadFile = File(...),
    authorization: Optional[str] = Header(None),
):
    """OCR an uploaded image or PDF via Gemini Vision (no Drive required)."""
    # Auth optional for local testing; require header when present and empty-invalid
    if authorization is not None and not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid Authorization header")

    from services.ocr import process_bytes

    content = await file.read()
    name = file.filename or "upload.bin"
    ext = name.rsplit(".", 1)[-1] if "." in name else "png"
    mime = file.content_type or None

    try:
        return await process_bytes(content, file_type=ext, mime_type=mime)
    except RuntimeError as e:
        msg = str(e)
        if "GEMINI_API_KEY" in msg:
            raise HTTPException(status_code=503, detail=msg)
        raise HTTPException(status_code=502, detail=f"OCR failed: {e}")
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error("Upload OCR failed: %s", e)
        raise HTTPException(status_code=502, detail=f"OCR failed: {e}")


@app.post("/v1/ai-chat", response_model=ChatResponse)
async def ai_chat(request: ChatRequest):
    from services.ai_chat import chat as ai_chat_service

    try:
        return await ai_chat_service(request)
    except Exception as e:
        logger.error("AI chat failed: %s", e)
        raise HTTPException(status_code=502, detail=f"AI chat failed: {e}")


@app.post("/v1/curriculum/generate", response_model=GenerateCurriculumResponse)
async def generate_advanced_curriculum(
    request: GenerateCurriculumRequest,
    file: Optional[UploadFile] = File(None),
):
    """Generate a comprehensive curriculum from a text prompt or PDF upload.
    
    Uses Gemini 1.5 Pro to parse certification materials and create structured
    learning paths with modules, projects, quizzes, and web-enriched resources.
    
    - **prompt**: Text description of what to generate (e.g., "Business Analyst Certification")
    - **file**: Optional PDF file upload (e.g., BABOK Guide)
    - **certificationName**: Name of the certification being prepared for
    - **persona**: Learner persona (default: "Master")
    
    Returns a complete CurriculumTree with:
    - Modules mapped to certification domains
    - Reading guides with key concepts
    - Practical real-world projects
    - Exam-style quizzes
    - Web resources and case studies
    """
    from services.curriculum_generator import (
        generate_curriculum_from_prompt,
        generate_curriculum_from_pdf,
    )
    from services.scraper import enrich_curriculum_modules
    
    try:
        # Handle PDF upload vs text prompt
        if file and file.filename:
            pdf_content = await file.read()
            result = await generate_curriculum_from_pdf(
                pdf_content=pdf_content,
                filename=file.filename,
                request=request,
            )
        elif request.prompt or request.certificationName:
            result = await generate_curriculum_from_prompt(request)
        else:
            raise HTTPException(
                status_code=400,
                detail="Either a prompt or PDF file must be provided"
            )
        
        # Enrich with web resources (optional, can be slow)
        # In production, this might be done asynchronously
        # curriculum_data = result.curriculum.model_dump()
        # enriched_modules = await enrich_curriculum_modules(curriculum_data.get("modules", []))
        # result.curriculum.modules = enriched_modules
        
        return result
        
    except RuntimeError as e:
        if "GEMINI_API_KEY" in str(e):
            raise HTTPException(
                status_code=503,
                detail="Gemini API key not configured. Set GEMINI_API_KEY in environment."
            )
        logger.error("Curriculum generation failed: %s", e)
        raise HTTPException(status_code=502, detail=f"Curriculum generation failed: {e}")
    except json.JSONDecodeError as e:
        logger.error("Invalid JSON from AI: %s", e)
        raise HTTPException(
            status_code=502,
            detail=f"Failed to parse AI response: {e}"
        )
    except Exception as e:
        logger.error("Curriculum generation failed: %s", e)
        raise HTTPException(status_code=502, detail=f"Curriculum generation failed: {e}")


@app.post("/v1/grade-submission", response_model=GradeSubmissionResponse)
async def grade_submission(
    request: GradeSubmissionRequest,
    authorization: Optional[str] = Header(None),
    x_google_user_id: Optional[str] = Header(None, alias="X-Google-User-Id"),
):
    """Automatically grade a student submission using AI.
    
    Evaluates quiz responses or project submissions against grading rubrics,
    provides detailed feedback, and optionally pushes grades to Google Classroom.
    
    - **assignmentId**: The assignment/coursework ID
    - **courseId**: The course ID
    - **submissionType**: Either "quiz" or "project"
    - **submissionContent**: The student's answer or project description
    - **attachments**: Optional list of Drive file IDs with submitted files
    
    Returns:
    - Score and max score
    - Detailed constructive feedback
    - Strengths and areas for improvement
    - XP earned for the dashboard
    """
    from services.grader import grade_submission as grader_service
    
    # Get access token for optional Classroom sync (lazy import to avoid circular deps)
    access_token = None
    if authorization and authorization.startswith("Bearer "):
        try:
            from auth.google_auth import resolve_access_token
            bearer = authorization.removeprefix("Bearer ").strip()
            access_token = await resolve_access_token(bearer, x_google_user_id)
        except ImportError:
            logger.warning("Google auth not available for token resolution")
        except Exception as e:
            logger.warning("Could not resolve access token for grading: %s", e)
    
    try:
        # For now, we need to fetch the assignment rubric from somewhere
        # In production, this would come from the curriculum tree or database
        # For demonstration, we'll use a default rubric
        default_rubric = {
            "Completeness": 10,
            "Accuracy": 10,
            "Quality": 10,
            "Professionalism": 5,
        }
        
        assignment_description = (
            f"Assignment {request.assignmentId} in course {request.courseId}. "
            f"Submit your best work demonstrating mastery of the topic."
        )
        
        return await grader_service(
            request=request,
            rubric=default_rubric,
            assignment_description=assignment_description,
            access_token=access_token,
        )
        
    except RuntimeError as e:
        if "GEMINI_API_KEY" in str(e):
            raise HTTPException(
                status_code=503,
                detail="Gemini API key not configured for auto-grading"
            )
        logger.error("Grading failed: %s", e)
        raise HTTPException(status_code=502, detail=f"Grading failed: {e}")
    except Exception as e:
        logger.error("Grading failed: %s", e)
        raise HTTPException(status_code=502, detail=f"Grading failed: {e}")



@app.post("/v1/lessons/ingest", response_model=LessonIngestResponse)
async def ingest_lesson(
    request: LessonIngestRequest,
    authorization: Optional[str] = Header(None),
    x_google_user_id: Optional[str] = Header(None, alias="X-Google-User-Id"),
):
    from db.sqlite import save_lesson
    from services.notebook import (
        add_youtube_source,
        create_notebook,
        get_config,
        notebook_url,
    )
    from services.youtube import fetch_transcript

    try:
        transcript = await fetch_transcript(request.youtubeUrl, request.languages)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    notebook_id = request.notebookId
    source_id = None
    notebook_link = None
    notebook_status = "not_requested"
    try:
        notebook_config = get_config()
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    if request.addToNotebook and notebook_config is None:
        notebook_status = "not_configured"
    elif request.addToNotebook:
        token = await require_access_token(authorization, x_google_user_id)
        try:
            if not notebook_id:
                created = await create_notebook(
                    token, request.title or transcript.title
                )
                notebook_id = created.get("notebookId")
                if not notebook_id and created.get("name"):
                    notebook_id = created["name"].rstrip("/").split("/")[-1]
            if not notebook_id:
                raise RuntimeError("Notebook API did not return a notebook ID")

            source = await add_youtube_source(
                token, notebook_id, transcript.url
            )
            first_source = (source.get("sources") or [{}])[0]
            raw_source_id = first_source.get("sourceId")
            source_id = (
                raw_source_id.get("id")
                if isinstance(raw_source_id, dict)
                else raw_source_id
            )
            notebook_status = (
                first_source.get("settings", {}).get("status") or "submitted"
            )
            notebook_link = notebook_url(notebook_id)
        except httpx.HTTPStatusError as e:
            logger.error(
                "Gemini Notebook Enterprise rejected lesson source: %s",
                e.response.status_code,
            )
            notebook_status = "error"
        except Exception as e:
            logger.error("Notebook lesson wiring failed: %s", e)
            notebook_status = "error"

    lesson = LessonResource(
        id=str(uuid.uuid4()),
        userId=request.userId,
        persona=request.persona,
        title=request.title or transcript.title,
        youtubeUrl=transcript.url,
        transcript=transcript,
        notebookId=notebook_id,
        notebookUrl=notebook_link,
        notebookSourceId=source_id,
        notebookStatus=notebook_status,
        createdAt=datetime.now(timezone.utc),
    )
    await save_lesson(lesson)
    return LessonIngestResponse(lesson=lesson)


@app.get("/v1/lessons", response_model=LessonListResponse)
async def get_lessons(
    user_id: str = Query(..., alias="userId", min_length=1),
):
    from db.sqlite import list_lessons

    return LessonListResponse(lessons=await list_lessons(user_id))


@app.get("/v1/progress-analytics", response_model=ProgressAnalytics)
async def progress_analytics(
    x_google_user_id: Optional[str] = Header(None, alias="X-Google-User-Id"),
):
    from services.analytics import get_user_analytics
    
    # Extract user ID or default to "aba" for development
    user_id = x_google_user_id or "aba"
    
    try:
        return await get_user_analytics(user_id)
    except Exception as e:
        logger.error("Progress analytics failed: %s", e)
        raise HTTPException(status_code=500, detail=f"Analytics failed: {e}")


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "error_code": f"HTTP_{exc.status_code}"},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request, exc: Exception):
    logger.exception("Unhandled exception: %s", exc)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An internal server error occurred",
            "error_code": "INTERNAL_ERROR",
        },
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level=log_level.lower(),
    )
