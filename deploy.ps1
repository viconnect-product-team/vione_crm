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
# VIONE STANDALONE DEPLOYMENT SCRIPT (HTTPS CỔNG 5445)
# Trien khai he thong doc lap ViOne Connect & Backend
# =========================================================================

Write-Host "=================================================================" -ForegroundColor Magenta
Write-Host ">>> BAT DAU TRIEN KHAI VIONE STANDALONE PLATFORM <<<" -ForegroundColor Magenta
Write-Host "=================================================================" -ForegroundColor Magenta

$bound = [System.Collections.Generic.Dictionary[string, object]]::new($PSBoundParameters)
[void]$bound.Remove("NoHttps")
$bound["EnableHttps"] = $EnableHttps

# 1. Goi truc tiep bo deploy cua ViOne App
& "$PSScriptRoot/deploy/vione/fast-deploy.ps1" @bound

Write-Host "`n=================================================================" -ForegroundColor Green
Write-Host "TRIEN KHAI VIONE PLATFORM THANH CONG!" -ForegroundColor Green
Write-Host "1. ViOne App Mang Xa Hoi (HTTPS) : https://14.225.217.232:5445" -ForegroundColor Yellow
Write-Host "   -> Mien sslip.io (PWA/SSL)    : https://dev-vione.14-225-217-232.sslip.io:5445" -ForegroundColor Yellow
Write-Host "   -> Tuyen duong chinh          : /connect-app" -ForegroundColor Yellow
Write-Host "2. Database CRM ViOne Co Lap     : vione_standalone_app (113.20.107.184:6432)" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Green
