@echo off
title EditFlow Pro v16 - Installer

echo ==================================
echo    EditFlow Pro v16 - Installer
echo ==================================
echo.

set "DEST=%APPDATA%\Adobe\CEP\extensions\EditFlowPro"

REM Safety: don't run if already in the CEP path
if /I "%~dp0"=="%DEST%\" (
    echo Already installed. No action needed.
    echo Open Premiere ^> Window ^> Extensions ^> EditFlow Pro
    echo.
    pause
    exit /b 0
)

REM Create extensions directory if it doesn't exist
if not exist "%APPDATA%\Adobe\CEP\extensions\" (
    mkdir "%APPDATA%\Adobe\CEP\extensions\"
)

REM Remove old version
if exist "%DEST%" (
    echo Removing old version...
    rd /s /q "%DEST%"
)

REM Copy extension folder
echo Installing EditFlow Pro...
xcopy /E /I /Q "%~dp0" "%DEST%\"

if errorlevel 1 (
    echo.
    echo ERROR: Could not copy files.
    echo Make sure Adobe Premiere Pro is closed and try again.
    echo.
    pause
    exit /b 1
)

REM Enable CEP debug mode in Registry (no admin required)
echo Enabling CEP debug mode...
reg add "HKCU\SOFTWARE\Adobe\CSXS.12" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
reg add "HKCU\SOFTWARE\Adobe\CSXS.11" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
reg add "HKCU\SOFTWARE\Adobe\CSXS.10" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
reg add "HKCU\SOFTWARE\Adobe\CSXS.9"  /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1

echo.
echo ==================================
echo    Installation complete!
echo ==================================
echo.
echo Next step:
echo   Open Adobe Premiere Pro
echo   Window ^> Extensions ^> EditFlow Pro
echo.
pause
