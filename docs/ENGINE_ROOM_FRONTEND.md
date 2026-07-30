# Frontend ↔ Engine Room

## Enable transcript & notebook ingestion

1. Root `.env` (or rely on code default):

```env
VITE_ENGINE_ROOM_URL=http://localhost:8000
```

2. Restart the Vite/Node dev server (`npm run dev`) after changing any `VITE_*` variable.

3. Start Engine Room:

```bat
cd engine-room
.venv\Scripts\activate.bat
uvicorn main:app --reload --port 8000
```

4. Confirm:

```bat
curl http://localhost:8000/health
```

## What becomes available

| Feature | Endpoint |
|---------|----------|
| YouTube → lesson + transcript | `POST /v1/lessons/ingest` |
| List lessons | `GET /v1/lessons?userId=` |
| Notebook attach (optional) | same ingest with `addToNotebook: true` + Google token |
| ER AI chat | `POST /v1/ai-chat` |

`ingestLesson()` in `src/lib/api.ts` throws if Engine Room URL is not configured.

## CORS

`engine-room/.env` must include the frontend origin:

```env
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

## Disable Engine Room

Set an **explicit empty** value in `.env`:

```env
VITE_ENGINE_ROOM_URL=
```

(omit the line and the app defaults to `http://localhost:8000` in source.)
