!include "MUI.nsh"
!include "LogicLib.nsh"
!include "WinMessages.nsh" ; Include the WinMessages header for WM_SETTINGCHANGE

OutFile "SetupOrbit.exe"
InstallDir "$PROGRAMFILES\Orbit"
RequestExecutionLevel admin

Var BASE_DIR
Var SERVICE_NAME
Var PM2_SERVICE_NAME
Var NODEJS_PATH
Var NPM_GLOBAL_DIR

; MUI Settings
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_LANGUAGE "English"

Section "Install Orbit"

  ; Set variables
  StrCpy $BASE_DIR "$INSTDIR"
  StrCpy $NODEJS_PATH "$PROGRAMFILES64\nodejs"

  ; Get the global npm directory
  ExecWait '"$PROGRAMFILES64\nodejs\npm.cmd" config get prefix' $NPM_GLOBAL_DIR
  ${If} $NPM_GLOBAL_DIR == ""
    MessageBox MB_OK "Failed to retrieve the global npm directory."
    Abort
  ${EndIf}

  ; Add the global npm directory to the PATH
  DetailPrint "Adding global npm directory to PATH..."
  System::Call 'Kernel32::SetEnvironmentVariable(t "PATH", t "$NPM_GLOBAL_DIR;$PROGRAMFILES64\nodejs;%PATH%")'

  ; Install PM2 globally
  DetailPrint "Installing PM2 globally..."
  ExecWait '"$PROGRAMFILES64\nodejs\npm.cmd" install -g pm2' $0
  ${If} $0 != 0
    MessageBox MB_OK "PM2 installation failed with exit code $0."
    Abort
  ${EndIf}

  ; Create installation directory
  CreateDirectory "$BASE_DIR"
  CreateDirectory "$BASE_DIR\ClientApp"

  ; Embed ClientApp files
  DetailPrint "Embedding ClientApp files..."
  SetOutPath "$INSTDIR\ClientApp"
  File /r "ClientApp\*"

  ; Install dependencies for ClientApp
  DetailPrint "Installing dependencies for ClientApp..."
  ExecWait '"$PROGRAMFILES64\nodejs\npm.cmd" install --prefix "$INSTDIR\ClientApp"' $1
  ${If} $1 != 0
    MessageBox MB_OK "npm install failed with exit code $1."
    Abort
  ${EndIf}
SectionEnd
; Add this section to your existing script

Section "Add npm to System PATH"
  ; Get the npm global directory (e.g., C:\Users\<Username>\AppData\Roaming\npm)
  StrCpy $NPM_GLOBAL_DIR "$APPDATA\npm"

  ; Read the current system PATH from the registry
  ReadRegStr $0 HKLM "SYSTEM\CurrentControlSet\Control\Session Manager\Environment" "Path"
  ${If} $0 == ""
    MessageBox MB_OK "Failed to read system PATH."
    Abort
  ${EndIf}

  ; Check if the npm global directory is already in the system PATH
  ${If} $0 == $NPM_GLOBAL_DIR
    DetailPrint "npm global directory is already in the system PATH."
  ${ElseIf} $0 == "$NPM_GLOBAL_DIR;$0"
    DetailPrint "npm global directory is already in the system PATH."
  ${Else}
    ; Append the npm global directory to the system PATH
    StrCpy $0 "$0;$NPM_GLOBAL_DIR"
    WriteRegStr HKLM "SYSTEM\CurrentControlSet\Control\Session Manager\Environment" "Path" "$0"
    System::Call 'Kernel32::SetEnvironmentVariable(t "PATH", t "$0")'
    SendMessage ${HWND_BROADCAST} ${WM_WININICHANGE} 0 "STR:Environment" /TIMEOUT=5000
    DetailPrint "npm global directory added to system PATH."
  ${EndIf}

  ; Add RestartOrbit utility
  SetOutPath "$BASE_DIR"
  File "RestartOrbit.exe"
  File "StopOrbit.exe"
SectionEnd

Section "Create PM2 Resurrect Script"
  ; Set output path to installation directory
  SetOutPath "$INSTDIR"

  ; Create the batch file
  FileOpen $0 "$INSTDIR\pm2_resurrect.bat" w
  FileWrite $0 "@echo off$\r$\n"
  FileWrite $0 "set HOMEDRIVE=C:$\r$\n"
  ; Set PM2_HOME dynamically to the user's .pm2 directory
  FileWrite $0 "set PM2_HOME=$PROFILE\.pm2$\r$\n$\r$\n"
  
  ; Add PM2 to PATH dynamically
  ; FileWrite $0 "set path=$APPDATA\npm;%%path%%$\r$\n$\r$\n"
  
  ; Add optional PM2 kill with comments
  FileWrite $0 "@REM Uncomment below to kill existing PM2 processes first$\r$\n"
  FileWrite $0 "@REM pm2 kill$\r$\n"
  FileWrite $0 "@REM timeout /t 5 /nobreak > NUL$\r$\n$\r$\n"
  
  ; Main resurrect command
  FileWrite $0 "pm2 resurrect$\r$\n$\r$\n"
  FileWrite $0 "echo Done$\r$\n"
  ; FileWrite $0 "pause$\r$\n"
  FileClose $0

SectionEnd

Section "Configuring Services"
  StrCpy $SERVICE_NAME "Orbit-Client-Service"
  StrCpy $PM2_SERVICE_NAME "Orbit-PM2-Service"

  ; Install NSSM and configure the service
  DetailPrint "Installing NSSM and configuring the service..."
  SetOutPath "$BASE_DIR"
  File "nssm.exe" ; Ensure nssm.exe is included in your NSIS script directory

  ; Create the service using NSSM
  nsExec::ExecToLog `"$BASE_DIR\nssm.exe" install $SERVICE_NAME "$NODEJS_PATH\npm.cmd" "start"`
  nsExec::ExecToLog `"$BASE_DIR\nssm.exe" set $SERVICE_NAME AppDirectory "$INSTDIR\ClientApp"`
  nsExec::ExecToLog `"$BASE_DIR\nssm.exe" set $SERVICE_NAME AppStdout "$INSTDIR\ClientApp\log.txt"`
  nsExec::ExecToLog `"$BASE_DIR\nssm.exe" set $SERVICE_NAME AppStderr "$INSTDIR\ClientApp\error.txt"`
  nsExec::ExecToLog `"$BASE_DIR\nssm.exe" start $SERVICE_NAME`
  
  Sleep 3000 ; 3-second delay

  ; Create the PM2 service using NSSM
  nsExec::ExecToLog `"$BASE_DIR\nssm.exe" install $PM2_SERVICE_NAME "$INSTDIR\pm2_resurrect.bat"`
  nsExec::ExecToLog `"$BASE_DIR\nssm.exe" set $PM2_SERVICE_NAME AppDirectory "$INSTDIR"`

  nsExec::ExecToLog `"$BASE_DIR\nssm.exe" start $PM2_SERVICE_NAME`

;   ${If} $0 != 0
;     MessageBox MB_OK "Service configuration failed with exit code $0."
;     Abort
;   ${EndIf}

  DetailPrint "Service $SERVICE_NAME configured and started successfully."
SectionEnd




Section -AdditionalIcons
  ; Add an uninstaller
  WriteUninstaller "$INSTDIR\Uninstall.exe"
SectionEnd

Section "Uninstall"
  ; Stop and remove the service
  DetailPrint "Stopping and removing the service..."
  nsExec::ExecToLog `"$INSTDIR\nssm.exe" stop $SERVICE_NAME`
  Sleep 3000 ; 3-second delay
  nsExec::ExecToLog `"$INSTDIR\nssm.exe" remove $SERVICE_NAME confirm`

  ; Clean up files
  DetailPrint "Deleting installation files..."
  Delete "$INSTDIR\RestartOrbit.exe"
  Delete "$INSTDIR\StopOrbit.exe"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir /r "$INSTDIR"

  DetailPrint "Uninstallation complete."
SectionEnd