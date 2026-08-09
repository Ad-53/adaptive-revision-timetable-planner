@echo off
title RevisionAI Server Launcher

echo ============================================
echo   RevisionAI - Adaptive Revision Timetable
echo   Server Launcher
echo ============================================
echo.

REM Check if venv exists
if exist "venv\Scripts\python.exe" (
    echo [1/3] Activating virtual environment...
    call venv\Scripts\activate.bat
) else (
    echo [1/3] No virtual environment found. Using system Python.
)

echo [2/3] Starting FastAPI server with Uvicorn...
uvicorn main:app --reload

REM Wait for server to start and then open browser in background
timeout /t 3 >nul

REM Open default browser to login page (runs in background)
start http://127.0.0.1:5000/frontend/login.html

echo.
echo ============================================
echo   Server is running!
echo   Browser opened to: http://127.0.0.1:5000/frontend/login.html
echo ============================================
echo.
echo Press Ctrl+C to stop the server.
echo.
REM Keep window open - server runs here
