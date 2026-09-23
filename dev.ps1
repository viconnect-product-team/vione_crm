param (
    [switch]$Docker,
    [switch]$Fe,
    [switch]$Be,
    [switch]$Full,
    [switch]$Down,
    [switch]$NoDocker
)

# =========================================================================
# VIONE STANDALONE LOCAL DEVELOPMENT SCRIPT
# Khoi dong moi truong dev cuc bo doc lap cho ViOne
# =========================================================================

$ROOT_DIR = $PSScriptRoot

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host ">>> [VIONE STANDALONE] LOCAL DEV ENVIRONMENT <<<" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

if ($Down) {
    Write-Host "`n[DOCKER] Dung tat ca container ViOne Local..." -ForegroundColor Yellow
    try {
        docker compose -f "$ROOT_DIR\docker-compose.local.yml" down 2>$null
        Write-Host "-> Da dung dich vu." -ForegroundColor Green
    } catch {
        Write-Host "-> Khong the ket noi Docker engine de dung dich vu." -ForegroundColor DarkGray
    }
    return
}

# Kiem tra Docker engine neu can khoi chay
$shouldRunDocker = ($Docker -or ($Full -and -not $NoDocker))
if ($shouldRunDocker) {
    Write-Host "`n[1/2] Kiem tra ha tang Docker cuc bo..." -ForegroundColor Yellow
    $dockerRunning = $false
    try {
        $null = docker info 2>&1
        if ($LASTEXITCODE -eq 0) {
            $dockerRunning = $true
        }
    } catch {
        $dockerRunning = $false
    }

    if ($dockerRunning) {
        Write-Host "  -> Docker Desktop dang chay, khoi dong container Database & MinIO..." -ForegroundColor Green
        docker compose -f "$ROOT_DIR\docker-compose.local.yml" up -d
        Write-Host "  -> PostgreSQL Local : localhost:6433 (Database: vione_standalone_local)" -ForegroundColor Green
        Write-Host "  -> MinIO Storage    : localhost:9060 (Console: localhost:9061)" -ForegroundColor Green
    } else {
        Write-Host "  [!] Docker Desktop chua khoi chay tren may." -ForegroundColor Yellow
        Write-Host "  -> Tu dong su dung co so du lieu & storage cau hinh trong .env (.env hien tai: Remote PostgreSQL)" -ForegroundColor DarkCyan
    }
} else {
    Write-Host "`n[1/2] Bo qua Docker cuc bo (Su dung cau hinh san co trong .env)..." -ForegroundColor DarkCyan
}

if ($Fe) {
    Write-Host "`n[2/2] Khoi chay Frontend ViOne Dev Server..." -ForegroundColor Cyan
    npm run dev:fe
} elseif ($Be) {
    Write-Host "`n[2/2] Khoi chay Backend ViOne Dev Server..." -ForegroundColor Cyan
    npm run dev:be
} else {
    Write-Host "`n[2/2] Khoi chay song song Backend + Frontend (Turbo Dev)..." -ForegroundColor Cyan
    npx turbo run dev
}

