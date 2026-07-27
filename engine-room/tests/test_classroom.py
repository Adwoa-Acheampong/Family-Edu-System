"""Classroom submission behavior tests."""

from unittest.mock import MagicMock

from services.classroom import submit_assignment


def test_submit_assignment_attaches_file_and_text(monkeypatch):
    classroom = MagicMock()
    submissions_api = (
        classroom.courses.return_value
        .courseWork.return_value
        .studentSubmissions.return_value
    )
    submissions_api.list.return_value.execute.return_value = {
        "studentSubmissions": [{"id": "submission-1"}]
    }

    uploaded = []

    def fake_upload(_drive, content, name, mime_type, parent_folder_id=None):
        uploaded.append((content, name, mime_type, parent_folder_id))
        return f"drive-{len(uploaded)}"

    monkeypatch.setattr("services.drive.upload_file", fake_upload)

    result = submit_assignment(
        classroom=classroom,
        drive=MagicMock(),
        course_id="course-1",
        course_work_id="work-1",
        access_token="unused",
        file_content=b"homework",
        file_name="homework.pdf",
        file_mime_type="application/pdf",
        text_response="My written answer",
        submissions_folder_id="folder-1",
    )

    assert result.submissionId == "submission-1"
    assert result.driveFileId == "drive-1"
    assert [item[1] for item in uploaded] == [
        "homework.pdf",
        "response-work-1.txt",
    ]
    submissions_api.modifyAttachments.assert_called_once()
    body = submissions_api.modifyAttachments.call_args.kwargs["body"]
    assert len(body["addAttachments"]) == 2
    submissions_api.turnIn.assert_called_once_with(
        courseId="course-1",
        courseWorkId="work-1",
        id="submission-1",
    )
