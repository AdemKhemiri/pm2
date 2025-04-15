!include "LogicLib.nsh" 
; RestartOrbit.nsi
OutFile "dist\RemovePM2.exe"
RequestExecutionLevel admin ; No admin rights needed
SilentInstall silent ; No visible window

Section
  ExecWait '"$EXEDIR\nssm.exe" stop Orbit-PM2-Service'
  Sleep 3000
  ExecWait '"$EXEDIR\nssm.exe" remove Orbit-PM2-Service'
  ; MessageBox MB_OK "PM2 service is Removed."
SectionEnd