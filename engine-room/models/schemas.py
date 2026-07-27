"""Pydantic models for the Family Edu Engine Room API."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# ─── Auth ────────────────────────────────────────────────────────────────

class AuthExchangeRequest(BaseModel):
    code: str = Field(..., description="OAuth authorization code from Google")


class AuthRefreshRequest(BaseModel):
    refresh_token: str = Field(..., description="Refresh token to exchange")


class UserProfile(BaseModel):
    id: str = Field(..., description="Google user ID")
    name: str
    email: str
    persona: Optional[str] = None
    picture: Optional[str] = None


class AuthExchangeResponse(BaseModel):
    access_token: str
    refresh_token: str
    expires_in: int = 3600
    user: UserProfile


class AuthRefreshResponse(BaseModel):
    access_token: str
    expires_in: int = 3600


# ─── Classroom / Assignments ────────────────────────────────────────────

class Assignment(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    dueDate: Optional[datetime] = None
    state: str = "PUBLISHED"
    submissionState: Optional[str] = None
    maxPoints: Optional[int] = None


class SyncClassroomRequest(BaseModel):
    courseId: Optional[str] = Field(None, description="Optional: sync a specific course only")


class SyncClassroomResponse(BaseModel):
    assignments: list[Assignment]


class SubmissionRequest(BaseModel):
    courseId: str
    courseWorkId: str
    textResponse: Optional[str] = Field(None, description="Optional text response")


class SubmissionResponse(BaseModel):
    status: str = "submitted"
    submissionId: str
    driveFileId: Optional[str] = None


# ─── Drive ───────────────────────────────────────────────────────────────

class DriveUsage(BaseModel):
    used: int = Field(..., description="Bytes used")
    total: int = Field(..., description="Total bytes available")
    percentage: float = Field(..., description="Usage percentage (0–100)")
    free: int = Field(..., description="Bytes free")


class DriveFolderEnsureResponse(BaseModel):
    created: bool
    path: list[str]
    folderIds: list[str]


# ─── AI Chat ─────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    persona: str = Field(..., description="Persona name, e.g. 'Architect', 'Explorer'")
    conversationId: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    conversationId: str


# ─── OCR ─────────────────────────────────────────────────────────────────

class OCRRequest(BaseModel):
    driveFileId: str
    fileType: str = Field(default="pdf", description="pdf, jpg, png, etc.")


class OCRResponse(BaseModel):
    text: str
    markdown: str


# ─── Curriculum ──────────────────────────────────────────────────────────

class StudyMaterial(BaseModel):
    type: str  # video, article, quiz, etc.
    title: str
    url: str


class AssignmentDraft(BaseModel):
    title: str
    description: str
    rubric: Optional[str] = None


class CurriculumRequest(BaseModel):
    persona: str
    topic: str
    goalId: Optional[str] = None


class CurriculumResponse(BaseModel):
    studyMaterials: list[StudyMaterial]
    assignment: AssignmentDraft


# ─── Progress / Analytics ───────────────────────────────────────────────

class ProgressAnalytics(BaseModel):
    completionPercent: float = 0.0
    currentStreak: int = 0
    totalAssignments: int = 0
    completedAssignments: int = 0


# ─── Generic ────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str = "ok"


class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None