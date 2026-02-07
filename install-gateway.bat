@echo off
REM Manual install script for Gateway plugin (simplified version)

echo ========================================
echo Installing Gateway Plugin
echo ========================================
echo.

cd gateway-plugin

echo [1/3] Cleaning old dependencies...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del /q package-lock.json

echo [2/3] Installing dependencies...
npm install --no-optional --no-audit --no-fund
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] npm install failed
    echo.
    echo Trying alternative method...
    echo.
    npm install --legacy-peer-deps
)

echo [3/3] Building plugin...
npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Build failed
    pause
    exit /b 1
)

cd ..

echo.
echo ========================================
echo SUCCESS!
echo ========================================
echo.
echo Plugin built successfully!
echo.
echo Next: Copy to OpenClaw skills directory
echo.
pause
