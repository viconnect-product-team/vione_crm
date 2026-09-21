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
# LỆNH ĐỘC LẬP: TRIỂN KHAI VIONE APP - MẠNG XÃ HỘI DOANH NHÂN VIONE CONNECT (PORT 5445)
# TÁCH BIỆT HOÀN TOÀN KHỎI HỆ THỐNG WEB CRM QUẢN TRỊ
# =========================================================================

Write-Host "=================================================================" -ForegroundColor Magenta
Write-Host ">>> BẮT ĐẦU TRIỂN KHAI ĐỘC LẬP: VIONE APP - MẠNG XÃ HỘI VIONE CONNECT <<<" -ForegroundColor Magenta
Write-Host "=================================================================" -ForegroundColor Magenta

$bound = [System.Collections.Generic.Dictionary[string, object]]::new($PSBoundParameters)
[void]$bound.Remove("NoHttps")
$bound["EnableHttps"] = $EnableHttps

# 1. Gọi trực tiếp bộ deploy của ViOne App (đã bao gồm Nginx SSL Reverse Proxy khi bật EnableHttps)
& "$PSScriptRoot/deploy/vione/fast-deploy.ps1" @bound

Write-Host "`n=================================================================" -ForegroundColor Green
Write-Host "TRIỂN KHAI VIONE APP - MẠNG XÃ HỘI DOANH NHÂN THÀNH CÔNG!" -ForegroundColor Green
Write-Host "1. ViOne App Mạng Xã Hội (HTTPS) : https://14.225.217.232:5445" -ForegroundColor Yellow
Write-Host "   -> Miền sslip.io (PWA/SSL)    : https://dev-vione.14-225-217-232.sslip.io:5445" -ForegroundColor Yellow
Write-Host "   -> Tuyến đường chính          : /connect-app" -ForegroundColor Yellow
Write-Host "(Lưu ý: Hệ thống ViOne App hoạt động độc lập hoàn toàn với CRM)" -ForegroundColor DarkGray
Write-Host "=================================================================" -ForegroundColor Green
