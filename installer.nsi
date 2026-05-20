; ============================================================
; EditFlow Pro - Windows NSIS Installer Script
; Compiles into a single EditFlow Pro Installer.exe
; ============================================================

!define APP_NAME "EditFlow Pro"
!define COMP_NAME "Najm Media"
!define VERSION "1.2.6"

Name "${APP_NAME}"
OutFile "EditFlow Pro Installer.exe"
InstallDir "$APPDATA\Adobe\CEP\extensions\EditFlowPro"

; Request application privileges for current user (no admin popup!)
RequestExecutionLevel user

; Default theme and style
XPStyle on
ShowInstDetails show

Page directory
Page instfiles

Section "Install"
  ; Clean up old installation
  DetailPrint "Cleaning up old installation directory..."
  RMDir /r "$INSTDIR"
  
  ; Set output path to installation directory
  SetOutPath "$INSTDIR"
  
  ; Copy all extension files recursively
  DetailPrint "Copying files..."
  File /r "build_win_tmp/EditFlowPro/*"
  
  ; Enable CEP Debug Mode in Registry (HKEY_CURRENT_USER - no admin needed)
  DetailPrint "Configuring Adobe CEP environment..."
  WriteRegStr HKCU "SOFTWARE\Adobe\CSXS.9" "PlayerDebugMode" "1"
  WriteRegStr HKCU "SOFTWARE\Adobe\CSXS.10" "PlayerDebugMode" "1"
  WriteRegStr HKCU "SOFTWARE\Adobe\CSXS.11" "PlayerDebugMode" "1"
  WriteRegStr HKCU "SOFTWARE\Adobe\CSXS.12" "PlayerDebugMode" "1"
  WriteRegStr HKCU "SOFTWARE\Adobe\CSXS.13" "PlayerDebugMode" "1"
  WriteRegStr HKCU "SOFTWARE\Adobe\CSXS.14" "PlayerDebugMode" "1"
  WriteRegStr HKCU "SOFTWARE\Adobe\CSXS.15" "PlayerDebugMode" "1"
  WriteRegStr HKCU "SOFTWARE\Adobe\CSXS.16" "PlayerDebugMode" "1"

  DetailPrint "Installation Complete!"
SectionEnd
