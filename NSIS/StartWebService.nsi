!include "LogicLib.nsh" 
; RestartOrbit.nsi
OutFile "StartWebService.exe"
RequestExecutionLevel admin ; No admin rights needed
SilentInstall silent ; No visible window

var SERVICE_NAME
var NODEJS_PATH
Section
  StrCpy $NODEJS_PATH "$PROGRAMFILES64\nodejs"
  StrCpy $SERVICE_NAME "Orbit-Client-Service"

  ; Install NSSM and configure the service
  DetailPrint "Installing NSSM and configuring the service..."
  ; SetOutPath "$BASE_DIR"
  File "nssm.exe" ; Ensure nssm.exe is included in your NSIS script directory

  ; Create the service using NSSM
  nsExec::ExecToLog `"$EXEDIR\nssm.exe" install $SERVICE_NAME "$NODEJS_PATH\npm.cmd" "start"`
  nsExec::ExecToLog `"$EXEDIR\nssm.exe" set $SERVICE_NAME AppDirectory "$EXEDIR\ClientApp"`
  nsExec::ExecToLog `"$EXEDIR\nssm.exe" set $SERVICE_NAME AppStdout "$EXEDIR\ClientApp\log.txt"`
  nsExec::ExecToLog `"$EXEDIR\nssm.exe" set $SERVICE_NAME AppStderr "$EXEDIR\ClientApp\error.txt"`
  nsExec::ExecToLog `"$EXEDIR\nssm.exe" start $SERVICE_NAME`
  ; MessageBox MB_OK "Web service is Removed."
SectionEnd