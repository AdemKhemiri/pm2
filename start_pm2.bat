@echo off

:: Configure Environment
SET PM2_HOME=%USERPROFILE%\.pm2
SET PATH=%PATH%;C:\Windows\System32;C:\Program Files\nodejs;%APPDATA%\npm

:: Kill Existing Processes
taskkill /f /im node.exe >nul 2>&1
timeout 2 >nul

:: Start Application
cd /d "C:\Program Files (x86)\Orbit\ClientApp\"

:: Launch with PM2 and proper exit handling
pm2 start app.js
