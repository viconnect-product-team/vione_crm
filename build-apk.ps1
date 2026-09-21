param (
    [switch]$Release,
    [switch]$Clean,
    [switch]$BuildWeb,
    [switch]$Sync,
    [switch]$NoOpenFolder
)

# =========================================================================
# VIONE CONNECT - 1-CLICK POWERSHELL APK BUILD SCRIPT (ANDROID)
# He thong build APK doc lap cho ung dung ViOne Connect
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
Write-Host "Thu muc Android  : $ANDROID_DIR" -ForegroundColor DarkGray
Write-Host "Thu muc Output   : $RELEASE_DIR" -ForegroundColor DarkGray

# 1. Kiem tra moi truong
Write-Host "`n[1/5] Kiem tra cau hinh va moi truong Android..." -ForegroundColor Yellow

$javaCmd = Get-Command java -ErrorAction SilentlyContinue
if (-not $javaCmd) {
    throw "Khong tim thay Java JDK tren may! Vui long cai dat OpenJDK 17+ va cau hinh JAVA_HOME."
}
$javaVer = cmd.exe /c "java -version 2>&1" | Select-Object -First 1
Write-Host "  -> Java version  : $javaVer" -ForegroundColor DarkGray

$localProps = Join-Path $ANDROID_DIR "local.properties"
if (-not (Test-Path $localProps)) {
    $defaultSdk = "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk"
    if (Test-Path $defaultSdk) {
        $escapedSdk = $defaultSdk.Replace('\', '\\').Replace(':', '\:')
        Set-Content -Path $localProps -Value "sdk.dir=$escapedSdk" -Encoding Ascii
        Write-Host "  -> Da tao local.properties tro toi Android SDK: $defaultSdk" -ForegroundColor Green
    } else {
        Write-Warning "Khong tim thay Android SDK tu dong! Vui long kiem tra file $localProps"
    }
}

# Dam bao thu muc @capacitor/android co san
if (-not (Test-Path "$ROOT_DIR\node_modules\@capacitor\android\capacitor")) {
    Write-Host "  -> Chuan bi module Capacitor Android..." -ForegroundColor Yellow
    if (Test-Path "$ROOT_DIR\..\viconnect_project\node_modules\@capacitor") {
        robocopy "$ROOT_DIR\..\viconnect_project\node_modules\@capacitor" "$ROOT_DIR\node_modules\@capacitor" /E /XD build .gradle /NFL /NDL /NJH /NJS /nc /ns /np
    }
}

# 2. Build Web Assets neu co yeu cau
if ($BuildWeb) {
    Write-Host "`n[2/5] Bien dich Frontend Web ViOne (apps/vione_app_fe)..." -ForegroundColor Yellow
    Push-Location "$ROOT_DIR\apps\vione_app_fe"
    try {
        npm run build
    } finally {
        Pop-Location
    }
    $Sync = $true
} else {
    Write-Host "`n[2/5] Bo qua Build Web tinh (dung -BuildWeb neu muon bien dich lai bundle web)..." -ForegroundColor DarkGray
}

# 3. Dong bo Capacitor neu co yeu cau
if ($Sync) {
    Write-Host "`n[3/5] Dong bo Capacitor Android (cap sync android)..." -ForegroundColor Yellow
    Push-Location $MOBILE_DIR
    try {
        npx cap sync android
    } finally {
        Pop-Location
    }
} else {
    Write-Host "`n[3/5] Su dung cau hinh Capacitor hien hanh..." -ForegroundColor DarkGray
}

# 4. Bien dich APK bang Gradle
$targetTask = if ($Release) { "assembleRelease" } else { "assembleDebug" }
$buildType = if ($Release) { "release" } else { "debug" }

Write-Host "`n[4/5] Chay Gradle [$targetTask]..." -ForegroundColor Yellow

Push-Location $ANDROID_DIR
try {
    if ($Clean) {
        Write-Host "  -> Don dep build cache cu (gradlew clean)..." -ForegroundColor DarkGray
        cmd.exe /c "gradlew.bat clean"
    }

    $gradleOutput = cmd.exe /c "gradlew.bat $targetTask"
    if ($LASTEXITCODE -ne 0) {
        Write-Error $gradleOutput
        throw "Bien dich Gradle that bai voi ma loi $LASTEXITCODE"
    }
    Write-Host "  -> Bien dich Gradle thanh cong!" -ForegroundColor Green
} finally {
    Pop-Location
}

# 5. Xuat file APK ra release_apk
Write-Host "`n[5/5] Thu thap file APK xuat xuong..." -ForegroundColor Yellow

if (-not (Test-Path $RELEASE_DIR)) {
    New-Item -ItemType Directory -Path $RELEASE_DIR -Force | Out-Null
}

$searchDir = Join-Path $ANDROID_DIR "app\build\outputs\apk\$buildType"
$apks = Get-ChildItem -Path $searchDir -Filter "*.apk" -ErrorAction SilentlyContinue

if (-not $apks -or $apks.Count -eq 0) {
    throw "Khong tim thay file APK duoc tao ra trong $searchDir"
}

$latestBuiltApk = $apks | Sort-Object LastWriteTime -Descending | Select-Object -First 1
$destFileName = "ViOne-Connect-latest.apk"
$destVersionedName = "ViOne-Connect-v1.0-$buildType.apk"

$destLatestPath = Join-Path $RELEASE_DIR $destFileName
$destVersionedPath = Join-Path $RELEASE_DIR $destVersionedName

Copy-Item -Path $latestBuiltApk.FullName -Destination $destLatestPath -Force
Copy-Item -Path $latestBuiltApk.FullName -Destination $destVersionedPath -Force

$fileSizeMB = [math]::Round($latestBuiltApk.Length / 1MB, 2)
$fileHash = (Get-FileHash -Path $destLatestPath -Algorithm SHA256).Hash

Write-Host "`n=================================================================" -ForegroundColor Green
Write-Host ">>> BIEN DICH VIONE CONNECT APK THANH CONG! <<<" -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Green
Write-Host "Loai ban build     : $buildType" -ForegroundColor White
Write-Host "File APK chinh thuc: $destLatestPath" -ForegroundColor Yellow
Write-Host "File APK phien ban : $destVersionedPath" -ForegroundColor Yellow
Write-Host "Kich thuoc         : $fileSizeMB MB" -ForegroundColor White
Write-Host "SHA256 Checksum    : $fileHash" -ForegroundColor DarkGray
Write-Host "Package Identifier : com.vione.app" -ForegroundColor White
Write-Host "App Display Name   : ViOne Connect" -ForegroundColor White
Write-Host "-----------------------------------------------------------------" -ForegroundColor Gray
Write-Host "LENH CAI DAT NHANH VAO DIEN THOAI (ADB):" -ForegroundColor Cyan
Write-Host "  adb install -r `"$destLatestPath`"" -ForegroundColor White
Write-Host "=================================================================" -ForegroundColor Green

if (-not $NoOpenFolder) {
    explorer.exe /select,"$destLatestPath"
}
