@echo off
REM ClawPWA Stop Script

echo ========================================
echo ClawPWA Stop Script
echo ========================================
echo.

echo Stopping OpenClaw Gateway...
openclaw gateway stop

echo.
echo Gateway stopped
echo Note: PWA client must be stopped manually (press Ctrl+C in its window)
echo.
pause
