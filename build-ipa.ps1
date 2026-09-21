param (
    [ValidateSet("preview", "production", "development")]
    [string]$Profile = "preview",
    [switch]$Submit,
    [switch]$Interactive,
    [switch]$Sync,
    [switch]$OpenDashboard
)

# =========================================================================
# VIONE CONNECT - 1-CLICK POWERSHELL IOS IPA BUILD SCRIPT (EAS / XCODE)
# He thong build IPA doc lap cho ung dung ViOne Connect
# =========================================================================

$ErrorActionPreference = "Stop"
$ROOT_DIR = $PSScriptRoot
$MOBILE_DIR = Join-Path $ROOT_DIR "apps\mobile_vione"
$CRED_DIR = Join-Path $MOBILE_DIR "credentials"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host ">>> [VIONE CONNECT] BAT DAU QUY TRINH XUAT BAN IOS IPA <<<" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "Thu muc goc      : $ROOT_DIR" -ForegroundColor DarkGray
Write-Host "Thu muc Mobile   : $MOBILE_DIR" -ForegroundColor DarkGray
Write-Host "Profile          : $Profile" -ForegroundColor Yellow
Write-Host "Tu dong Submit   : $(if ($Submit) { 'BAT (TestFlight)' } else { 'TAT (Chi xuat file .ipa)' })" -ForegroundColor Yellow

# 1. Kiem tra moi truong xac thuc EAS CLI
Write-Host "`n[1/4] Kiem tra tai khoan xac thuc Expo EAS..." -ForegroundColor Yellow
Push-Location $MOBILE_DIR
try {
    $whoami = cmd.exe /c "npx eas-cli whoami 2>nul"
    Write-Host "  -> Dang nhap voi tai khoan: $whoami" -ForegroundColor Green
} catch {
    Write-Warning "Chua dang nhap EAS CLI. Vui long chay 'npx eas-cli login' neu tien trinh yeu cau."
} finally {
    Pop-Location
}

# 2. Kiem tra chung chi Apple App Store Connect
Write-Host "`n[2/4] Kiem tra cau hinh chung chi & Apple API Key..." -ForegroundColor Yellow
$authKey = Join-Path $CRED_DIR "AuthKey_4Q734PS4PG.p8"
if (Test-Path $authKey) {
    Write-Host "  -> Da tim thay Apple AuthKey: AuthKey_4Q734PS4PG.p8" -ForegroundColor Green
    Write-Host "  -> Key ID     : 4Q734PS4PG" -ForegroundColor DarkGray
    Write-Host "  -> Issuer ID  : 6c7d5137-21b1-4bae-96d2-3cc761483dbc" -ForegroundColor DarkGray
    Write-Host "  -> Apple ID   : 6810608093 (tuanna@unicomhub.com)" -ForegroundColor DarkGray
} else {
    Write-Warning "Khong tim thay AuthKey_4Q734PS4PG.p8 trong $CRED_DIR. Ban co the can nhap Apple Developer credentials thu cong."
}

# 3. Dong bo Capacitor iOS neu co yeu cau
if ($Sync) {
    Write-Host "`n[3/4] Dong bo Capacitor iOS (cap sync ios)..." -ForegroundColor Yellow
    Push-Location $MOBILE_DIR
    try {
        npx cap sync ios
    } finally {
        Pop-Location
    }
} else {
    Write-Host "`n[3/4] Bo qua cap sync ios (su dung cau hinh hien hanh)..." -ForegroundColor DarkGray
}

# 4. Kich hoat lenh EAS Build iOS
Write-Host "`n[4/4] Khoi tao lenh EAS Build cho iOS..." -ForegroundColor Yellow

$easArgs = @("eas-cli", "build", "--platform", "ios", "--profile", $Profile)
if (-not $Interactive) {
    $easArgs += "--non-interactive"
}
if ($Submit) {
    $easArgs += "--auto-submit"
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
Write-Host ">>> LENH BUILD IOS DA DUOC GUI LEN HE THONG EAS CLOUD THANH CONG! <<<" -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Green
Write-Host "Theo doi tien trinh & tai file .ipa:" -ForegroundColor White
Write-Host "  -> EAS Builds     : https://expo.dev/accounts/unicom-vibe-coding-team/projects/vione/builds" -ForegroundColor Yellow
Write-Host "  -> TestFlight iOS : https://appstoreconnect.apple.com/apps/6810608093/testflight/ios" -ForegroundColor Yellow
Write-Host "Thong so cau hinh:" -ForegroundColor DarkGray
Write-Host "  - Bundle ID: ViOneBusinessConnect" -ForegroundColor DarkGray
Write-Host "  - App Name : ViOne Connect (Vione Business Connect)" -ForegroundColor DarkGray
Write-Host "=================================================================" -ForegroundColor Green

if ($OpenDashboard) {
    Start-Process "https://expo.dev/accounts/unicom-vibe-coding-team/projects/vione/builds"
}
