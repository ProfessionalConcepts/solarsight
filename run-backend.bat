@echo off
setlocal
cd /d "%~dp0backend"
echo ===================================================
echo Starting EnergyIQ FastAPI Backend on http://localhost:8000
echo Docs available at http://localhost:8000/docs
echo ===================================================
call .\venv\Scripts\uvicorn.exe app.main:app --reload --port 8000
pause
