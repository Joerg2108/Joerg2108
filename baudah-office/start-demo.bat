@echo off
chcp 65001 >nul
title BauDaH Office - Online-Demo
cd /d "%~dp0"
where node >/dev/null 2>/dev/null || (echo Node.js fehlt. Bitte von https://nodejs.org die LTS-Version installieren. & pause & exit /b)
if not exist node_modules call npm install --omit=dev
rem Getrennte Demo-Kopie: eigener Datenordner, eigener Port - echte Daten bleiben unberuehrt
set BAUDAH_DEMO=1
set BAUDAH_DATA=%~dp0demo-data
set PORT=3001
start "" http://localhost:3001
node server.js
pause
