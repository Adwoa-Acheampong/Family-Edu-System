# NotebookLM UI Selectors

NotebookLM has **no public API**. Selectors break when Google changes the UI.
Update this file whenever automation fails after a Google redesign.

> Last verified: **not yet run against live NotebookLM** — treat as a starting template.

## Auth / session

| Purpose | Strategy |
|---------|----------|
| Login | Manual one-time login; save `storage_state.json` |
| Session file | `scripts/playwright/.auth/storage_state.json` (gitignored) |

## Core flows (placeholders — refine on first live run)

| Step | Suggested approach |
|------|--------------------|
| Open app | `https://notebooklm.google.com/` |
| New notebook | Button/role text containing "New" / "Create" |
| Upload source | File input or "Add source" → upload |
| Wait for processing | Wait for network idle + text like "Ready" / source chip |
| Share / link | Share control → copy link field |

## Maintenance rule

1. Run with `HEADLESS=0` when debugging.
2. Prefer `get_by_role` / `get_by_text` over brittle CSS.
3. After Google UI changes, update this doc first, then the script.
