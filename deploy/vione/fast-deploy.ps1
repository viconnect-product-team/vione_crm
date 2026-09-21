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
# Kịch bản triển khai độc lập ViOne Connect CLB CEO 1983 (Hướng 2 - Standalone Compose)
# Tách biệt hoàn toàn khỏi ViOne: Container riêng, Port 5000/5001 riêng, Compose riêng
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
        throw "Lỗi: Tiến trình [$Description] thất bại với mã lỗi $LASTEXITCODE"
    }
}

$buildFE = -not $BackendOnly
$buildBE = -not $FrontendOnly

Push-Location $ROOT_DIR
try {
    if (-not $SkipBuild) {
        if ($buildFE) {
            if ($SkipWebBuild) {
                Write-Host "`n[0/5] Bỏ qua Build Frontend (Web) cục bộ (-SkipWebBuild)..." -ForegroundColor Yellow
            } else {
                Write-Host "`n[0/5] Build Frontend ViOne Connect (Web) cục bộ với Scope = vione_app..." -ForegroundColor Cyan
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
                    Write-Host "  -> Bỏ qua 'npm install' (đã có node_modules). Dùng -InstallDeps nếu muốn tải lại." -ForegroundColor DarkGray
                }

                Invoke-CheckedCommand -Description "Build Web ViOne Connect" -Action { npm run build --prefix apps/vione_app_fe }
            }
        }

        Write-Host "`n[1/5] Khởi tạo quy trình Build Docker Images cho ViOne Connect CEO 1983..." -ForegroundColor Cyan
        if ($buildBE) {
            Invoke-CheckedCommand -Description "Xây dựng Backend Image (vione-backend)" -Action {
                docker build -t vione-backend:latest -f Dockerfile.backend .
            }
        }
        if ($buildFE) {
            Invoke-CheckedCommand -Description "Xây dựng Frontend Image (vione-frontend)" -Action {
                docker build --no-cache -t vione-frontend:latest -f "$DEPLOY_DIR/Dockerfile.frontend" .
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
                Write-Host "  -> Streaming trực tiếp 'docker save | gzip -1' vào $OutGzPath..." -ForegroundColor Cyan
                cmd.exe /c "docker save $ImageName | `"$gitGzip`" -1 > `"$OutGzPath`""
                if ($LASTEXITCODE -ne 0 -or (-not (Test-Path $OutGzPath))) {
                    throw "Streaming Docker save thất bại cho $ImageName"
                }
            } else {
                Write-Host "  -> Nén Node Stream vào $OutGzPath..." -ForegroundColor Cyan
                $nodeCompress = 'const fs = require("fs"); const zlib = require("zlib"); const { spawn } = require("child_process"); const proc = spawn("docker", ["save", process.argv[1]], { stdio: ["ignore", "pipe", "inherit"] }); const out = fs.createWriteStream(process.argv[2]); proc.stdout.pipe(zlib.createGzip({ level: 1 })).pipe(out); proc.on("close", (code) => { if (code !== 0) process.exit(code); });'
                node -e $nodeCompress $ImageName $OutGzPath
            }
        }

        Write-Host "`n[2/5] Xuất và nén Gzip (.tar.gz) tốc độ cao cho ViOne Connect..." -ForegroundColor Cyan
        if ($buildBE) {
            Invoke-CheckedCommand -Description "Xuất & Nén Backend Image (.tar.gz)" -Action {
                Save-And-Compress-DockerImage -ImageName "vione-backend:latest" -OutGzPath "vione-backend.tar.gz"
            }
        }
        if ($buildFE) {
            Invoke-CheckedCommand -Description "Xuất & Nén Frontend Image (.tar.gz)" -Action {
                Save-And-Compress-DockerImage -ImageName "vione-frontend:latest" -OutGzPath "vione-frontend.tar.gz"
            }
        }
    } else {
        Write-Host "`n[1-2/5] BỎ QUA quy trình Build và đóng gói (SkipBuild)..." -ForegroundColor Yellow
    }

    Write-Host "`n[3/5] Khởi tạo thư mục và đồng bộ tệp tin độc lập lên máy chủ hạ tầng ($SERVER_IP)..." -ForegroundColor Cyan

    Invoke-CheckedCommand -Description "Tạo thư mục ~ trên server" -Action {
        ssh "${SERVER_USER}@${SERVER_IP}" "mkdir -p $REMOTE_PATH"
    }

    # Đảm bảo có tệp tin .env cục bộ
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
    Invoke-CheckedCommand -Description "Chuyển giao tệp tin qua SCP vào ~" -Action {
        scp @scpArgs
    }

    Write-Host "`n[4/5] Kích hoạt Docker Compose riêng cho ViOne Connect từ xa thông qua SSH..." -ForegroundColor Cyan

    $remoteLoadCmd = ""
    if ($buildBE -and (Test-Path "vione-backend.tar.gz")) {
        $remoteLoadCmd += "docker load -i vione-backend.tar.gz; rm -f vione-backend.tar.gz; "
    }
    if ($buildFE -and (Test-Path "vione-frontend.tar.gz")) {
        $remoteLoadCmd += "docker load -i vione-frontend.tar.gz; rm -f vione-frontend.tar.gz; "
    }

    $REMOTE_CMD = "cd $REMOTE_PATH; cp -f .env.production .env 2>/dev/null || true; touch .env; sed -i 's/\r//g' .env docker-compose.yml; docker network create vione-network 2>/dev/null || true; $remoteLoadCmd docker compose -f docker-compose.yml stop frontend backend 2>/dev/null || true; docker rm -f vione-frontend-prod vione-backend-prod vibe_frontend_prod vibe_backend_prod 2>/dev/null || true; docker compose -f docker-compose.yml up -d --force-recreate frontend backend minio"

    Invoke-CheckedCommand -Description "Thực thi cấu trúc container độc lập ViOne Connect" -Action {
        ssh "${SERVER_USER}@${SERVER_IP}" $REMOTE_CMD
    }

    Write-Host "`n[5/5] Dọn dẹp bộ nhớ đệm tạm thời tại máy cục bộ..." -ForegroundColor Cyan
    Remove-Item vione-backend.tar.gz, vione-frontend.tar.gz, vione-backend.tar, vione-frontend.tar -ErrorAction SilentlyContinue

    if ($EnableHttps) {
        Write-Host "`n[BỔ SUNG] Đồng bộ Nginx Reverse Proxy SSL / HTTPS..." -ForegroundColor Magenta
        & "$DEPLOY_DIR/../ssl/deploy-ssl.ps1"
    }

    Write-Host "=================================================================" -ForegroundColor Green
    Write-Host "TRIỂN KHAI VIONE APP - MẠNG XÃ HỘI DOANH NHÂN [PORT 5000/5445] THÀNH CÔNG!" -ForegroundColor Green
    if ($EnableHttps) {
        Write-Host "Cổng Frontend ViOne App (HTTPS) : https://${SERVER_IP}:5445 (hoặc https://dev-vione.14-225-217-232.sslip.io:5445)" -ForegroundColor Yellow
        Write-Host "Tuyến đường chính              : /connect-app" -ForegroundColor Yellow
        Write-Host "Cổng Frontend ViOne App (HTTP)  : http://${SERVER_IP}:5000" -ForegroundColor DarkGray
    } else {
        Write-Host "Cổng Frontend ViOne App (HTTP)  : http://${SERVER_IP}:5000 (Tuyến đường: /connect-app)" -ForegroundColor Yellow
    }
    Write-Host "Cổng Backend API ViOne App      : http://${SERVER_IP}:5001" -ForegroundColor Yellow
    Write-Host "=================================================================" -ForegroundColor Green
} finally {
    Pop-Location
}
