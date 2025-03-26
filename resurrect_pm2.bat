@echo off

SET PM2_HOME=%USERPROFILE%\.pm2
SET HOMEPATH=%USERPROFILE%

pm2 resurrect
pause
