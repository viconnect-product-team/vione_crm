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
# LENH DOC LAP: TRIEN KHAI VIONE APP - MANG XA HOI DOANH NHAN VIONE CONNECT (PORT 5445)
# TACH BIET HOAN TOAN KHOI HE THONG WEB CRM QUAN TRI
# =========================================================================

Write-Host "=================================================================" -ForegroundColor Magenta
Write-Host ">>> BAT DAU TRIEN KHAI DOC LAP: VIONE APP - MANG XA HOI VIONE CONNECT <<<" -ForegroundColor Magenta
Write-Host "=================================================================" -ForegroundColor Magenta

$bound = [System.Collections.Generic.Dictionary[string, object]]::new($PSBoundParameters)
[void]$bound.Remove("NoHttps")
$bound["EnableHttps"] = $EnableHttps

# 1. Goi truc tiep bo deploy cua ViOne App (da bao gom Nginx SSL Reverse Proxy khi bat EnableHttps)
& "$PSScriptRoot/deploy/vione/fast-deploy.ps1" @bound

Write-Host "`n=================================================================" -ForegroundColor Green
Write-Host "TRIEN KHAI VIONE APP - MANG XA HOI DOANH NHAN THANH CONG!" -ForegroundColor Green
Write-Host "1. ViOne App Mang Xa Hoi (HTTPS) : https://14.225.217.232:5445" -ForegroundColor Yellow
Write-Host "   -> Mien sslip.io (PWA/SSL)    : https://dev-vione.14-225-217-232.sslip.io:5445" -ForegroundColor Yellow
Write-Host "   -> Tuyen duong chinh          : /connect-app" -ForegroundColor Yellow
Write-Host "(Luu y: He thong ViOne App hoat dong doc lap hoan toan voi CRM)" -ForegroundColor DarkGray
Write-Host "=================================================================" -ForegroundColor Green
