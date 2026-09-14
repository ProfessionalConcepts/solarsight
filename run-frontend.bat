@echo off
setlocal
set "PATH=%LOCALAPPDATA%\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v24.19.0-win-x64;%PATH%"
cd /d "%~dp0frontend"
echo ===================================================
echo Starting EnergyIQ Next.js Frontend on http://localhost:3000
echo ===================================================
call npm run dev
pause
