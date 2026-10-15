@echo off
chcp 65001 >nul
title BauDaH Office - Demo-Link
where cloudflared >/dev/null 2>/dev/null || goto :fehlt
echo.
echo  Gleich erscheint unten ein Link, der auf .trycloudflare.com endet.
echo  Diesen Link an den Kunden schicken.
echo  Dieses Fenster UND das Demo-Fenster offen lassen, solange die Demo erreichbar sein soll.
echo.
cloudflared tunnel --url http://localhost:3001
pause
exit /b
:fehlt
echo.
echo  cloudflared ist noch nicht installiert. Einmalig in der Eingabeaufforderung eingeben:
echo.
echo      winget install --id Cloudflare.cloudflared
echo.
echo  Danach dieses Fenster schliessen und demo-link.bat erneut starten.
pause
