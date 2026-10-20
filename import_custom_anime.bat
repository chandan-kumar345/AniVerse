@echo off
title AniVerse - Import Anime List
echo ===================================================
echo Importing Custom Anime List into AniVerse Database...
echo ===================================================
cd /d %~dp0backend
npm run import:custom
echo ===================================================
echo Import complete! Check http://localhost:3000/admin or the 18+ category.
echo ===================================================
pause
