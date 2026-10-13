<#
.SYNOPSIS
  Deploys the Banking Hub (components, Apex, Named Credential, permission set and,
  once retrieved, the Experience Cloud site) to an org, then publishes the site.

.EXAMPLE
  .\scripts\deploy.ps1 -Org sdo2026
  .\scripts\deploy.ps1 -Org myNewOrg -SkipPublish
#>
param(
    [Parameter(Mandatory = $true)] [string] $Org,
    [string] $SiteName = 'BWAM Suite',
    [switch] $SkipPublish
)
$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')

# The Network metadata carries an emailSenderAddress that must exist in the target org.
# Use the deploying user's address so the same file deploys anywhere.
$networkFile = Join-Path 'force-app' 'main' 'default' 'networks' "$SiteName.network-meta.xml"
if (Test-Path $networkFile) {
    $me = (sf org display user --target-org $Org --json | ConvertFrom-Json).result.username
    $xml = [System.IO.File]::ReadAllText($networkFile)
    $xml = [regex]::Replace($xml, '<emailSenderAddress>.*?</emailSenderAddress>', "<emailSenderAddress>$me</emailSenderAddress>")
    [System.IO.File]::WriteAllText($networkFile, $xml, (New-Object System.Text.UTF8Encoding($false)))
    Write-Host "Network emailSenderAddress set to $me (not committed; git checkout to revert)" -ForegroundColor DarkGray
}

Write-Host "Deploying force-app to $Org" -ForegroundColor Cyan
sf project deploy start --source-dir force-app --target-org $Org `
    --test-level RunSpecifiedTests --tests BankingIntegrationServiceTest
if ($LASTEXITCODE -ne 0) { throw 'Deploy failed' }

Write-Host 'Assigning the Banking Hub Integration permission set to the running user' -ForegroundColor Cyan
sf org assign permset --name Banking_Hub_Integration --target-org $Org
# Assign it to the demo customer user too; see docs/experience-site-setup.md step 5.

$siteInRepo = Test-Path (Join-Path 'force-app' 'main' 'default' 'digitalExperiences' 'site')
if (-not $SkipPublish -and $siteInRepo) {
    # LWR sites are frozen at publish time: every LWC change needs a publish to go live.
    Write-Host "Publishing site '$SiteName'" -ForegroundColor Cyan
    sf community publish --name $SiteName --target-org $Org
} elseif (-not $siteInRepo) {
    Write-Host 'No site in the repo yet. Create it once in the org, then run scripts/retrieve-site.ps1.' -ForegroundColor Yellow
}
