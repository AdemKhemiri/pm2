@REM TIMEOUT 5

@echo off
setlocal

:: Get current PATH
for /f "tokens=2 delims= " %%A in ('reg query "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v Path 2^>nul') do set CURRENT_PATH=%%A

:: Check if %APPDATA%\npm is already in PATH
echo %CURRENT_PATH% | findstr /I /C:"%APPDATA%\npm" >nul
if %errorlevel%==0 (
    echo npm path already exists in PATH. No changes made.
) else (
    echo Adding npm path to system variables...
    setx PATH "%CURRENT_PATH%;%APPDATA%\npm" /M
    echo Done! Restart your terminal to apply changes.
)

endlocal
pause


SET PM2_HOME=%USERPROFILE%\.pm2
SET HOMEPATH=%USERPROFILE%
@REM set PATH=%PATH%;%APPDATA%\npm

pm2 kill
taskkill /f /im node.exe
TIMEOUT 5
cd C:\EMS
pm2 start .\data-reading.js
cmd /k

@REM add %Appdata%/npm to system varaible
