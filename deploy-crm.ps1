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
# LỆNH ĐỘC LẬP: TRIỂN KHAI HỆ THỐNG WEB CRM QUẢN TRỊ & LANDING (PORT 5443)
# =========================================================================

Write-Host "=================================================================" -ForegroundColor Magenta
Write-Host ">>> BẮT ĐẦU TRIỂN KHAI ĐỘC LẬP: HỆ THỐNG WEB CRM PLATFORM & LANDING <<<" -ForegroundColor Magenta
Write-Host "=================================================================" -ForegroundColor Magenta

$bound = [System.Collections.Generic.Dictionary[string, object]]::new($PSBoundParameters)
[void]$bound.Remove("NoHttps")
$bound["EnableHttps"] = $EnableHttps

# 1. Gọi trực tiếp bộ deploy của Web CRM Quản trị & Landing (đã bao gồm Nginx SSL Reverse Proxy khi bật EnableHttps)
& "$PSScriptRoot/deploy/crm/fast-deploy.ps1" @bound

Write-Host "`n=================================================================" -ForegroundColor Green
Write-Host "TRIỂN KHAI HỆ THỐNG WEB CRM QUẢN TRỊ & LANDING THÀNH CÔNG!" -ForegroundColor Green
Write-Host "1. Web CRM Platform (HTTPS)    : https://14.225.217.232:5443" -ForegroundColor Yellow
Write-Host "2. Landing CEO 1983 V1 (HTTPS) : https://14.225.217.232:5443/landing/ceo/v1" -ForegroundColor Yellow
Write-Host "(Lưu ý: Hệ thống chạy chế độ bảo mật 100% HTTPS)" -ForegroundColor DarkGray
Write-Host "=================================================================" -ForegroundColor Green
