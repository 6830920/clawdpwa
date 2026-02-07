@echo off
REM ClawPWA Start Script
REM This script starts OpenClaw Gateway and PWA client

echo ========================================
echo ClawPWA Start Script
echo ========================================
echo.

echo [1/2] Starting OpenClaw Gateway...
echo Note: If Gateway is already running, run: openclaw gateway stop
echo.
start "OpenClaw Gateway" cmd /k "openclaw gateway --port 18789 --verbose"

echo Waiting for Gateway to start...
timeout /t 3 /nobreak >nul

echo.
echo [2/2] Starting PWA client...
cd pwa-client
start "PWA Client" cmd /k "npm run dev"

echo.
echo ========================================
echo Services Started
echo ========================================
echo.
echo OpenClaw Gateway: ws://127.0.0.1:18789
echo PWA Client: http://localhost:3000
echo.
echo Press any key to open browser...
pause >nul

start http://localhost:3000

echo.
echo Tips:
echo - View Gateway logs in "OpenClaw Gateway" window
echo - View PWA client logs in "PWA Client" window
echo - Press Ctrl+C in each window to stop services
echo.
pause
