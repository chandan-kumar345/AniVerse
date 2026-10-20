@echo off
title AniVerse - Import Media Links from CSV
echo ===================================================
echo Importing Posters and Video Links from anime_media_links.csv...
echo ===================================================
cd /d %~dp0backend
npm run import:csv
echo ===================================================
echo Import Finished! Check http://localhost:3000
echo ===================================================
pause
