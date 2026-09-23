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
# LENH DOC LAP: TRIEN KHAI HE THONG WEB CRM QUAN TRI VIONE (PORT 5443)
# =========================================================================

Write-Host "=================================================================" -ForegroundColor Magenta
Write-Host ">>> BAT DAU TRIEN KHAI DOC LAP: HE THONG WEB CRM VIONE PLATFORM <<<" -ForegroundColor Magenta
Write-Host "=================================================================" -ForegroundColor Magenta

$bound = [System.Collections.Generic.Dictionary[string, object]]::new($PSBoundParameters)
[void]$bound.Remove("NoHttps")
$bound["EnableHttps"] = $EnableHttps

# 1. Goi truc tiep bo deploy cua Web CRM Quan tri (da bao gom Nginx SSL Reverse Proxy khi bat EnableHttps)
& "$PSScriptRoot/deploy/crm/fast-deploy.ps1" @bound

Write-Host "`n=================================================================" -ForegroundColor Green
Write-Host "TRIEN KHAI HE THONG WEB CRM VIONE PLATFORM THANH CONG!" -ForegroundColor Green
Write-Host "1. ViOne Enterprise CRM (HTTPS) : https://14.225.217.232:5446" -ForegroundColor Yellow
Write-Host "   -> Mien sslip.io             : https://dev-vione-crm.14-225-217-232.sslip.io:5446" -ForegroundColor Yellow
Write-Host "(Luu y: He thong chay che do bao mat 100% HTTPS)" -ForegroundColor DarkGray
Write-Host "=================================================================" -ForegroundColor Green
