param (
    [switch]$SkipBuild,
    [switch]$SkipWebBuild,
    [switch]$FrontendOnly,
    [switch]$BackendOnly,
    [switch]$InstallDeps,
    [switch]$EnableHttps = $true,
    [switch]$NoHttps
)

if ($NoHttps) { $EnableHttps = $false }

# =========================================================================
# Kich ban trien khai doc lap Web CRM Platform CLB CEO 1983 (Huong 2 - Standalone Compose)
# Tach biet hoan toan khoi ViOne: Container rieng, Port 5004/5005 rieng, Compose rieng
# =========================================================================

$SERVER_IP   = "14.225.217.232"
$SERVER_USER = "root"
$REMOTE_PATH = "~/crm"

$DEPLOY_DIR = $PSScriptRoot
$ROOT_DIR   = (Resolve-Path "$PSScriptRoot/../..").Path

$ErrorActionPreference = "Stop"

function Invoke-CheckedCommand {
    param(
        [Parameter(Mandatory = $true)] [string]$Description,
        [Parameter(Mandatory = $true)] [scriptblock]$Action
    )
    & $Action
    if ($LASTEXITCODE -ne 0) {
        throw "Loi: Tien trinh [$Description] that bai voi ma loi $LASTEXITCODE"
    }
}

$buildFE = -not $BackendOnly
$buildBE = -not $FrontendOnly

Push-Location $ROOT_DIR
try {
    if (-not $SkipBuild) {
        if ($buildFE) {
            if ($SkipWebBuild) {
                Write-Host "`n[0/5] Bo qua Build Frontend (Web) cuc bo (-SkipWebBuild)..." -ForegroundColor Yellow
            } else {
                Write-Host "`n[0/5] Build Frontend CRM Platform (Web) cuc bo voi Scope = crm_platform..." -ForegroundColor Cyan
                $env:NODE_OPTIONS = "--max-old-space-size=4096"
                $env:VITE_APP_SCOPE = "crm_platform"
                $env:VITE_APP_NAME = "ViOne CRM Platform"
                if ($EnableHttps) {
                    $env:VITE_PUBLIC_APP_URL = "https://14.225.217.232:5443"
                } else {
                    $env:VITE_PUBLIC_APP_URL = "http://14.225.217.232:5004"
                }
                $env:NEST_API_URL = "http://crm-backend:4000"
                
                if ($InstallDeps -or (-not (Test-Path "node_modules"))) {
                    Invoke-CheckedCommand -Description "NPM Install" -Action { npm install }
                } else {
                    Write-Host "  -> Bo qua 'npm install' (da co node_modules). Dung -InstallDeps neu muon tai lai." -ForegroundColor DarkGray
                }

                Invoke-CheckedCommand -Description "Build Web CRM Platform" -Action { npm run build --prefix apps/vione_app_fe }
            }
        }

        Write-Host "`n[1/5] Khoi tao quy trinh Build Docker Images cho Web CRM Platform CEO 1983..." -ForegroundColor Cyan
        if ($buildBE) {
            Invoke-CheckedCommand -Description "Xay dung Backend Image (crm-backend)" -Action {
                docker build -t crm-backend:latest -f Dockerfile.backend .
            }
        }
        if ($buildFE) {
            Invoke-CheckedCommand -Description "Xay dung Frontend Image (crm-frontend)" -Action {
                docker build --no-cache -t crm-frontend:latest -f "$DEPLOY_DIR/Dockerfile.frontend" .
            }
        }

        function Save-And-Compress-DockerImage {
            param(
                [Parameter(Mandatory = $true)] [string]$ImageName,
                [Parameter(Mandatory = $true)] [string]$OutGzPath
            )
            $gitGzip = "C:\Program Files\Git\usr\bin\gzip.exe"
            if (-not (Test-Path $gitGzip)) {
                $found = Get-Command gzip -ErrorAction SilentlyContinue
                if ($found) { $gitGzip = $found.Source }
            }

            if (Test-Path $gitGzip) {
                Write-Host "  -> Streaming truc tiep 'docker save | gzip -1' vao $OutGzPath..." -ForegroundColor Cyan
                cmd.exe /c "docker save $ImageName | `"$gitGzip`" -1 > `"$OutGzPath`""
                if ($LASTEXITCODE -ne 0 -or (-not (Test-Path $OutGzPath))) {
                    throw "Streaming Docker save that bai cho $ImageName"
                }
            } else {
                Write-Host "  -> Nen Node Stream vao $OutGzPath..." -ForegroundColor Cyan
                $nodeCompress = 'const fs = require("fs"); const zlib = require("zlib"); const { spawn } = require("child_process"); const proc = spawn("docker", ["save", process.argv[1]], { stdio: ["ignore", "pipe", "inherit"] }); const out = fs.createWriteStream(process.argv[2]); proc.stdout.pipe(zlib.createGzip({ level: 1 })).pipe(out); proc.on("close", (code) => { if (code !== 0) process.exit(code); });'
                node -e $nodeCompress $ImageName $OutGzPath
            }
        }

        Write-Host "`n[2/5] Xuat va nen Gzip (.tar.gz) toc do cao cho Web CRM Platform..." -ForegroundColor Cyan
        if ($buildBE) {
            Invoke-CheckedCommand -Description "Xuat & Nen Backend Image (.tar.gz)" -Action {
                Save-And-Compress-DockerImage -ImageName "crm-backend:latest" -OutGzPath "crm-backend.tar.gz"
            }
        }
        if ($buildFE) {
            Invoke-CheckedCommand -Description "Xuat & Nen Frontend Image (.tar.gz)" -Action {
                Save-And-Compress-DockerImage -ImageName "crm-frontend:latest" -OutGzPath "crm-frontend.tar.gz"
            }
        }
    } else {
        Write-Host "`n[1-2/5] BO QUA quy trinh Build va dong goi (SkipBuild)..." -ForegroundColor Yellow
    }

    Write-Host "`n[3/5] Khoi tao thu muc va dong bo tep tin doc lap len may chu ha tang ($SERVER_IP)..." -ForegroundColor Cyan

    Invoke-CheckedCommand -Description "Tao thu muc ~/crm tren server" -Action {
        ssh "${SERVER_USER}@${SERVER_IP}" "mkdir -p $REMOTE_PATH"
    }

    # Dam bao co tep tin .env.crm cuc bo
    Copy-Item "$DEPLOY_DIR/.env.production" "$DEPLOY_DIR/.env.crm" -Force -ErrorAction SilentlyContinue

    $filesToUpload = @(
        (Resolve-Path "$DEPLOY_DIR/.env.production").Path,
        (Resolve-Path "$DEPLOY_DIR/.env.crm").Path,
        (Resolve-Path "$DEPLOY_DIR/docker-compose.yml").Path
    )
    if (-not $SkipBuild) {
        if ($buildBE -and (Test-Path "crm-backend.tar.gz")) { $filesToUpload += (Resolve-Path "crm-backend.tar.gz").Path }
        if ($buildFE -and (Test-Path "crm-frontend.tar.gz")) { $filesToUpload += (Resolve-Path "crm-frontend.tar.gz").Path }
    }

    $scpArgs = $filesToUpload + "${SERVER_USER}@${SERVER_IP}:${REMOTE_PATH}/"
    Invoke-CheckedCommand -Description "Chuyen giao tep tin qua SCP vao ~/crm" -Action {
        scp @scpArgs
    }

    Write-Host "`n[4/5] Kich hoat Docker Compose rieng cho Web CRM Platform tu xa thong qua SSH..." -ForegroundColor Cyan

    $remoteLoadCmd = ""
    if ($buildBE -and (Test-Path "crm-backend.tar.gz")) {
        $remoteLoadCmd += "docker load -i crm-backend.tar.gz; rm -f crm-backend.tar.gz; "
    }
    if ($buildFE -and (Test-Path "crm-frontend.tar.gz")) {
        $remoteLoadCmd += "docker load -i crm-frontend.tar.gz; rm -f crm-frontend.tar.gz; "
    }

    $REMOTE_CMD = "cd $REMOTE_PATH; cp -f .env.production .env.crm 2>/dev/null || true; touch .env.crm; sed -i 's/\r//g' .env.crm docker-compose.yml; docker network create vione-network 2>/dev/null || true; $remoteLoadCmd docker compose -f docker-compose.yml stop 2>/dev/null || true; docker rm -f crm-frontend-prod crm-backend-prod 2>/dev/null || true; docker compose -f docker-compose.yml up -d --force-recreate"

    Invoke-CheckedCommand -Description "Thuc thi cau truc container doc lap Web CRM Platform" -Action {
        ssh "${SERVER_USER}@${SERVER_IP}" $REMOTE_CMD
    }

    Write-Host "`n[5/5] Don dep bo nho dem tam thoi tai may cuc bo..." -ForegroundColor Cyan
    Remove-Item crm-backend.tar.gz, crm-frontend.tar.gz, crm-backend.tar, crm-frontend.tar -ErrorAction SilentlyContinue

    if ($EnableHttps) {
        Write-Host "`n[BO SUNG] Dong bo Nginx Reverse Proxy SSL / HTTPS..." -ForegroundColor Magenta
        & "$DEPLOY_DIR/../ssl/deploy-ssl.ps1"
    }

    Write-Host "=================================================================" -ForegroundColor Green
    Write-Host "TRIEN KHAI DOC LAP WEB CRM PLATFORM VA LANDING CEO 1983 THANH CONG!" -ForegroundColor Green
    if ($EnableHttps) {
        Write-Host "Cong Frontend CRM (HTTPS): https://${SERVER_IP}:5443" -ForegroundColor Yellow
        Write-Host "Cong Frontend CRM (HTTP) : http://${SERVER_IP}:5004" -ForegroundColor DarkGray
    } else {
        Write-Host "Cong Frontend CRM : http://${SERVER_IP}:5004" -ForegroundColor Yellow
    }
    Write-Host "Cong Backend CRM  : http://${SERVER_IP}:5005" -ForegroundColor Yellow
    Write-Host "=================================================================" -ForegroundColor Green
} finally {
    Pop-Location
}
