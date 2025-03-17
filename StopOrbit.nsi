!include "LogicLib.nsh" 
; RestartOrbit.nsi
OutFile "dist\StopOrbit.exe"
RequestExecutionLevel admin ; No admin rights needed
SilentInstall silent ; No visible window

Section
  ExecWait '"$EXEDIR\nssm.exe" stop Orbit-Client-Service'
  Sleep 3000
  ExecWait '"$EXEDIR\nssm.exe" stop Orbit-PM2-Service'
  MessageBox MB_OK "The web service is paused."
SectionEnd