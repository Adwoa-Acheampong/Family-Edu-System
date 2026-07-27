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

from models.schemas import Assignment, Course, SubmissionResponse

logger = logging.getLogger("engine_room.classroom")


def sync_assignments(
    classroom: Resource,
    course_id: Optional[str] = None,
    courses: Optional[list[dict]] = None,
) -> list[Assignment]:
    """Pull coursework from Google Classroom.

    If course_id is provided, syncs only that course.
    Otherwise, syncs all courses the user is enrolled in.
    """
    assignments: list[Assignment] = []

    if courses is None:
        try:
            courses = _get_courses(classroom, course_id)
        except HttpError as e:
            logger.error("Failed to fetch courses: %s", e)
            raise

    for course in courses:
        cid = course["id"]
        try:
            courseworks = _get_coursework(classroom, cid)
            for cw in courseworks:
                # Try to get submission state for this student
                submission_state = None
                try:
                    submissions = (
                        classroom.courses()
                        .courseWork()
                        .studentSubmissions()
                        .list(courseId=cid, courseWorkId=cw["id"], userId="me")
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
                        courseId=cid,
                        courseName=course.get("name"),
                        title=cw.get("title", "Untitled"),
                        description=cw.get("description"),
                        dueDate=due_date,
                        state=cw.get("state", "PUBLISHED"),
                        submissionState=submission_state,
                        maxPoints=cw.get("maxPoints"),
                        alternateLink=cw.get("alternateLink"),
                        materials=cw.get("materials", []),
                    )
                )
        except HttpError as e:
            logger.warning("Failed to sync coursework for course %s: %s", cid, e)
            continue

    logger.info("Synced %d assignments", len(assignments))
    return assignments


def sync_classroom(
    classroom: Resource,
    course_id: Optional[str] = None,
) -> tuple[list[Course], list[Assignment]]:
    """Return normalized courses and their assignments in one API round-trip."""
    raw_courses = _get_courses(classroom, course_id)
    courses = [
        Course(
            id=course["id"],
            name=course.get("name", "Untitled course"),
            section=course.get("section"),
            descriptionHeading=course.get("descriptionHeading"),
            courseState=course.get("courseState", "ACTIVE"),
            alternateLink=course.get("alternateLink"),
        )
        for course in raw_courses
    ]
    return courses, sync_assignments(
        classroom,
        course_id,
        courses=raw_courses,
    )


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
      3. If text_response provided, upload it as a text-file attachment
      4. Turn in the assignment
    """
    drive_file_id = None
    attachments: list[dict] = []
    if (file_content or text_response) and not submissions_folder_id:
        raise RuntimeError("Drive submissions folder is unavailable")

    try:
        # Resolve the submission before uploading, so an invalid Classroom target
        # cannot leave orphaned files in Drive.
        submissions = (
            classroom.courses()
            .courseWork()
            .studentSubmissions()
            .list(courseId=course_id, courseWorkId=course_work_id, userId="me")
            .execute()
        )
        sub_list = submissions.get("studentSubmissions", [])
        if not sub_list:
            raise RuntimeError("No student submission found — ensure you're enrolled in this course")

        sub_id = sub_list[0]["id"]

        if file_content and file_name and submissions_folder_id:
            from .drive import upload_file as drive_upload_file

            drive_file_id = drive_upload_file(
                drive,
                file_content,
                file_name,
                file_mime_type or "application/octet-stream",
                parent_folder_id=submissions_folder_id,
            )
            attachments.append(
                {"driveFile": {"id": drive_file_id, "title": file_name}}
            )

        # Classroom does not expose a writable short-answer field for students.
        # Preserve typed work as a text file and attach it to the submission.
        if text_response and submissions_folder_id:
            from .drive import upload_file as drive_upload_file

            text_file_id = drive_upload_file(
                drive,
                text_response.encode("utf-8"),
                f"response-{course_work_id}.txt",
                "text/plain",
                parent_folder_id=submissions_folder_id,
            )
            if drive_file_id is None:
                drive_file_id = text_file_id
            attachments.append(
                {
                    "driveFile": {
                        "id": text_file_id,
                        "title": f"response-{course_work_id}.txt",
                    }
                }
            )

        if attachments:
            classroom.courses().courseWork().studentSubmissions().modifyAttachments(
                courseId=course_id,
                courseWorkId=course_work_id,
                id=sub_id,
                body={"addAttachments": attachments},
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

    courses: list[dict] = []
    page_token = None
    while True:
        result = classroom.courses().list(
            pageSize=100,
            pageToken=page_token,
            courseStates=["ACTIVE"],
        ).execute()
        courses.extend(result.get("courses", []))
        page_token = result.get("nextPageToken")
        if not page_token:
            return courses


def _get_coursework(classroom: Resource, course_id: str) -> list[dict]:
    coursework: list[dict] = []
    page_token = None
    while True:
        result = classroom.courses().courseWork().list(
            courseId=course_id,
            pageSize=100,
            pageToken=page_token,
            courseWorkStates=["PUBLISHED"],
        ).execute()
        coursework.extend(result.get("courseWork", []))
        page_token = result.get("nextPageToken")
        if not page_token:
            return coursework
