"""Google Drive service.

Handles folder creation, file upload, and storage quota queries.
All functions are synchronous because googleapiclient is blocking.
"""

from __future__ import annotations

import io
import logging
import os
from typing import Optional

from googleapiclient.discovery import Resource
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaIoBaseUpload, MediaIoBaseDownload

from models.schemas import DriveUsage

logger = logging.getLogger("engine_room.drive")

# The top-level folder structure created for each user
FOLDER_TREE = [
    "Educational ERP",
    "Educational ERP/Study Materials",
    "Educational ERP/Assignments",
    "Educational ERP/Submissions",
    "Educational ERP/Archives",
]


def ensure_folder_tree(drive: Resource) -> list[str]:
    """Create the Educational ERP folder tree for a user.

    Returns a list of Google Drive folder IDs corresponding to FOLDER_TREE.
    """
    folder_ids: list[str] = []
    current_parent: Optional[str] = None

    for folder_path in FOLDER_TREE:
        folder_name = os.path.basename(folder_path)
        folder_id = _find_or_create_folder(drive, folder_name, current_parent)
        folder_ids.append(folder_id)
        current_parent = folder_id

    return folder_ids


def _find_or_create_folder(
    drive: Resource, name: str, parent_id: Optional[str] = None,
) -> str:
    """Find a folder by name and parent, or create it."""
    try:
        query = f"mimeType='application/vnd.google-apps.folder' and name='{name}' and trashed=false"
        if parent_id:
            query += f" and '{parent_id}' in parents"

        results = drive.files().list(
            q=query,
            spaces="drive",
            fields="files(id, name)",
            pageSize=1,
        ).execute()
        files = results.get("files", [])

        if files:
            return files[0]["id"]

    except HttpError as e:
        logger.warning("Error searching for folder '%s': %s", name, e)

    # Folder doesn't exist — create it
    metadata = {
        "name": name,
        "mimeType": "application/vnd.google-apps.folder",
    }
    if parent_id:
        metadata["parents"] = [parent_id]

    try:
        folder = drive.files().create(body=metadata, fields="id").execute()
        logger.info("Created folder '%s' (id=%s)", name, folder["id"])
        return folder["id"]
    except HttpError as e:
        logger.error("Failed to create folder '%s': %s", name, e)
        raise


def get_drive_usage(drive: Resource) -> DriveUsage:
    """Get the authenticated user's Drive storage quota."""
    try:
        about = drive.about().get(fields="storageQuota").execute()
        quota = about.get("storageQuota", {})
        used = int(quota.get("usage", 0))
        limit = int(quota.get("limit", 15_000_000_000))  # default 15 GB
        free = max(limit - used, 0)
        percentage = round((used / limit) * 100, 2) if limit > 0 else 0.0

        return DriveUsage(
            used=used,
            total=limit,
            percentage=percentage,
            free=free,
        )
    except HttpError as e:
        logger.error("Failed to fetch Drive usage: %s", e)
        raise


def upload_file(
    drive: Resource,
    file_content: bytes,
    file_name: str,
    mime_type: str,
    parent_folder_id: Optional[str] = None,
) -> str:
    metadata = {"name": file_name}
    if parent_folder_id:
        metadata["parents"] = [parent_folder_id]

    media = MediaIoBaseUpload(io.BytesIO(file_content), mimetype=mime_type, resumable=True)

    try:
        uploaded = drive.files().create(
            body=metadata,
            media_body=media,
            fields="id",
        ).execute()
        logger.info("Uploaded file '%s' (id=%s)", file_name, uploaded["id"])
        return uploaded["id"]
    except HttpError as e:
        logger.error("Failed to upload file '%s': %s", file_name, e)
        raise


def download_file(drive: Resource, file_id: str) -> bytes:
    """Download a file from Drive by its ID."""
    try:
        request = drive.files().get_media(fileId=file_id)
        fh = io.BytesIO()
        downloader = MediaIoBaseDownload(fh, request)
        done = False
        while not done:
            _, done = downloader.next_chunk()
        return fh.getvalue()
    except HttpError as e:
        logger.error("Failed to download file %s: %s", file_id, e)
        raise