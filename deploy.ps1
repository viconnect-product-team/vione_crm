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
# VIONE STANDALONE DEPLOYMENT SCRIPT (HTTPS CONG 5445)
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
Write-Host "1. ViOne Connect App (HTTPS)     : https://14.225.217.232:5445" -ForegroundColor Yellow
Write-Host "   -> Mien sslip.io (PWA/SSL)    : https://dev-vione.14-225-217-232.sslip.io:5445" -ForegroundColor Yellow
Write-Host "   -> Tuyen duong chinh          : /connect-app (hoac /landing)" -ForegroundColor Yellow
Write-Host "2. ViOne Enterprise CRM (HTTPS)  : https://14.225.217.232:5446" -ForegroundColor Cyan
Write-Host "   -> Mien sslip.io (PWA/SSL)    : https://dev-vione-crm.14-225-217-232.sslip.io:5446" -ForegroundColor Cyan
Write-Host "   -> Tuyen duong chinh          : / (hoac /members, /events, /fees)" -ForegroundColor Cyan
Write-Host "3. Database CRM ViOne Co Lap     : vione_standalone_app (113.20.107.184:6432)" -ForegroundColor White
Write-Host "=================================================================" -ForegroundColor Green
