"""Google Classroom service.

Handles syncing coursework, listing submissions, and submitting/turning in
assignments. All functions are synchronous because googleapiclient is blocking.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Optional

from googleapiclient.discovery import Resource
from googleapiclient.errors import HttpError

from models.schemas import Assignment, SubmissionResponse

logger = logging.getLogger("engine_room.classroom")


def sync_assignments(
    classroom: Resource,
    course_id: Optional[str] = None,
) -> list[Assignment]:
    """Pull coursework from Google Classroom.

    If course_id is provided, syncs only that course.
    Otherwise, syncs all courses the user is enrolled in.
    """
    assignments: list[Assignment] = []

    try:
        courses = _get_courses(classroom, course_id)
    except HttpError as e:
        logger.error("Failed to fetch courses: %s", e)
        raise

    for course in courses:
        cid = course["id"]
        try:
            courseworks = classroom.courses().courseWork().list(courseId=cid).execute()
            for cw in courseworks.get("courseWork", []):
                # Try to get submission state for this student
                submission_state = None
                try:
                    submissions = (
                        classroom.courses()
                        .courseWork()
                        .studentSubmissions()
                        .list(courseId=cid, courseWorkId=cw["id"])
                        .execute()
                    )
                    sub_list = submissions.get("studentSubmissions", [])
                    if sub_list:
                        submission_state = sub_list[0].get("state")
                except HttpError:
                    pass  # No submission or no access

                due_date = None
                if "dueDate" in cw and cw["dueDate"]:
                    d = cw["dueDate"]
                    due_date = datetime(
                        year=d.get("year", 2026),
                        month=d.get("month", 1),
                        day=d.get("day", 1),
                    )

                assignments.append(
                    Assignment(
                        id=cw["id"],
                        title=cw.get("title", "Untitled"),
                        description=cw.get("description"),
                        dueDate=due_date,
                        state=cw.get("state", "PUBLISHED"),
                        submissionState=submission_state,
                        maxPoints=cw.get("maxPoints"),
                    )
                )
        except HttpError as e:
            logger.warning("Failed to sync coursework for course %s: %s", cid, e)
            continue

    logger.info("Synced %d assignments", len(assignments))
    return assignments


def submit_assignment(
    classroom: Resource,
    drive: Resource,
    course_id: str,
    course_work_id: str,
    access_token: str,
    file_content: Optional[bytes] = None,
    file_name: Optional[str] = None,
    file_mime_type: Optional[str] = None,
    text_response: Optional[str] = None,
    submissions_folder_id: Optional[str] = None,
) -> SubmissionResponse:
    """Submit an assignment: optionally upload file to Drive, attach to submission, turn in.

    Flow:
      1. If file provided, upload to Drive Submissions folder
      2. Attach the Drive file to the Classroom submission
      3. If text_response provided, set it as the submission text
      4. Turn in the assignment
    """
    drive_file_id = None

    # Step 1: Upload file to Drive if provided
    if file_content and file_name and submissions_folder_id:
        from .drive import upload_file as drive_upload_file
        drive_file_id = drive_upload_file(
            drive, file_content, file_name, file_mime_type or "application/octet-stream",
            parent_folder_id=submissions_folder_id,
        )

    try:
        # Step 2 & 3: Modify the submission
        submission_body: dict = {}

        if drive_file_id:
            submission_body["attachments"] = [
                {"driveFile": {"id": drive_file_id, "title": file_name}}
            ]

        if text_response:
            submission_body["textResponse"] = {"content": text_response}

        # Get the student submission ID
        submissions = (
            classroom.courses()
            .courseWork()
            .studentSubmissions()
            .list(courseId=course_id, courseWorkId=course_work_id)
            .execute()
        )
        sub_list = submissions.get("studentSubmissions", [])
        if not sub_list:
            raise RuntimeError("No student submission found — ensure you're enrolled in this course")

        sub_id = sub_list[0]["id"]

        if submission_body:
            classroom.courses().courseWork().studentSubmissions().patch(
                courseId=course_id,
                courseWorkId=course_work_id,
                id=sub_id,
                body=submission_body,
                updateMask="attachments,textResponse.content",
            ).execute()

        # Step 4: Turn in
        classroom.courses().courseWork().studentSubmissions().turnIn(
            courseId=course_id,
            courseWorkId=course_work_id,
            id=sub_id,
        ).execute()

        logger.info(
            "Submitted assignment %s for course %s (sub=%s, drive_file=%s)",
            course_work_id, course_id, sub_id, drive_file_id,
        )

        return SubmissionResponse(
            status="submitted",
            submissionId=sub_id,
            driveFileId=drive_file_id,
        )

    except HttpError as e:
        logger.error("Failed to submit assignment: %s", e)
        raise


def _get_courses(classroom: Resource, course_id: Optional[str] = None) -> list[dict]:
    """Retrieve courses, optionally filtering by ID."""
    if course_id:
        try:
            course = classroom.courses().get(id=course_id).execute()
            return [course]
        except HttpError as e:
            logger.error("Course %s not found: %s", course_id, e)
            raise

    result = classroom.courses().list(pageSize=100).execute()
    return result.get("courses", [])