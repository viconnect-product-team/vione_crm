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
# LỆNH ĐỘC LẬP: TRIỂN KHAI APP HIỆP HỘI CLB DOANH NHÂN CEO 1983 (PORT 5444)
# =========================================================================

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host ">>> BẮT ĐẦU TRIỂN KHAI ĐỘC LẬP: APP HIỆP HỘI CLB CEO 1983 <<<" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

$bound = [System.Collections.Generic.Dictionary[string, object]]::new($PSBoundParameters)
[void]$bound.Remove("NoHttps")
$bound["EnableHttps"] = $EnableHttps

# 1. Gọi trực tiếp bộ deploy của CEO 1983 (đã bao gồm Nginx SSL Reverse Proxy khi bật EnableHttps)
& "$PSScriptRoot/deploy/ceo1983/fast-deploy.ps1" @bound

Write-Host "`n=================================================================" -ForegroundColor Green
Write-Host "TRIỂN KHAI APP HIỆP HỘI CLB CEO 1983 THÀNH CÔNG!" -ForegroundColor Green
Write-Host "1. App Hiệp Hội (HTTPS)               : https://14.225.217.232:5444" -ForegroundColor Yellow
Write-Host "2. Tên Miền Hỗ Trợ PWA Mobile iOS/App : https://dev-app.14-225-217-232.sslip.io:5444/association" -ForegroundColor Yellow
Write-Host "(Lưu ý: Hệ thống chạy chế độ bảo mật 100% HTTPS)" -ForegroundColor DarkGray
Write-Host "=================================================================" -ForegroundColor Green
