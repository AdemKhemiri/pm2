!include "LogicLib.nsh" 
; RestartOrbit.nsi
OutFile "dist\RestartOrbit.exe"
RequestExecutionLevel admin ; No admin rights needed
SilentInstall silent ; No visible window

Section
  ExecWait '"$EXEDIR\nssm.exe" stop Orbit-Client-Service'
  Sleep 2000
  ExecWait '"$EXEDIR\nssm.exe" stop Orbit-PM2-Service'
  Sleep 2000
  ExecWait '"$EXEDIR\nssm.exe" start Orbit-Client-Service'
  ExecWait '"$EXEDIR\nssm.exe" start Orbit-PM2-Service'
  MessageBox MB_OK "The web service has restarted."
SectionEnd