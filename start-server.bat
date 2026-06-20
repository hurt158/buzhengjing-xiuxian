@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

title ===== Bu Zheng Jing Xiu Xian =====

echo ========================================
echo    Bu Zheng Jing Xiu Xian - Launcher
echo ========================================
echo.

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Please install: https://nodejs.org
    echo.
    pause
    exit /b 1
)

echo [1/3] Starting server...

set "SERVER_DIR=%~dp0"
start "GameServer" cmd /c "node "%SERVER_DIR%server.js" 8080 & pause"

echo [2/3] Waiting for server...
set "waited=0"

:wait
timeout /t 1 /nobreak >nul
set /a waited+=1

powershell -NoProfile -Command "$r=try{$w=Invoke-WebRequest 'http://localhost:8080/' -UseBasicParsing -TimeoutSec 2;$w.StatusCode}catch{0};if($r-eq200){exit 0}else{exit 1}" >nul 2>&1
if !errorlevel! equ 0 goto ready

if !waited! lss 8 goto wait

echo [WARNING] Server start timeout. Open http://localhost:8080 manually.
goto done

:ready
echo [3/3] Server ready! Opening browser...
start "" "http://localhost:8080"

:done
echo.
echo ========================================
echo    Server: http://localhost:8080
echo    Close this window to stop server
echo ========================================
echo.
pause
