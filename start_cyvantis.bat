@echo off
title CYVANTIS Enterprise Gateway Nexus
echo ========================================================
echo   CYVANTIS Enterprise Gateway ^& Security Nexus
echo ========================================================
echo [1/3] Launching FastAPI Backend Server (Port 8000)...
start "CYVANTIS Backend" /min cmd /c "cd /d %~dp0backend && venv\Scripts\activate.bat && venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

echo [2/3] Launching React Frontend Dev Server (Port 5173)...
start "CYVANTIS Frontend" /min cmd /c "cd /d %~dp0frontend && npm run dev"

echo [3/3] Launching Web Browser Dashboard...
timeout /t 3 /nobreak >nul
start http://localhost:5173

echo.
echo ========================================================
echo  [+] CYVANTIS Platform is live and running!
echo  [+] Website: http://localhost:5173
echo  [+] API Docs: http://127.0.0.1:8000/api/v1/docs
echo ========================================================
