# NotebookLM Automator (Playwright)

Automates **best-effort** upload of study materials into [NotebookLM](https://notebooklm.google.com/).  
Google does not provide a public NotebookLM API — this uses browser automation.

## Setup

```bash
cd scripts/playwright
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
playwright install chromium
```

## One-time login

```bash
python notebooklm_upload.py --login
```

Sign into the **family-approved Google account** in the window, wait until NotebookLM loads, then press ENTER in the terminal.  
Auth is saved to `scripts/playwright/.auth/storage_state.json` (gitignored).

## Upload a file

```bash
python notebooklm_upload.py --file /path/to/notes.pdf
# optional correlation id from Drive:
python notebooklm_upload.py --file ./notes.pdf --file-id 1abc...
```

Successful stdout example:

```json
{"ok": true, "share_url": "https://notebooklm.google.com/...", "file": "...", "file_id": null}
```

## Debug UI changes

```bash
HEADLESS=0 python notebooklm_upload.py --file ./sample.pdf
```

Then update `selectors.md` and the script’s button/text locators.

## Engine Room integration (later)

DeepSeek/Qwen can add `POST /v1/notebooklm-upload` that:
1. Downloads a Drive file to a temp path
2. Shells out to this script
3. Returns `{ "share_url": "..." }`

## Security / COPPA

- Only use guardian-approved Google sessions
- Never commit `.auth/storage_state.json`
- Do not automate password entry; interactive login only
