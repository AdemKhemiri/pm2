@echo off

SET PM2_HOME=%USERPROFILE%\.pm2
SET HOMEPATH=%USERPROFILE%

cd "C:\Program Files (x86)\Orbit\ClientApp"
pm2 start ".\app.js" -f

sleep 1000

pm2 save -f
pause
