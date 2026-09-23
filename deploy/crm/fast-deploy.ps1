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

# Thiet lap ma hoa UTF-8 cho console de khong bi loi font tieng Viet tren PowerShell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 > $null

# =========================================================================
# Kich ban trien khai doc lap ViOne Connect Enterprise CRM (Port 5446)
# Tach biet hoan toan: Container rieng, Port 5006/5007 rieng, Compose rieng, Folder ~/vione-crm
# =========================================================================

$SERVER_IP   = "14.225.217.232"
$SERVER_USER = "root"
$REMOTE_PATH = "~/vione-crm"

$DEPLOY_DIR = $PSScriptRoot
$ROOT_DIR   = (Resolve-Path "$PSScriptRoot/../..").Path

$ErrorActionPreference = "Stop"

function Invoke-CheckedCommand {
    param(
        [Parameter(Mandatory = $true)] [string]$Description,
        [Parameter(Mandatory = $true)] [scriptblock]$Action,
        [int]$MaxRetries = 1
    )
    $attempt = 1
    while ($true) {
        & $Action
        if ($LASTEXITCODE -eq 0) {
            break
        }
        if ($attempt -lt $MaxRetries) {
            Write-Host "`n[Canh bao] Tien trinh [$Description] tam thoi chua phan hoi (ma loi $LASTEXITCODE). Tu dong thu lai sau 3s (Lan $attempt/$MaxRetries)..." -ForegroundColor Yellow
            Start-Sleep -Seconds 3
            $attempt++
        } else {
            throw "Loi: Tien trinh [$Description] that bai voi ma loi $LASTEXITCODE sau $attempt lan thu."
        }
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
                Write-Host "`n[0/5] Build Frontend ViOne CRM (Web) cuc bo voi Scope = crm_platform..." -ForegroundColor Cyan
                $env:NODE_OPTIONS = "--max-old-space-size=4096"
                $env:VITE_APP_SCOPE = "crm_platform"
                $env:VITE_APP_NAME = "ViOne Connect CRM 5.0"
                if ($EnableHttps) {
                    $env:VITE_PUBLIC_APP_URL = "https://14.225.217.232:5446"
                } else {
                    $env:VITE_PUBLIC_APP_URL = "http://14.225.217.232:5006"
                }

                if ($InstallDeps) {
                    Write-Host "  -> Cai dat thu vien moi (npm install)..." -ForegroundColor Cyan
                    Invoke-CheckedCommand -Description "NPM Install" -Action { npm install }
                } else {
                    Write-Host "  -> Bo qua 'npm install' (da co node_modules). Dung -InstallDeps neu muon tai lai." -ForegroundColor DarkGray
                }

                Invoke-CheckedCommand -Description "Build Web ViOne CRM" -Action { npm run build --prefix apps/vione_app_fe }
            }
        }

        Write-Host "`n[1/5] Khoi tao quy trinh Build Docker Images cho ViOne CRM Platform..." -ForegroundColor Cyan
        if ($buildBE) {
            Invoke-CheckedCommand -Description "Xay dung Backend Image (vione-crm-backend)" -Action {
                docker build -t vione-crm-backend:latest -f Dockerfile.backend .
            }
        }
        if ($buildFE) {
            Invoke-CheckedCommand -Description "Xay dung Frontend Image (vione-crm-frontend)" -Action {
                docker build --no-cache -t vione-crm-frontend:latest -f "$DEPLOY_DIR/Dockerfile.frontend" .
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

        Write-Host "`n[2/5] Xuat va nen Gzip (.tar.gz) toc do cao cho ViOne CRM..." -ForegroundColor Cyan
        if ($buildBE) {
            Invoke-CheckedCommand -Description "Xuat & Nen Backend Image (.tar.gz)" -Action {
                Save-And-Compress-DockerImage -ImageName "vione-crm-backend:latest" -OutGzPath "vione-crm-backend.tar.gz"
            }
        }
        if ($buildFE) {
            Invoke-CheckedCommand -Description "Xuat & Nen Frontend Image (.tar.gz)" -Action {
                Save-And-Compress-DockerImage -ImageName "vione-crm-frontend:latest" -OutGzPath "vione-crm-frontend.tar.gz"
            }
        }
    } else {
        Write-Host "`n[1-2/5] BO QUA quy trinh Build va dong goi (SkipBuild)..." -ForegroundColor Yellow
    }

    $SSH_OPTS = @("-o", "ConnectTimeout=30", "-o", "ServerAliveInterval=15", "-o", "ServerAliveCountMax=3")

    Write-Host "`n[3/5] Khoi tao thu muc va dong bo tep tin doc lap len may chu ha tang ($SERVER_IP)..." -ForegroundColor Cyan

    Invoke-CheckedCommand -Description "Tao thu muc $REMOTE_PATH tren server" -MaxRetries 3 -Action {
        ssh @SSH_OPTS "${SERVER_USER}@${SERVER_IP}" "mkdir -p $REMOTE_PATH"
    }

    # Dam bao co tep tin .env.crm cuc bo
    Copy-Item "$DEPLOY_DIR/.env.production" "$DEPLOY_DIR/.env.crm" -Force -ErrorAction SilentlyContinue

    $filesToUpload = @(
        (Resolve-Path "$DEPLOY_DIR/.env.production").Path,
        (Resolve-Path "$DEPLOY_DIR/.env.crm").Path,
        (Resolve-Path "$DEPLOY_DIR/docker-compose.yml").Path
    )
    if (-not $SkipBuild) {
        if ($buildBE -and (Test-Path "vione-crm-backend.tar.gz")) { $filesToUpload += (Resolve-Path "vione-crm-backend.tar.gz").Path }
        if ($buildFE -and (Test-Path "vione-crm-frontend.tar.gz")) { $filesToUpload += (Resolve-Path "vione-crm-frontend.tar.gz").Path }
    }

    $scpArgs = @() + $SSH_OPTS + $filesToUpload + "${SERVER_USER}@${SERVER_IP}:${REMOTE_PATH}/"
    Invoke-CheckedCommand -Description "Chuyen giao tep tin qua SCP vao $REMOTE_PATH" -MaxRetries 3 -Action {
        scp @scpArgs
    }

    Write-Host "`n[4/5] Kich hoat Docker Compose rieng cho ViOne CRM Platform tu xa thong qua SSH..." -ForegroundColor Cyan

    $remoteLoadCmd = ""
    if ($buildBE -and (Test-Path "vione-crm-backend.tar.gz")) {
        $remoteLoadCmd += "docker load -i vione-crm-backend.tar.gz; rm -f vione-crm-backend.tar.gz; "
    }
    if ($buildFE -and (Test-Path "vione-crm-frontend.tar.gz")) {
        $remoteLoadCmd += "docker load -i vione-crm-frontend.tar.gz; rm -f vione-crm-frontend.tar.gz; "
    }

    $REMOTE_CMD = "cd $REMOTE_PATH; cp -f .env.production .env.crm 2>/dev/null || true; touch .env.crm; sed -i 's/\r//g' .env.crm docker-compose.yml; docker network create vione-network 2>/dev/null || true; $remoteLoadCmd docker compose -f docker-compose.yml stop 2>/dev/null || true; docker rm -f vione-crm-frontend-prod vione-crm-backend-prod 2>/dev/null || true; docker compose -f docker-compose.yml up -d --force-recreate"

    Invoke-CheckedCommand -Description "Thuc thi cau truc container doc lap ViOne CRM Platform" -MaxRetries 3 -Action {
        ssh @SSH_OPTS "${SERVER_USER}@${SERVER_IP}" $REMOTE_CMD
    }

    Write-Host "`n[5/5] Don dep bo nho dem tam thoi tai may cuc bo..." -ForegroundColor Cyan
    Remove-Item vione-crm-backend.tar.gz, vione-crm-frontend.tar.gz -ErrorAction SilentlyContinue

    if ($EnableHttps) {
        Write-Host "`n[BO SUNG] Dong bo Nginx Reverse Proxy SSL / HTTPS..." -ForegroundColor Magenta
        & "$DEPLOY_DIR/../ssl/deploy-ssl.ps1"
    }

    Write-Host "=================================================================" -ForegroundColor Green
    Write-Host "TRIEN KHAI DOC LAP VIONE ENTERPRISE CRM THANH CONG!" -ForegroundColor Green
    if ($EnableHttps) {
        Write-Host "URL ViOne CRM HTTPS : https://${SERVER_IP}:5446" -ForegroundColor Yellow
        Write-Host "Domain ViOne CRM    : https://dev-vione-crm.14-225-217-232.sslip.io:5446" -ForegroundColor Yellow
    } else {
        Write-Host "URL ViOne CRM HTTP  : http://${SERVER_IP}:5006" -ForegroundColor Yellow
    }
    Write-Host "=================================================================" -ForegroundColor Green
}
finally {
    Pop-Location
}
