# 🧠 Family Edu System — AI Engine Room

The **Engine Room** is a local FastAPI orchestrator that powers the Family Educational ERP. It sits between the React dashboard and Google Workspace / OCR / LLMs, handling authentication, Drive/Classroom operations, AI chat, document processing, and curriculum generation.

## Architecture

```
engine-room/
├── main.py              # FastAPI app entry, route registration
├── auth/
│   └── google_auth.py   # OAuth code exchange, token refresh, encrypted storage
├── services/
│   ├── drive.py         # Google Drive folder creation, quota, file upload
│   ├── classroom.py     # Classroom coursework sync, submission, turn-in
│   ├── ocr.py           # Baidu OCR pipeline (Drive download → OCR → text)
│   ├── ai_chat.py       # Persona-aware chat via OpenRouter / Gemini
│   └── curriculum.py    # Study block & assignment draft generation
├── db/
│   └── sqlite.py        # Encrypted token & profile store (SQLite + Fernet)
├── models/
│   └── schemas.py       # Pydantic request/response models
└── tests/
    └── test_health.py   # Health endpoint test
```

## Quick Start

### 1. Prerequisites
- Python 3.11+
- Google Cloud project with Drive & Classroom APIs enabled
- (Optional) OpenRouter API key for AI chat
- (Optional) Baidu OCR API credentials

### 2. Setup

```bash
cd engine-room
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Configure

```bash
cp .env.example .env
# Edit .env with your credentials
# Generate TOKEN_ENCRYPTION_KEY:
python -c "import secrets; print(secrets.token_hex(32))"
```

### 4. Run

```bash
uvicorn main:app --reload --port 8000
```

### 5. Verify

```bash
curl http://localhost:8000/health
# → {"status":"ok"}
```

## API Endpoints

| Method | Path                          | Purpose                           |
|--------|-------------------------------|-----------------------------------|
| GET    | `/health`                     | Liveness check                    |
| POST   | `/v1/auth/exchange-code`      | OAuth code → access/refresh tokens|
| POST   | `/v1/auth/refresh`            | Refresh an expired access token   |
| GET    | `/v1/drive-usage`             | Drive storage quota               |
| POST   | `/v1/sync-classroom`          | Pull assignments from Classroom   |
| POST   | `/v1/submit-assignment`       | Upload file + turn in to Classroom|
| POST   | `/v1/process-document`        | OCR a document from Drive         |
| POST   | `/v1/ai-chat`                 | Persona-aware AI chat             |
| POST   | `/v1/generate-curriculum`     | Generate study blocks             |
| GET    | `/v1/progress-analytics`      | Student progress metrics (stub)   |

## Security Rules

1. **Zero cross-user token use** — every Google call uses that user's token only.
2. **Tokens encrypted at rest** via Fernet (symmetric AES-128-CBC).
3. **COPPA-aware** — no external PII for ages ≤13 beyond what Google holds.
4. **No passwords** — OAuth only for adult Google accounts.
5. **Never commit `.env` or real tokens.**