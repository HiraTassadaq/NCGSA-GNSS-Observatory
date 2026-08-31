@echo off
title GNSS Dashboard Orchestrator
echo ===================================================
echo   GNSS ORBIT & SIGNAL TELEMETRY DASHBOARD LAUNCHER
echo ===================================================
echo.

echo [1/2] Launching Python FastAPI backend on http://127.0.0.1:8000 ...
start "FastAPI Backend Server" cmd /k "cd backend && venv\Scripts\python run.py"

timeout /t 3 >nul

echo [2/2] Launching React Vite frontend on http://localhost:5173 ...
start "Vite React Client" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo   Both services are launching in separate windows!
echo   Open http://localhost:5173 in your web browser.
echo ===================================================
pause
