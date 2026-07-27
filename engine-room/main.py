"""Family Educational ERP — AI Engine Room

FastAPI orchestrator that sits between the React dashboard and
Google Workspace / OCR / LLMs.

Run with: uvicorn main:app --reload --port 8000
"""

from __future__ import annotations

import asyncio
import logging
import os
from contextlib import asynccontextmanager
from typing import Optional

import httpx
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
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
    HealthResponse,
    OCRRequest,
    OCRResponse,
    ProgressAnalytics,
    SubmissionResponse,
    SyncClassroomRequest,
    SyncClassroomResponse,
    UserProfile,
)

# ─── Logging ────────────────────────────────────────────────────────────

log_level = os.environ.get("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, log_level, logging.INFO),
    format="%(asctime)s  %(name)-12s  %(levelname)-5s  %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger("engine_room")


# ─── App lifecycle ─────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    logger.info("Engine Room starting up...")
    await init_db()
    logger.info("Engine Room ready on port 8000")
    yield
    logger.info("Engine Room shutting down...")


app = FastAPI(
    title="Family Edu Engine Room",
    description="Local AI orchestrator for the Family Educational ERP",
    version="1.0.0",
    lifespan=lifespan,
)

# ─── CORS ───────────────────────────────────────────────────────────────

cors_origins = os.environ.get(
    "CORS_ORIGINS", "http://localhost:5173,http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in cors_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Helpers ────────────────────────────────────────────────────────────

def _google_user_id_from_token(authorization: Optional[str]) -> str:
    """Extract the Google user ID from the stored token.

    In development, this looks up the token from the DB by decoding it.
    For production, validate the JWT access token against Google's tokeninfo.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    # For Phase 1/2 local dev, we use the token as a lookup into the DB.
    # The frontend sends the access_token which we stored during auth exchange.
    # In production, validate with: https://oauth2.googleapis.com/tokeninfo?id_token=...
    # For now, we return the raw token for the service functions to use.
    token = authorization.removeprefix("Bearer ")

    # If we have a stored user, we can look up tokens
    # For simplicity, we just return the token — the services use it directly.
    return token


# ─── Health ─────────────────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(status="ok")


# ─── Auth ───────────────────────────────────────────────────────────────

@app.post("/v1/auth/exchange-code", response_model=AuthExchangeResponse)
async def auth_exchange(request: AuthExchangeRequest):
    """Exchange an OAuth authorization code for access and refresh tokens."""
    try:
        from auth.google_auth import exchange_code
        result = await exchange_code(request.code)
    except httpx.HTTPStatusError as e:
        logger.error("OAuth exchange failed: %s", e)
        raise HTTPException(status_code=400, detail="Failed to exchange authorization code")

    # Store tokens encrypted
    user = result["user"]
    await save_tokens(
        google_user_id=user["id"],
        access_token=result["access_token"],
        refresh_token=result["refresh_token"],
        expires_in=result["expires_in"],
    )

    # Store profile
    await save_profile(
        google_user_id=user["id"],
        display_name=user["name"],
        email=user["email"],
        picture=user.get("picture"),
    )

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
    """Refresh an expired access token using a refresh token."""
    try:
        from auth.google_auth import refresh_access_token
        result = await refresh_access_token(request.refresh_token)
    except httpx.HTTPStatusError as e:
        logger.error("Token refresh failed: %s", e)
        raise HTTPException(status_code=400, detail="Failed to refresh token")

    return AuthRefreshResponse(
        access_token=result["access_token"],
        expires_in=result["expires_in"],
    )


@app.get("/v1/auth/url")
async def auth_url():
    """Get the Google OAuth consent URL (for frontend redirect)."""
    from auth.google_auth import get_auth_url
    return {"url": get_auth_url()}


# ─── Drive ──────────────────────────────────────────────────────────────

@app.get("/v1/drive-usage", response_model=DriveUsage)
async def drive_usage(authorization: Optional[str] = None):
    """Get the authenticated user's Drive storage quota."""
    token = _google_user_id_from_token(authorization)

    from auth.google_auth import build_google_client
    from services.drive import get_drive_usage

    try:
        drive = build_google_client("drive", "v3", token)
        usage = await asyncio.to_thread(get_drive_usage, drive)
        return usage
    except Exception as e:
        logger.error("Drive usage check failed: %s", e)
        raise HTTPException(status_code=502, detail="Failed to fetch Drive usage")


@app.post("/v1/drive/ensure-folders")
async def ensure_drive_folders(authorization: Optional[str] = None):
    """Ensure the Educational ERP folder tree exists for the user."""
    token = _google_user_id_from_token(authorization)

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


# ─── Classroom ──────────────────────────────────────────────────────────

@app.post("/v1/sync-classroom", response_model=SyncClassroomResponse)
async def sync_classroom(
    request: SyncClassroomRequest,
    authorization: Optional[str] = None,
):
    """Pull assignments from Google Classroom."""
    token = _google_user_id_from_token(authorization)

    from auth.google_auth import build_google_client
    from services.classroom import sync_assignments

    try:
        classroom = build_google_client("classroom", "v1", token)
        assignments = await asyncio.to_thread(
            sync_assignments, classroom,
            course_id=request.courseId,
        )
        return SyncClassroomResponse(assignments=assignments)
    except Exception as e:
        logger.error("Classroom sync failed: %s", e)
        raise HTTPException(status_code=502, detail="Failed to sync Classroom")


@app.post("/v1/submit-assignment", response_model=SubmissionResponse)
async def handle_submit_assignment(
    courseId: str = Form(...),
    courseWorkId: str = Form(...),
    textResponse: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    authorization: Optional[str] = None,
):
    """Submit an assignment: upload file to Drive, attach to Classroom, turn in."""
    token = _google_user_id_from_token(authorization)

    from auth.google_auth import build_google_client
    from services.classroom import submit_assignment as classroom_submit

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

        # Get the submissions folder (last in the folder tree)
        from services.drive import ensure_folder_tree
        folder_ids = await asyncio.to_thread(ensure_folder_tree, drive)
        submissions_folder_id = folder_ids[3] if len(folder_ids) > 3 else None

        result = await asyncio.to_thread(
            classroom_submit,
            classroom, drive, courseId, courseWorkId, token,
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


# ─── OCR ────────────────────────────────────────────────────────────────

@app.post("/v1/process-document", response_model=OCRResponse)
async def process_document(
    request: OCRRequest,
    authorization: Optional[str] = None,
):
    """OCR a document from Google Drive using Baidu OCR."""
    token = _google_user_id_from_token(authorization)

    from auth.google_auth import build_google_client
    from services.ocr import process_document as ocr_process

    try:
        drive = build_google_client("drive", "v3", token)
        result = await ocr_process(drive, request.driveFileId, request.fileType)
        return result
    except Exception as e:
        logger.error("OCR processing failed: %s", e)
        raise HTTPException(status_code=502, detail=f"OCR failed: {e}")


# ─── AI Chat ────────────────────────────────────────────────────────────

@app.post("/v1/ai-chat", response_model=ChatResponse)
async def ai_chat(
    request: ChatRequest,
    authorization: Optional[str] = None,
):
    """Persona-aware AI chat via OpenRouter or Gemini."""
    from services.ai_chat import chat as ai_chat_service

    try:
        result = await ai_chat_service(request)
        return result
    except Exception as e:
        logger.error("AI chat failed: %s", e)
        raise HTTPException(status_code=502, detail=f"AI chat failed: {e}")


# ─── Curriculum ─────────────────────────────────────────────────────────

@app.post("/v1/generate-curriculum", response_model=CurriculumResponse)
async def generate_curriculum(
    request: CurriculumRequest,
    authorization: Optional[str] = None,
):
    """Generate study materials and an assignment draft."""
    from services.curriculum import generate_curriculum as curriculum_service

    try:
        result = await curriculum_service(request)
        return result
    except Exception as e:
        logger.error("Curriculum generation failed: %s", e)
        raise HTTPException(status_code=502, detail=f"Curriculum generation failed: {e}")


# ─── Progress / Analytics ──────────────────────────────────────────────

@app.get("/v1/progress-analytics", response_model=ProgressAnalytics)
async def progress_analytics(authorization: Optional[str] = None):
    """Return student progress metrics (stub for Phase 1/2)."""
    return ProgressAnalytics(
        completionPercent=0.0,
        currentStreak=0,
        totalAssignments=0,
        completedAssignments=0,
    )


# ─── Error handlers ────────────────────────────────────────────────────

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


# ─── Entrypoint ────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level=log_level.lower(),
    )