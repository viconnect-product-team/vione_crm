param (
    [switch]$SkipBuild,
    [switch]$SkipWebBuild,
    [switch]$FrontendOnly,
    [switch]$BackendOnly,
    [switch]$InstallDeps
)

# Triển khai Web CRM Platform & Landing trên Port 5004/5005 (HTTPS 5443)
& "$PSScriptRoot/deploy/crm/fast-deploy.ps1" @PSBoundParameters
