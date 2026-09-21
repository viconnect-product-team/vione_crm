param (
    [switch]$Docker,
    [switch]$Fe,
    [switch]$Be,
    [switch]$Full,
    [switch]$Down
)

# =========================================================================
# VIONE STANDALONE LOCAL DEVELOPMENT SCRIPT
# Khoi dong moi truong dev cuc bo doc lap cho ViOne
# =========================================================================

$ErrorActionPreference = "Stop"
$ROOT_DIR = $PSScriptRoot

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host ">>> [VIONE STANDALONE] LOCAL DEV ENVIRONMENT <<<" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

if ($Down) {
    Write-Host "`n[DOCKER] Dung tat ca container ViOne Local..." -ForegroundColor Yellow
    docker compose -f "$ROOT_DIR\docker-compose.local.yml" down
    Write-Host "-> Da dung dich vu." -ForegroundColor Green
    return
}

if ($Docker -or $Full -or (-not $Fe -and -not $Be)) {
    Write-Host "`n[1/2] Khoi chay ha tang Docker cuc bo (Database & MinIO isolated)..." -ForegroundColor Yellow
    docker compose -f "$ROOT_DIR\docker-compose.local.yml" up -d
    Write-Host "  -> PostgreSQL Local : localhost:6433 (Database: vione_standalone_local)" -ForegroundColor Green
    Write-Host "  -> MinIO Storage    : localhost:9060 (Console: localhost:9061)" -ForegroundColor Green
}

if ($Fe) {
    Write-Host "`n[2/2] Khoi chay Frontend ViOne Dev Server..." -ForegroundColor Cyan
    npm run dev:fe
} elseif ($Be) {
    Write-Host "`n[2/2] Khoi chay Backend ViOne Dev Server..." -ForegroundColor Cyan
    npm run dev:be
} elseif ($Full) {
    Write-Host "`n[2/2] Khoi chay song song Backend + Frontend (Turbo)..." -ForegroundColor Cyan
    npm run dev
} else {
    Write-Host "`n=================================================================" -ForegroundColor Green
    Write-Host "Ha tang ViOne Local da san sang!" -ForegroundColor Green
    Write-Host "Cac lenh phat trien huu ich:" -ForegroundColor White
    Write-Host "  - Chay Frontend : .\dev.ps1 -Fe (hoac npm run dev:fe)" -ForegroundColor Yellow
    Write-Host "  - Chay Backend  : .\dev.ps1 -Be (hoac npm run dev:be)" -ForegroundColor Yellow
    Write-Host "  - Chay ca hai   : .\dev.ps1 -Full" -ForegroundColor Yellow
    Write-Host "  - Build APK     : .\build-apk.ps1" -ForegroundColor Yellow
    Write-Host "  - Build IPA     : .\build-ipa.ps1" -ForegroundColor Yellow
    Write-Host "  - Trien khai    : .\deploy.ps1" -ForegroundColor Yellow
    Write-Host "  - Dung Docker   : .\dev.ps1 -Down" -ForegroundColor Yellow
    Write-Host "=================================================================" -ForegroundColor Green
}
