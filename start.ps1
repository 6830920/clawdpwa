# ClawPWA PowerShell Start Script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ClawPWA Start Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/2] Starting OpenClaw Gateway..." -ForegroundColor Yellow
Write-Host "Note: If Gateway is running, run: openclaw gateway stop" -ForegroundColor Gray
Write-Host ""

Start-Process cmd -ArgumentList "/k", "openclaw gateway --port 18789 --verbose" -WindowStyle Normal -WindowTitle "OpenClaw Gateway"

Write-Host "Waiting for Gateway to start..." -ForegroundColor Gray
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "[2/2] Starting PWA client..." -ForegroundColor Yellow
Set-Location pwa-client
Start-Process cmd -ArgumentList "/k", "npm run dev" -WindowStyle Normal -WindowTitle "PWA Client"
Set-Location ..

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Services Started" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "OpenClaw Gateway: ws://127.0.0.1:18789" -ForegroundColor White
Write-Host "PWA Client: http://localhost:3000" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to open browser"

Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "Tips:" -ForegroundColor Yellow
Write-Host "- View Gateway logs in 'OpenClaw Gateway' window" -ForegroundColor Gray
Write-Host "- View PWA client logs in 'PWA Client' window" -ForegroundColor Gray
Write-Host "- Press Ctrl+C in each window to stop services" -ForegroundColor Gray
Write-Host ""
Read-Host "Press Enter to exit"
