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

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 > $null

Write-Host "=================================================================" -ForegroundColor Magenta
Write-Host ">>> TRIEN KHAI DOC LAP: VIONE ENTERPRISE CRM PLATFORM (PORT 5446) <<<" -ForegroundColor Magenta
Write-Host "=================================================================" -ForegroundColor Magenta

$bound = [System.Collections.Generic.Dictionary[string, object]]::new($PSBoundParameters)
[void]$bound.Remove("NoHttps")
$bound["EnableHttps"] = $EnableHttps

# Goi bo deploy rieng cua ViOne CRM
& "$PSScriptRoot/deploy/crm/fast-deploy.ps1" @bound

Write-Host "`n=================================================================" -ForegroundColor Green
Write-Host "TRIEN KHAI VIONE ENTERPRISE CRM THANH CONG!" -ForegroundColor Green
Write-Host "1. ViOne Enterprise CRM (HTTPS) : https://14.225.217.232:5446" -ForegroundColor Yellow
Write-Host "   -> Mien sslip.io             : https://dev-vione-crm.14-225-217-232.sslip.io:5446" -ForegroundColor Yellow
Write-Host "2. ViOne Connect App (HTTPS)    : https://14.225.217.232:5445" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Green
