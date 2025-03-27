!include "LogicLib.nsh"
; RestartOrbit.nsi
OutFile "StartPM2Service.exe"
RequestExecutionLevel admin ; No admin rights needed
SilentInstall silent ; No visible window

var SERVICE_NAME
var NODEJS_PATH
Section
  StrCpy $NODEJS_PATH "$PROGRAMFILES64\nodejs"
  StrCpy $SERVICE_NAME "Orbit-PM2-Service"

  ; Install NSSM and configure the service
  DetailPrint "Installing NSSM and configuring the service..."
  SetOutPath "$EXEDIR"
  File "nssm.exe" ; Ensure nssm.exe is included in your NSIS script directory
  File "emsPM2.bat"
  ; Create the service using NSSM
  nsExec::ExecToLog `"$EXEDIR\nssm.exe" install $SERVICE_NAME "$EXEDIR\emsPM2.bat`
  nsExec::ExecToLog `"$EXEDIR\nssm.exe" set $SERVICE_NAME AppDirectory "$EXEDIR\ClientApp"`
  nsExec::ExecToLog `"$EXEDIR\nssm.exe" set $SERVICE_NAME AppStdout "$EXEDIR\PM2-log.txt"`
  nsExec::ExecToLog `"$EXEDIR\nssm.exe" set $SERVICE_NAME AppStderr "$EXEDIR\PM2-error.txt"`
  nsExec::ExecToLog `"$EXEDIR\nssm.exe" start $SERVICE_NAME`
  ; MessageBox MB_OK "Web service is Removed."
SectionEnd
