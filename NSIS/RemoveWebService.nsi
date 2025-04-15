!include "LogicLib.nsh" 
; RestartOrbit.nsi
OutFile "dist\RemoveWebService.exe"
RequestExecutionLevel admin ; No admin rights needed
SilentInstall silent ; No visible window

Section
  ExecWait '"$EXEDIR\nssm.exe" pause Orbit-Client-Service'
  Sleep 3000
  ExecWait '"$EXEDIR\nssm.exe" remove Orbit-Client-Service'
  ; MessageBox MB_OK "Web service is Removed."
SectionEnd