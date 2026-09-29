param (
    [ValidateSet("preview", "production", "development")]
    [string]$Profile = "preview",
    [switch]$Release,
    [switch]$Cloud,
    [switch]$Clean,
    [switch]$Interactive,
    [switch]$OpenDashboard
)

# =========================================================================
# VIONE CONNECT - 1-CLICK POWERSHELL APK BUILD SCRIPT (ANDROID LOCAL / EAS)
# He thong build APK doc lap cho ung dung ViOne Connect React Native
# =========================================================================

$ErrorActionPreference = "Stop"
$ROOT_DIR = $PSScriptRoot
$MOBILE_DIR = Join-Path $ROOT_DIR "apps\mobile_vione"
$ANDROID_DIR = Join-Path $MOBILE_DIR "android"
$RELEASE_DIR = Join-Path $ROOT_DIR "release_apk"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host ">>> [VIONE CONNECT] BAT DAU QUY TRINH BIEN DICH ANDROID APK <<<" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "Thu muc goc      : $ROOT_DIR" -ForegroundColor DarkGray
Write-Host "Thu muc Mobile   : $MOBILE_DIR" -ForegroundColor DarkGray
Write-Host "Phuong thuc build: $(if ($Cloud) { 'Expo EAS Cloud' } else { 'Local Gradle (Terminal)' })" -ForegroundColor Yellow

# Neu chon build qua Expo EAS Cloud (khi truyen tham so -Cloud)
if ($Cloud) {
    Write-Host "`n[1/3] Kiem tra tai khoan xac thuc Expo EAS..." -ForegroundColor Yellow
    Push-Location $MOBILE_DIR
    try {
        $whoami = cmd.exe /c "npx eas-cli whoami 2>nul"
        Write-Host "  -> Dang nhap voi tai khoan: $whoami" -ForegroundColor Green
    } catch {
        Write-Warning "Chua dang nhap EAS CLI. Ban co the can chay 'npx eas-cli login'."
    } finally {
        Pop-Location
    }

    $easProfile = if ($Release) { "production" } else { $Profile }
    Write-Host "`n[2/3] Khoi tao lenh EAS Build cho Android APK (Profile: $easProfile)..." -ForegroundColor Yellow

    $easArgs = @("eas-cli", "build", "--platform", "android", "--profile", $easProfile)
    if (-not $Interactive) {
        $easArgs += "--non-interactive"
    }

    Push-Location $MOBILE_DIR
    try {
        Write-Host "  -> Thuc thi: npx $($easArgs -join ' ')" -ForegroundColor Cyan
        & npx @easArgs
        if ($LASTEXITCODE -ne 0) {
            throw "Tien trinh EAS Build that bai voi ma loi $LASTEXITCODE"
        }
    } finally {
        Pop-Location
    }

    Write-Host "`n=================================================================" -ForegroundColor Green
    Write-Host ">>> LENH BUILD ANDROID APK DA GUI LEN EAS CLOUD THANH CONG! <<<" -ForegroundColor Green
    Write-Host "=================================================================" -ForegroundColor Green
    Write-Host "Theo doi tien trinh & tai file .apk:" -ForegroundColor White
    Write-Host "  -> EAS Builds: https://expo.dev/accounts/unicom-vibe-coding-team/projects/vione/builds" -ForegroundColor Yellow
    Write-Host "Thong so cau hinh:" -ForegroundColor DarkGray
    Write-Host "  - Package ID: com.vione.app" -ForegroundColor DarkGray
    Write-Host "  - App Name  : ViOne Connect (Vione)" -ForegroundColor DarkGray
    Write-Host "=================================================================" -ForegroundColor Green

    if ($OpenDashboard) {
        Start-Process "https://expo.dev/accounts/unicom-vibe-coding-team/projects/vione/builds"
    }
    exit 0
}

# Truong hop build Local Gradle
Write-Host "`n[1/4] Kiem tra moi truong Java & Android SDK..." -ForegroundColor Yellow
$javaCmd = Get-Command java -ErrorAction SilentlyContinue
if (-not $javaCmd) {
    throw "Khong tim thay Java JDK tren may! Vui long cai dat OpenJDK 17+ va cau hinh JAVA_HOME."
}
$javaVer = cmd.exe /c "java -version 2>&1" | Select-Object -First 1
Write-Host "  -> Java version: $javaVer" -ForegroundColor DarkGray

# Tu dong kiem tra va tao local.properties neu chua co
$localPropPath = Join-Path $ANDROID_DIR "local.properties"
if (-not (Test-Path $localPropPath)) {
    $sdkDefault = "$env:LOCALAPPDATA\Android\Sdk"
    if (Test-Path $sdkDefault) {
        $sdkNormalized = $sdkDefault.Replace("\", "/")
        "sdk.dir=$sdkNormalized" | Out-File -FilePath $localPropPath -Encoding ascii -Force
        Write-Host "  -> Da tu dong cau hinh Android SDK: $sdkNormalized" -ForegroundColor Green
    }
}

$targetTask = if ($Release) { "assembleRelease" } else { "assembleDebug" }
$buildType = if ($Release) { "release" } else { "debug" }

Write-Host "`n[2/4] Chay Gradle [$targetTask]..." -ForegroundColor Yellow
Push-Location $ANDROID_DIR
try {
    if ($Clean) {
        cmd.exe /c "gradlew.bat clean"
    }
    cmd.exe /c "gradlew.bat $targetTask"
    if ($LASTEXITCODE -ne 0) {
        throw "Bien dich Gradle that bai voi ma loi $LASTEXITCODE"
    }
} finally {
    Pop-Location
}

Write-Host "`n[3/4] Thu thap file APK xuat xuong..." -ForegroundColor Yellow
if (-not (Test-Path $RELEASE_DIR)) {
    New-Item -ItemType Directory -Path $RELEASE_DIR -Force | Out-Null
}

$searchDir = Join-Path $ANDROID_DIR "app\build\outputs\apk\$buildType"
$apks = Get-ChildItem -Path $searchDir -Filter "*.apk" -ErrorAction SilentlyContinue
if ($apks) {
    $latestBuiltApk = $apks | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    $destLatestPath = Join-Path $RELEASE_DIR "ViOne-Connect-latest.apk"
    Copy-Item -Path $latestBuiltApk.FullName -Destination $destLatestPath -Force
    Write-Host ">>> XUAT FILE APK THANH CONG: $destLatestPath" -ForegroundColor Green
}
