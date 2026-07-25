#!/usr/bin/env python3
"""
NotebookLM upload automator (Playwright).

Best-effort UI automation — NotebookLM has no public API.
Requires a one-time manual Google login to save browser storage state.

Usage:
  # 1) One-time login (opens browser)
  python notebooklm_upload.py --login

  # 2) Upload a local file and print share link JSON
  python notebooklm_upload.py --file /path/to/material.pdf

  # 3) Optional: pass a Drive file id for logging/correlation only
  python notebooklm_upload.py --file ./out.pdf --file-id DRIVE_FILE_ID

Environment:
  HEADLESS=1          # default headless after login
  NOTEBOOKLM_URL      # default https://notebooklm.google.com/
  AUTH_STATE_PATH     # default scripts/playwright/.auth/storage_state.json
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

try:
    from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
except ImportError:
    print(
        json.dumps(
            {
                "ok": False,
                "error": "playwright_not_installed",
                "message": "Run: pip install -r scripts/playwright/requirements.txt && playwright install chromium",
            }
        )
    )
    sys.exit(1)

ROOT = Path(__file__).resolve().parent
AUTH_DIR = ROOT / ".auth"
DEFAULT_STATE = Path(
    os.environ.get("AUTH_STATE_PATH", str(AUTH_DIR / "storage_state.json"))
)
NOTEBOOKLM_URL = os.environ.get("NOTEBOOKLM_URL", "https://notebooklm.google.com/")


def ensure_auth_dir() -> None:
    AUTH_DIR.mkdir(parents=True, exist_ok=True)


def cmd_login(state_path: Path) -> None:
    """Open Chromium for manual Google login; save storage state."""
    ensure_auth_dir()
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()
        page.goto(NOTEBOOKLM_URL, wait_until="domcontentloaded")
        print(
            "\n>>> Log in to Google / NotebookLM in the opened window.\n"
            ">>> When your notebooks list is visible, return here and press ENTER.\n"
        )
        input()
        context.storage_state(path=str(state_path))
        browser.close()
    print(json.dumps({"ok": True, "auth_state": str(state_path)}))


def cmd_upload(file_path: Path, file_id: str | None, state_path: Path) -> None:
    if not state_path.exists():
        print(
            json.dumps(
                {
                    "ok": False,
                    "error": "missing_auth_state",
                    "message": "Run: python notebooklm_upload.py --login",
                }
            )
        )
        sys.exit(2)

    if not file_path.is_file():
        print(
            json.dumps(
                {
                    "ok": False,
                    "error": "file_not_found",
                    "path": str(file_path),
                }
            )
        )
        sys.exit(3)

    headless = os.environ.get("HEADLESS", "1") != "0"
    share_url = None
    error = None

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=headless)
            context = browser.new_context(storage_state=str(state_path))
            page = context.new_page()
            page.goto(NOTEBOOKLM_URL, wait_until="networkidle", timeout=120_000)

            # --- UI steps are intentionally conservative / text-oriented ---
            # Refine selectors using selectors.md after first live run.

            # Try to start a new notebook
            for label in ("New notebook", "Create", "New", "Create new"):
                btn = page.get_by_role("button", name=label)
                if btn.count() > 0:
                    btn.first.click(timeout=15_000)
                    break

            page.wait_for_timeout(2000)

            # Prefer a file input if present
            file_inputs = page.locator('input[type="file"]')
            if file_inputs.count() == 0:
                for label in ("Add source", "Upload", "Source"):
                    t = page.get_by_text(label, exact=False)
                    if t.count() > 0:
                        t.first.click(timeout=10_000)
                        page.wait_for_timeout(1000)
                        break
                file_inputs = page.locator('input[type="file"]')

            if file_inputs.count() == 0:
                raise RuntimeError(
                    "No file input found — update selectors.md and this script for current NotebookLM UI"
                )

            file_inputs.first.set_input_files(str(file_path))
            page.wait_for_timeout(5000)

            # Attempt to open share dialog and read a link-like field
            for label in ("Share", "Share notebook"):
                s = page.get_by_role("button", name=label)
                if s.count() > 0:
                    s.first.click(timeout=10_000)
                    page.wait_for_timeout(1500)
                    break

            # Any input that looks like a URL
            for sel in ('input[type="text"]', "input", "textarea"):
                fields = page.locator(sel)
                for i in range(min(fields.count(), 10)):
                    val = fields.nth(i).input_value(timeout=2000)
                    if val and ("http" in val or "notebooklm" in val):
                        share_url = val
                        break
                if share_url:
                    break

            # Fallback: current page URL may be the notebook
            if not share_url:
                share_url = page.url

            context.storage_state(path=str(state_path))
            browser.close()

    except PlaywrightTimeout as e:
        error = f"timeout: {e}"
    except Exception as e:
        error = str(e)

    if error:
        print(
            json.dumps(
                {
                    "ok": False,
                    "error": "automation_failed",
                    "message": error,
                    "file_id": file_id,
                    "hint": "Run with HEADLESS=0 and update scripts/playwright/selectors.md",
                }
            )
        )
        sys.exit(4)

    print(
        json.dumps(
            {
                "ok": True,
                "share_url": share_url,
                "file": str(file_path),
                "file_id": file_id,
            }
        )
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="NotebookLM Playwright uploader")
    parser.add_argument("--login", action="store_true", help="Manual login and save auth state")
    parser.add_argument("--file", type=str, help="Local file path to upload")
    parser.add_argument("--file-id", type=str, default=None, help="Optional Drive file id (metadata)")
    parser.add_argument(
        "--auth-state",
        type=str,
        default=str(DEFAULT_STATE),
        help="Path to Playwright storage_state JSON",
    )
    args = parser.parse_args()
    state_path = Path(args.auth_state)

    if args.login:
        cmd_login(state_path)
        return

    if not args.file:
        parser.error("Provide --login or --file")

    cmd_upload(Path(args.file), args.file_id, state_path)


if __name__ == "__main__":
    main()
