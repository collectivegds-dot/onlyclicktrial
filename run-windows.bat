@echo off
title ONLYCLICK v1.9.1
cd /d "%~dp0"

echo ==========================================
echo   ONLYCLICK v1.9.1
echo ==========================================
echo.

:: Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERROR: Node.js is not installed.
    echo Please install from: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do echo Node.js: %%i

:: Install backend dependencies
echo.
echo [1/3] Installing backend dependencies...
cd backend
call npm install
if %ERRORLEVEL% neq 0 (
    echo.
    echo ERROR: npm install failed. Check your internet connection and try again.
    cd ..
    pause
    exit /b 1
)
cd ..

:: Verify node_modules exists
if not exist "backend\node_modules\express" (
    echo.
    echo ERROR: Dependencies not installed properly. Retrying...
    cd backend
    call npm install --force
    cd ..
    if not exist "backend\node_modules\express" (
        echo ERROR: npm install failed after retry. Please run manually:
        echo   cd backend
        echo   npm install
        pause
        exit /b 1
    )
)

:: Run preflight
echo.
echo [2/3] Running preflight checks...
node backend/preflight.js

if %ERRORLEVEL% neq 0 (
    echo.
    echo ==========================================
    echo   Preflight failed. Troubleshooting:
    echo ==========================================
    echo.
    echo   Windows Defender blocking yt-dlp/ffmpeg?
    echo     1. Open Windows Security ^> Virus ^& threat protection
    echo     2. Click "Protection history"
    echo     3. Find yt-dlp.exe in blocked items ^> Allow
    echo     4. Restart ONLYCLICK
    echo.
    echo   npm install failed?
    echo     Try: cd backend ^&^& npm install --force
    echo.
    pause
    exit /b 1
)

:: Start server
echo.
echo [3/3] Starting ONLYCLICK...
echo.
echo ==========================================
echo   Open in browser: http://localhost:3002
echo   Press Ctrl+C to stop
echo ==========================================
echo.

node backend/server.js
pause
