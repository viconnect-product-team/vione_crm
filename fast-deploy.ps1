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
# Kich ban trien khai nhanh linh hoat (ViOne Monorepo Fast Deploy)
# - Trien khai MAC DINH (HTTPS CA HAI: App Hiep Hoi + CRM Landing): .\fast-deploy.ps1
# - Trien khai App Hiep Hoi (Port 5002/5444):       .\fast-deploy.ps1 -Target ceo1983
# - Trien khai Web CRM va Landing (Port 5000/5443): .\fast-deploy.ps1 -Target crm
# - Trien khai che do HTTP thuan (Tat SSL):        .\fast-deploy.ps1 -NoHttps
# =========================================================================

$bound = [System.Collections.Generic.Dictionary[string, object]]::new($PSBoundParameters)
[void]$bound.Remove("Target")
[void]$bound.Remove("NoHttps")
$bound["EnableHttps"] = $EnableHttps

if ($Target -in @("all", "both")) {
    Write-Host '=================================================================' -ForegroundColor Magenta
    Write-Host '[BUOC 1/2] BAT DAU TRIEN KHAI APP HIEP HOI CLB CEO 1983 (PORT 5444/5002)...' -ForegroundColor Magenta
    Write-Host '=================================================================' -ForegroundColor Magenta
    & "$PSScriptRoot/deploy/ceo1983/fast-deploy.ps1" @bound

    Write-Host "`n=================================================================" -ForegroundColor Magenta
    Write-Host '[BUOC 2/2] BAT DAU TRIEN KHAI WEB CRM PLATFORM VA LANDING (PORT 5443/5004)...' -ForegroundColor Magenta
    Write-Host '=================================================================' -ForegroundColor Magenta
    & "$PSScriptRoot/deploy/crm/fast-deploy.ps1" @bound

    if ($EnableHttps) {
        Write-Host "`n=================================================================" -ForegroundColor Magenta
        Write-Host '[BUOC BO SUNG] TRIEN KHAI NGINX REVERSE PROXY HTTPS / SSL CHO DEV SERVER...' -ForegroundColor Magenta
        Write-Host '=================================================================' -ForegroundColor Magenta
        & "$PSScriptRoot/deploy/ssl/deploy-ssl.ps1"
    }

    Write-Host "`n=================================================================" -ForegroundColor Green
    Write-Host 'HOAN TAT TRIEN KHAI TOAN DIEN CA 2 PHAN HE LEN DEV SERVER THANH CONG!' -ForegroundColor Green
    Write-Host '1. Web CRM Platform & Landing (HTTPS): https://14.225.217.232:5443 (HTTP: :5004)' -ForegroundColor Yellow
    Write-Host '2. App Hiep Hoi CLB CEO 1983 (HTTPS)  : https://14.225.217.232:5444 (HTTP: :5002)' -ForegroundColor Yellow
    Write-Host '3. Cong Chuan SSL 443 (HTTPS)         : https://14.225.217.232/association va https://14.225.217.232/' -ForegroundColor Yellow
    Write-Host '4. Mien sslip.io ho tro PWA iOS (SSL) : https://dev-app.14-225-217-232.sslip.io:5444/association' -ForegroundColor Yellow
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
