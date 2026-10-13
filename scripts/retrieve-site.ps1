<#
.SYNOPSIS
  Pulls the Experience Cloud site (created once by hand, see docs/experience-site-setup.md)
  into force-app so it can be committed and deployed to other orgs.

.EXAMPLE
  .\scripts\retrieve-site.ps1 -Org sdo2026
#>
param(
    [Parameter(Mandatory = $true)] [string] $Org,
    [string] $SiteName = 'Banking Hub'
)
$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')

# Site API names drop spaces: "Banking Hub" -> "Banking_Hub".
$apiName = $SiteName -replace ' ', '_'

Write-Host "Retrieving site '$SiteName' ($apiName) from $Org" -ForegroundColor Cyan
sf project retrieve start --target-org $Org `
    --metadata "DigitalExperienceBundle:site/$apiName" `
    --metadata "DigitalExperienceConfig:$apiName" `
    --metadata "Network:$SiteName" `
    --metadata "CustomSite:$apiName"
if ($LASTEXITCODE -ne 0) { throw 'Retrieve failed' }

Write-Host 'Retrieved. Review force-app/main/default/networks/*.network-meta.xml before committing:' -ForegroundColor Yellow
Write-Host '  - emailSenderAddress and the guest-user license are org-specific; keep values that exist in every target org.'
Write-Host '  - If you added Embedded Messaging, also retrieve EmbeddedServiceConfig and MessagingChannel (see the setup doc).'
