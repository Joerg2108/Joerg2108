@echo off
chcp 65001 >nul
title BauDaH Office
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js fehlt. Bitte von https://nodejs.org die LTS-Version installieren. & pause & exit /b)
if not exist node_modules (echo Erstinstallation ... & call npm install --omit=dev)
start "" http://localhost:3000
node server.js
pause
