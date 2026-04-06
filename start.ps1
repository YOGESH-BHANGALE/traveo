# Traveo+ — Automated Project Starter (PowerShell)
# Run with: .\start.ps1

Write-Host ""
Write-Host "  ╔══════════════════════════════════════╗" -ForegroundColor Yellow
Write-Host "  ║        Traveo+ Starting Up           ║" -ForegroundColor Yellow
Write-Host "  ╚══════════════════════════════════════╝" -ForegroundColor Yellow
Write-Host ""

# Check Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "  ✗ Node.js not found. Install from https://nodejs.org" -ForegroundColor Red
    exit 1
}
$nodeVersion = node --version
Write-Host "  ✓ Node.js $nodeVersion" -ForegroundColor Green

# Check npm
$npmVersion = npm --version
Write-Host "  ✓ npm $npmVersion" -ForegroundColor Green

# Install server deps if node_modules missing
if (-not (Test-Path "server/node_modules")) {
    Write-Host ""
    Write-Host "  → Installing server dependencies..." -ForegroundColor Cyan
    Push-Location server
    npm install --legacy-peer-deps
    Pop-Location
    Write-Host "  ✓ Server dependencies installed" -ForegroundColor Green
} else {
    Write-Host "  ✓ Server dependencies already installed" -ForegroundColor Green
}

# Install client deps if node_modules missing
if (-not (Test-Path "client/node_modules")) {
    Write-Host ""
    Write-Host "  → Installing client dependencies..." -ForegroundColor Cyan
    Push-Location client
    npm install --legacy-peer-deps
    Pop-Location
    Write-Host "  ✓ Client dependencies installed" -ForegroundColor Green
} else {
    Write-Host "  ✓ Client dependencies already installed" -ForegroundColor Green
}

# Check .env files
if (-not (Test-Path "server/.env")) {
    Write-Host ""
    Write-Host "  ⚠ server/.env not found — copying from .env.example" -ForegroundColor Yellow
    Copy-Item "server/.env.example" "server/.env"
    Write-Host "  ! Edit server/.env and fill in MONGODB_URI and JWT_SECRET" -ForegroundColor Yellow
}

if (-not (Test-Path "client/.env.local")) {
    Write-Host ""
    Write-Host "  ⚠ client/.env.local not found — copying from .env.example" -ForegroundColor Yellow
    Copy-Item "client/.env.example" "client/.env.local"
}

Write-Host ""
Write-Host "  → Starting server on http://localhost:5000 ..." -ForegroundColor Cyan
Write-Host "  → Starting client on http://localhost:3000 ..." -ForegroundColor Cyan
Write-Host ""
Write-Host "  Press Ctrl+C in each window to stop." -ForegroundColor Gray
Write-Host ""

# Start server in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PWD\server'; Write-Host 'Traveo+ Server' -ForegroundColor Yellow; npm run dev"

# Small delay so server starts first
Start-Sleep -Seconds 2

# Start client in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PWD\client'; Write-Host 'Traveo+ Client' -ForegroundColor Yellow; npm run dev"

Write-Host "  ✓ Both processes launched in separate windows." -ForegroundColor Green
Write-Host "  ✓ Open http://localhost:3000 in your browser." -ForegroundColor Green
Write-Host ""
