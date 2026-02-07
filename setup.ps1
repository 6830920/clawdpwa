# ClawPWA PowerShell Setup Script
# This script configures OpenClaw PWA plugin (PowerShell version)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ClawPWA Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "[1/6] Checking OpenClaw installation..." -ForegroundColor Yellow
$nodeCheck = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCheck) {
    Write-Host "[ERROR] Node.js not found. Please install Node.js >= 22.0.0" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check OpenClaw
$openclawCheck = Get-Command openclaw -ErrorAction SilentlyContinue
if (-not $openclawCheck) {
    Write-Host "[ERROR] OpenClaw not found. Install it: npm install -g openclaw" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "[OK] OpenClaw is installed" -ForegroundColor Green

# Build Gateway plugin
Write-Host ""
Write-Host "[2/6] Building Gateway plugin..." -ForegroundColor Yellow
Set-Location gateway-plugin
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to install dependencies" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to build plugin" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "[OK] Gateway plugin built" -ForegroundColor Green
Set-Location ..

# Copy plugin
Write-Host ""
Write-Host "[3/6] Copying plugin to OpenClaw skills..." -ForegroundColor Yellow
$skillsPath = "$env:USERPROFILE\.openclaw\workspace\skills\pwa-channel"
if (-not (Test-Path $skillsPath)) {
    New-Item -ItemType Directory -Force -Path $skillsPath | Out-Null
}
Copy-Item -Path "gateway-plugin\dist\*" -Destination $skillsPath -Recurse -Force
Write-Host "[OK] Plugin copied to $skillsPath" -ForegroundColor Green

# Configure OpenClaw
Write-Host ""
Write-Host "[4/6] Configuring OpenClaw..." -ForegroundColor Yellow
$configPath = "$env:USERPROFILE\.openclaw\openclaw.json"
if (Test-Path $configPath) {
    Write-Host "[INFO] Config file exists. Please add PWA channel manually:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host 'Add to openclaw.json:' -ForegroundColor White
    Write-Host '{ "channels": { "pwa": { "enabled": true, "path": "/pwa" } } }' -ForegroundColor Gray
} else {
    Write-Host "[INFO] Creating default config" -ForegroundColor Cyan
    $defaultConfig = @{
        agent = @{
            model = "anthropic/claude-opus-4-6"
        }
        channels = @{
            pwa = @{
                enabled = $true
                path = "/pwa"
            }
        }
        gateway = @{
            bind = "loopback"
            port = 18789
        }
    }
    $defaultConfig | ConvertTo-Json -Depth 10 | Set-Content -Path $configPath
    Write-Host "[OK] Default config created" -ForegroundColor Green
}

# Install PWA client
Write-Host ""
Write-Host "[5/6] Installing PWA client..." -ForegroundColor Yellow
Set-Location pwa-client
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to install PWA client" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "[OK] PWA client dependencies installed" -ForegroundColor Green
Set-Location ..

# Verify
Write-Host ""
Write-Host "[6/6] Verifying installation..." -ForegroundColor Yellow
openclaw doctor

Write-Host ""
Write-Host "[OK] Installation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Restart OpenClaw Gateway:" -ForegroundColor White
Write-Host "   openclaw gateway stop" -ForegroundColor Gray
Write-Host "   openclaw gateway --port 18789 --verbose" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Start PWA client:" -ForegroundColor White
Write-Host "   cd pwa-client" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Open browser: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Read-Host "Press Enter to exit"
