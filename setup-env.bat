@echo off
setlocal EnableExtensions
cd /d "%~dp0"

echo.
echo === Family Edu Hub — env bootstrap ===
echo.

if not exist ".env" (
  copy /Y ".env.example" ".env" >nul
  echo [OK] Created .env from .env.example
) else (
  echo [skip] .env already exists
)

if not exist "engine-room\.env" (
  copy /Y "engine-room\.env.example" "engine-room\.env" >nul
  echo [OK] Created engine-room\.env from .env.example
) else (
  echo [skip] engine-room\.env already exists
)

echo.
echo Generating TOKEN_ENCRYPTION_KEY (paste into engine-room\.env if empty):
echo.
python -c "import secrets; print(secrets.token_hex(32))" 2>nul
if errorlevel 1 (
  echo python not found — install Python or run:
  echo   python -c "import secrets; print(secrets.token_hex(32))"
)

echo.
echo Next steps:
echo   1. Edit .env              → GEMINI_API_KEY, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
echo   2. Edit engine-room\.env  → same Google keys + OPENROUTER_API_KEY + TOKEN_ENCRYPTION_KEY
echo   3. Google Console: enable Classroom + Drive; add redirect URIs from docs\ENV_SETUP.md
echo   4. npm run dev
echo   5. cd engine-room ^&^& .venv\Scripts\activate.bat ^&^& uvicorn main:app --reload --port 8000
echo.
echo Full guide: docs\ENV_SETUP.md
echo.
pause
