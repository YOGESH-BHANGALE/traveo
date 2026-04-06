@echo off
title Traveo+ Launcher

echo.
echo   ╔══════════════════════════════════════╗
echo   ║        Traveo+ Starting Up           ║
echo   ╚══════════════════════════════════════╝
echo.

:: Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo   [ERROR] Node.js not found. Install from https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do echo   [OK] Node.js %%v

:: Install server deps if missing
if not exist "server\node_modules" (
    echo.
    echo   [INFO] Installing server dependencies...
    cd server
    call npm install --legacy-peer-deps
    cd ..
    echo   [OK] Server dependencies installed
) else (
    echo   [OK] Server dependencies ready
)

:: Install client deps if missing
if not exist "client\node_modules" (
    echo.
    echo   [INFO] Installing client dependencies...
    cd client
    call npm install --legacy-peer-deps
    cd ..
    echo   [OK] Client dependencies installed
) else (
    echo   [OK] Client dependencies ready
)

:: Copy .env files if missing
if not exist "server\.env" (
    echo   [WARN] server\.env missing — copying from .env.example
    copy "server\.env.example" "server\.env"
    echo   [WARN] Edit server\.env and fill in MONGODB_URI and JWT_SECRET
)

if not exist "client\.env.local" (
    echo   [WARN] client\.env.local missing — copying from .env.example
    copy "client\.env.example" "client\.env.local"
)

echo.
echo   [INFO] Launching server on http://localhost:5000
echo   [INFO] Launching client on http://localhost:3000
echo.

:: Start server in new window
start "Traveo+ Server" cmd /k "cd /d %~dp0server && npm run dev"

:: Wait 2 seconds then start client
timeout /t 2 /nobreak >nul
start "Traveo+ Client" cmd /k "cd /d %~dp0client && npm run dev"

echo   [OK] Both processes launched.
echo   [OK] Open http://localhost:3000 in your browser.
echo.
pause
