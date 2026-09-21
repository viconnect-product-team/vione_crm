param (
    [ValidateSet("all", "both", "ceo1983", "association", "crm", "vione")]
    [string]$Target = "all",
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
# Kịch bản triển khai nhanh linh hoạt (ViOne Monorepo Fast Deploy)
# - Triển khai MẶC ĐỊNH (HTTPS CẢ HAI: App Hiệp Hội + CRM Landing): .\fast-deploy.ps1
# - Triển khai App Hiệp Hội (Port 5002/5444):       .\fast-deploy.ps1 -Target ceo1983
# - Triển khai Web CRM và Landing (Port 5000/5443): .\fast-deploy.ps1 -Target crm
# - Triển khai chế độ HTTP thuần (Tắt SSL):        .\fast-deploy.ps1 -NoHttps
# =========================================================================

$bound = [System.Collections.Generic.Dictionary[string, object]]::new($PSBoundParameters)
[void]$bound.Remove("Target")
[void]$bound.Remove("NoHttps")
$bound["EnableHttps"] = $EnableHttps

if ($Target -in @("all", "both")) {
    Write-Host '=================================================================' -ForegroundColor Magenta
    Write-Host '[BƯỚC 1/2] BẮT ĐẦU TRIỂN KHAI APP HIỆP HỘI CLB CEO 1983 (PORT 5444/5002)...' -ForegroundColor Magenta
    Write-Host '=================================================================' -ForegroundColor Magenta
    & "$PSScriptRoot/deploy/ceo1983/fast-deploy.ps1" @bound

    Write-Host "`n=================================================================" -ForegroundColor Magenta
    Write-Host '[BƯỚC 2/2] BẮT ĐẦU TRIỂN KHAI WEB CRM PLATFORM VÀ LANDING (PORT 5443/5004)...' -ForegroundColor Magenta
    Write-Host '=================================================================' -ForegroundColor Magenta
    & "$PSScriptRoot/deploy/crm/fast-deploy.ps1" @bound

    if ($EnableHttps) {
        Write-Host "`n=================================================================" -ForegroundColor Magenta
        Write-Host '[BƯỚC BỔ SUNG] TRIỂN KHAI NGINX REVERSE PROXY HTTPS / SSL CHO DEV SERVER...' -ForegroundColor Magenta
        Write-Host '=================================================================' -ForegroundColor Magenta
        & "$PSScriptRoot/deploy/ssl/deploy-ssl.ps1"
    }

    Write-Host "`n=================================================================" -ForegroundColor Green
    Write-Host 'HOÀN TẤT TRIỂN KHAI TOÀN DIỆN CẢ 2 PHÂN HỆ LÊN DEV SERVER THÀNH CÔNG!' -ForegroundColor Green
    Write-Host '1. Web CRM Platform & Landing (HTTPS): https://14.225.217.232:5443 (HTTP: :5004)' -ForegroundColor Yellow
    Write-Host '2. App Hiệp Hội CLB CEO 1983 (HTTPS)  : https://14.225.217.232:5444 (HTTP: :5002)' -ForegroundColor Yellow
    Write-Host '3. Cổng Chuẩn SSL 443 (HTTPS)         : https://14.225.217.232/association và https://14.225.217.232/' -ForegroundColor Yellow
    Write-Host '4. Miền sslip.io hỗ trợ PWA iOS (SSL) : https://dev-app.14-225-217-232.sslip.io:5444/association' -ForegroundColor Yellow
    Write-Host '=================================================================' -ForegroundColor Green
} elseif ($Target -eq "crm") {
    & "$PSScriptRoot/deploy/crm/fast-deploy.ps1" @bound
    if ($EnableHttps) { & "$PSScriptRoot/deploy/ssl/deploy-ssl.ps1" }
} elseif ($Target -eq "vione") {
    & "$PSScriptRoot/deploy/vione/fast-deploy.ps1" @bound
    if ($EnableHttps) { & "$PSScriptRoot/deploy/ssl/deploy-ssl.ps1" }
} else {
    & "$PSScriptRoot/deploy/ceo1983/fast-deploy.ps1" @bound
    if ($EnableHttps) { & "$PSScriptRoot/deploy/ssl/deploy-ssl.ps1" }
}
