@echo off
title AniVerse Launcher
echo ===================================================
echo Starting AniVerse Servers (Backend + Frontend)...
echo ===================================================

echo [1/2] Launching Backend Server on port 5000...
start "AniVerse Backend (Port 5000)" cmd /k "cd /d %~dp0backend && npm run dev"

timeout /t 3 /nobreak >nul

echo [2/2] Launching Frontend Server on port 3000...
start "AniVerse Frontend (Port 3000)" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 4 /nobreak >nul

echo Opening AniVerse Admin in your browser...
start http://localhost:3000/admin

echo ===================================================
echo AniVerse is up and running!
echo Frontend: http://localhost:3000
echo Admin:    http://localhost:3000/admin
echo Backend:  http://localhost:5000
echo ===================================================
pause
