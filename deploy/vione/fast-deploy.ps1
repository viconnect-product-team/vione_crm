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
# Kich ban trien khai doc lap ViOne Connect (Standalone Compose)
# Tach biet hoan toan: Container rieng, Port rieng, Compose rieng
# =========================================================================

$SERVER_IP   = "14.225.217.232"
$SERVER_USER = "root"
$REMOTE_PATH = "~/vione"

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
                Write-Host "`n[0/5] Build Frontend ViOne Connect (Web) cuc bo voi Scope = vione_app..." -ForegroundColor Cyan
                $env:NODE_OPTIONS = "--max-old-space-size=4096"
                $env:VITE_APP_SCOPE = "vione_app"
                $env:VITE_APP_NAME = "ViOne Connect"
                if ($EnableHttps) {
                    $env:VITE_PUBLIC_APP_URL = "https://14.225.217.232:5445"
                } else {
                    $env:VITE_PUBLIC_APP_URL = "http://14.225.217.232:5000"
                }
                $env:NEST_API_URL = "http://vione-backend:4000"
                
                if ($InstallDeps -or (-not (Test-Path "node_modules"))) {
                    Invoke-CheckedCommand -Description "NPM Install" -Action { npm install }
                } else {
                    Write-Host "  -> Bo qua 'npm install' (da co node_modules). Dung -InstallDeps neu muon tai lai." -ForegroundColor DarkGray
                }

                Invoke-CheckedCommand -Description "Build Web ViOne Connect" -Action { npm run build --prefix apps/vione_app_fe }
            }
        }

        Write-Host "`n[1/5] Khoi tao quy trinh Build Docker Images cho ViOne Connect Standalone..." -ForegroundColor Cyan
        if ($buildBE) {
            Invoke-CheckedCommand -Description "Xay dung Backend Image (vione-standalone-backend)" -Action {
                docker build -t vione-standalone-backend:latest -t vione-backend:latest -f Dockerfile.backend .
            }
        }
        if ($buildFE) {
            Invoke-CheckedCommand -Description "Xay dung Frontend Image (vione-standalone-frontend)" -Action {
                docker build --no-cache -t vione-standalone-frontend:latest -t vione-frontend:latest -f "$DEPLOY_DIR/Dockerfile.frontend" .
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

        Write-Host "`n[2/5] Xuat va nen Gzip (.tar.gz) toc do cao cho ViOne Connect..." -ForegroundColor Cyan
        if ($buildBE) {
            Invoke-CheckedCommand -Description "Xuat va Nen Backend Image (.tar.gz)" -Action {
                Save-And-Compress-DockerImage -ImageName "vione-standalone-backend:latest" -OutGzPath "vione-backend.tar.gz"
            }
        }
        if ($buildFE) {
            Invoke-CheckedCommand -Description "Xuat va Nen Frontend Image (.tar.gz)" -Action {
                Save-And-Compress-DockerImage -ImageName "vione-standalone-frontend:latest" -OutGzPath "vione-frontend.tar.gz"
            }
        }
    } else {
        Write-Host "`n[1-2/5] BO QUA quy trinh Build va dong goi (SkipBuild)..." -ForegroundColor Yellow
    }

    Write-Host "`n[3/5] Khoi tao thu muc va dong bo tep tin doc lap len may chu ha tang ($SERVER_IP)..." -ForegroundColor Cyan

    Invoke-CheckedCommand -Description "Tao thu muc remote tren server" -Action {
        ssh "${SERVER_USER}@${SERVER_IP}" "mkdir -p $REMOTE_PATH"
    }

    # Dam bao co tep tin .env cuc bo
    Copy-Item "$DEPLOY_DIR/.env.production" "$DEPLOY_DIR/.env" -Force -ErrorAction SilentlyContinue

    $filesToUpload = @(
        (Resolve-Path "$DEPLOY_DIR/.env.production").Path,
        (Resolve-Path "$DEPLOY_DIR/.env").Path,
        (Resolve-Path "$DEPLOY_DIR/docker-compose.yml").Path
    )
    if (-not $SkipBuild) {
        if ($buildBE -and (Test-Path "vione-backend.tar.gz")) { $filesToUpload += (Resolve-Path "vione-backend.tar.gz").Path }
        if ($buildFE -and (Test-Path "vione-frontend.tar.gz")) { $filesToUpload += (Resolve-Path "vione-frontend.tar.gz").Path }
    }

    $scpArgs = $filesToUpload + "${SERVER_USER}@${SERVER_IP}:${REMOTE_PATH}/"
    Invoke-CheckedCommand -Description "Chuyen giao tep tin qua SCP" -Action {
        scp @scpArgs
    }

    Write-Host "`n[4/5] Kich hoat Docker Compose rieng cho ViOne Connect tu xa thong qua SSH..." -ForegroundColor Cyan

    $remoteLoadCmd = ""
    if ($buildBE -and (Test-Path "vione-backend.tar.gz")) {
        $remoteLoadCmd += "docker load -i vione-backend.tar.gz; docker tag vione-backend:latest vione-standalone-backend:latest 2>/dev/null || true; rm -f vione-backend.tar.gz; "
    }
    if ($buildFE -and (Test-Path "vione-frontend.tar.gz")) {
        $remoteLoadCmd += "docker load -i vione-frontend.tar.gz; docker tag vione-frontend:latest vione-standalone-frontend:latest 2>/dev/null || true; rm -f vione-frontend.tar.gz; "
    }

    $REMOTE_CMD = "cd $REMOTE_PATH; cp -f .env.production .env 2>/dev/null || true; touch .env; sed -i 's/\r//g' .env docker-compose.yml; docker network create vione-network 2>/dev/null || true; docker volume create vione-minio-data-prod 2>/dev/null || true; docker volume create vione-uploads-data 2>/dev/null || true; $remoteLoadCmd docker compose -f docker-compose.yml stop frontend backend minio 2>/dev/null || true; docker rm -f vione-frontend-prod vione-backend-prod vione-minio-prod vione-standalone-frontend-prod vione-standalone-backend-prod vione-standalone-minio-prod vibe_frontend_prod vibe_backend_prod 2>/dev/null || true; docker compose -f docker-compose.yml up -d --force-recreate frontend backend minio"

    Invoke-CheckedCommand -Description "Thuc thi cau truc container doc lap ViOne Connect" -Action {
        ssh "${SERVER_USER}@${SERVER_IP}" $REMOTE_CMD
    }

    Write-Host "`n[5/5] Don dep bo nho dem tam thoi tai may cuc bo..." -ForegroundColor Cyan
    Remove-Item vione-backend.tar.gz, vione-frontend.tar.gz, vione-backend.tar, vione-frontend.tar -ErrorAction SilentlyContinue

    if ($EnableHttps) {
        Write-Host "`n[BO SUNG] Dong bo Nginx Reverse Proxy SSL / HTTPS..." -ForegroundColor Magenta
        if (Test-Path "$DEPLOY_DIR/../ssl/deploy-ssl.ps1") {
            & "$DEPLOY_DIR/../ssl/deploy-ssl.ps1"
        }
    }

    Write-Host "=================================================================" -ForegroundColor Green
    Write-Host "TRIEN KHAI VIONE STANDALONE [PORT 5010/5445] THANH CONG!" -ForegroundColor Green
    if ($EnableHttps) {
        Write-Host "Cong Frontend ViOne App (HTTPS) : https://${SERVER_IP}:5445 (hoac https://dev-vione.14-225-217-232.sslip.io:5445)" -ForegroundColor Yellow
        Write-Host "Tuyen duong chinh               : /connect-app" -ForegroundColor Yellow
        Write-Host "Cong Frontend ViOne App (HTTP)  : http://${SERVER_IP}:5010" -ForegroundColor DarkGray
    } else {
        Write-Host "Cong Frontend ViOne App (HTTP)  : http://${SERVER_IP}:5010 (Tuyen duong: /connect-app)" -ForegroundColor Yellow
    }
    Write-Host "Cong Backend API ViOne App       : http://${SERVER_IP}:5011" -ForegroundColor Yellow
    Write-Host "=================================================================" -ForegroundColor Green
} finally {
    Pop-Location
}
