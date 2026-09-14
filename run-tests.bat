@echo off
setlocal
cd /d "%~dp0backend"
echo ===================================================
echo Running EnergyIQ Assessment Engine Golden Tests
echo ===================================================
call .\venv\Scripts\pytest.exe tests/test_engine.py -v
pause
