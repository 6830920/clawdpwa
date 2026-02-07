@echo off
REM ClawPWA Setup Script
REM This script configures OpenClaw PWA plugin

echo ========================================
echo ClawPWA Setup Script
echo ========================================
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js not found. Please install Node.js ^>= 22.0.0
    pause
    exit /b 1
)

echo [1/6] Checking OpenClaw installation...
where openclaw >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] OpenClaw not found. Install it: npm install -g openclaw
    pause
    exit /b 1
)
echo [OK] OpenClaw is installed

echo.
echo [2/6] Building Gateway plugin...
cd gateway-plugin
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install Gateway plugin dependencies
    pause
    exit /b 1
)
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to build Gateway plugin
    pause
    exit /b 1
)
echo [OK] Gateway plugin built successfully
cd ..

echo.
echo [3/6] Copying plugin to OpenClaw skills directory...
set "SKILLS_DIR=%USERPROFILE%\.openclaw\workspace\skills\pwa-channel"
if not exist "%SKILLS_DIR%" (
    mkdir "%SKILLS_DIR%"
)
xcopy /E /I /Y gateway-plugin\dist "%SKILLS_DIR%"
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to copy plugin files
    pause
    exit /b 1
)
echo [OK] Plugin copied to %SKILLS_DIR%

echo.
echo [4/6] Configuring OpenClaw...
set "CONFIG_FILE=%USERPROFILE%\.openclaw\openclaw.json"
if exist "%CONFIG_FILE%" (
    echo [INFO] Config file exists, please manually add PWA channel config
    echo.
    echo Add to %CONFIG_FILE%:
    echo.
    echo { "channels": { "pwa": { "enabled": true, "path": "/pwa" } } }
) else (
    echo [INFO] Creating default config file
    echo {"agent":{"model":"anthropic/claude-opus-4-6"},"channels":{"pwa":{"enabled":true,"path":"/pwa"}},"gateway":{"bind":"loopback","port":18789}} > "%CONFIG_FILE%"
    echo [OK] Default config created
)

echo.
echo [5/6] Installing PWA client dependencies...
cd pwa-client
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install PWA client dependencies
    pause
    exit /b 1
)
echo [OK] PWA client dependencies installed
cd ..

echo.
echo [6/6] Verifying installation...
call openclaw doctor
echo.
echo [OK] Installation complete!
echo.
echo ========================================
echo Next Steps:
echo ========================================
echo.
echo 1. Restart OpenClaw Gateway:
echo    openclaw gateway stop
echo    openclaw gateway --port 18789 --verbose
echo.
echo 2. Start PWA client:
echo    cd pwa-client
echo    npm run dev
echo.
echo 3. Open browser: http://localhost:3000
echo.
echo ========================================
pause
