<#!>
.SYNOPSIS
  ShelfQuest readiness script: runs tests, builds preview, executes Lighthouse, and aggregates artifacts.

.PARAMETER Env
  Target environment: 'staging' or 'production' (default: staging)

.PARAMETER Url
  URL to audit with Lighthouse (default: http://localhost:5174)

.PARAMETER SkipInstall
  Skip dependency installation steps.

.PARAMETER SkipLighthouse
  Skip Lighthouse audit.

.PARAMETER LighthouseCategories
  Lighthouse categories to audit (default: performance, accessibility, best-practices, seo)

.PARAMETER LighthousePreset
  Lighthouse preset: 'desktop' or 'mobile' (default: desktop)

.EXAMPLE
  pwsh ./run_readiness.ps1 -Env staging

.NOTES
  Requires Node.js (20 or 22), pnpm via Corepack, and Chrome/Chromium for Lighthouse.
  Produces artifacts:
    - client2/coverage/coverage-summary.json
    - server2/coverage/coverage-summary.json
    - client2/lh-report.json (and lh-report.html)
#>

[CmdletBinding()]
param(
  [ValidateSet('staging','production')]
  [string]$Env = 'staging',

  [string]$Url = 'http://localhost:5174',

  [switch]$SkipInstall,
  [switch]$SkipLighthouse,

  [string[]]$LighthouseCategories = @('performance','accessibility','best-practices','seo'),
  [ValidateSet('desktop','mobile')]
  [string]$LighthousePreset = 'desktop'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Section([string]$Msg){
  $ts = (Get-Date).ToString('HH:mm:ss')
  Write-Host "`n=== [$ts] $Msg ===" -ForegroundColor Cyan
}
function Write-Info([string]$Msg){ Write-Host "[INFO] $Msg" -ForegroundColor Gray }
function Write-Warn([string]$Msg){ Write-Host "[WARN] $Msg" -ForegroundColor Yellow }
function Write-Err ([string]$Msg){ Write-Host "[ERROR] $Msg" -ForegroundColor Red }

$repoRoot = (Get-Location)
$clientDir = Join-Path $repoRoot 'client2'
$serverDir = Join-Path $repoRoot 'server2'

$results = [ordered]@{
  nodeVersion = $null
  pnpmVersion = $null
  client = @{ tests = $null; coveragePath = $null }
  server = @{ tests = $null; coveragePath = $null }
  lighthouse = @{ ran = $false; url = $Url; json = (Join-Path $clientDir 'lh-report.json'); html = (Join-Path $clientDir 'lh-report.html') }
}

Write-Section "Environment checks"
try {
  $nodeV = (& node -v) 2>$null
  if(-not $nodeV){ throw 'Node.js not found in PATH' }
  $results.nodeVersion = $nodeV.Trim()
  Write-Info "Node: $($results.nodeVersion)"
} catch {
  Write-Err "Node.js is required. Install Node 20 or 22 and retry. $_"
  exit 1
}

try {
  & corepack enable | Out-Null
  & corepack prepare pnpm@8.15.6 --activate | Out-Null
} catch { Write-Warn 'Corepack enable/prepare failed (continuing if pnpm exists)' }

try {
  $pnpmV = (& pnpm -v) 2>$null
  if(-not $pnpmV){ throw 'pnpm not available' }
  $results.pnpmVersion = $pnpmV.Trim()
  Write-Info "pnpm: $($results.pnpmVersion)"
} catch {
  Write-Err "pnpm is required. Run 'corepack enable' and 'corepack prepare pnpm@8.15.6 --activate' then retry. $_"
  exit 1
}

if(-not $SkipInstall){
  Write-Section "Install dependencies"
  Push-Location $clientDir
  try { pnpm install --frozen-lockfile } finally { Pop-Location }
  Push-Location $serverDir
  try { pnpm install --frozen-lockfile } finally { Pop-Location }
} else {
  Write-Info 'Skipping install as requested.'
}

Write-Section "Client tests (coverage)"
$clientExit = 0
Push-Location $clientDir
try {
  pnpm test:coverage
  $clientExit = $LASTEXITCODE
} catch {
  $clientExit = 1
  Write-Warn "Client tests errored: $_"
} finally { Pop-Location }
$results.client.tests = if($clientExit -eq 0){ 'passed' } else { 'failed' }
# Determine available client coverage artifact
if(Test-Path (Join-Path $clientDir 'coverage/coverage-summary.json')){
  $results.client.coveragePath = (Join-Path $clientDir 'coverage/coverage-summary.json')
} elseif(Test-Path (Join-Path $clientDir 'coverage/coverage-final.json')){
  $results.client.coveragePath = (Join-Path $clientDir 'coverage/coverage-final.json')
} elseif(Test-Path (Join-Path $clientDir 'coverage/index.html')){
  $results.client.coveragePath = (Join-Path $clientDir 'coverage/index.html')
}
$clientCovDisplay = if($results.client.coveragePath){ $results.client.coveragePath } else { 'not found' }
Write-Info "Client tests: $($results.client.tests). Coverage: $clientCovDisplay"

Write-Section "Server tests (coverage)"
$serverExit = 0
Push-Location $serverDir
try {
  $env:JWT_SECRET = 'test_jwt_secret_32_characters_long'
  $env:NODE_ENV = 'test'
  pnpm test:coverage
  $serverExit = $LASTEXITCODE
} catch {
  $serverExit = 1
  Write-Warn "Server tests errored: $_"
} finally { Pop-Location }
$results.server.tests = if($serverExit -eq 0){ 'passed' } else { 'failed' }
# Determine available server coverage artifact
if(Test-Path (Join-Path $serverDir 'coverage/coverage-summary.json')){
  $results.server.coveragePath = (Join-Path $serverDir 'coverage/coverage-summary.json')
} elseif(Test-Path (Join-Path $serverDir 'coverage/coverage-final.json')){
  $results.server.coveragePath = (Join-Path $serverDir 'coverage/coverage-final.json')
} elseif(Test-Path (Join-Path $serverDir 'coverage/lcov-report/index.html')){
  $results.server.coveragePath = (Join-Path $serverDir 'coverage/lcov-report/index.html')
}
$serverCovDisplay = if($results.server.coveragePath){ $results.server.coveragePath } else { 'not found' }
Write-Info "Server tests: $($results.server.tests). Coverage: $serverCovDisplay"

Write-Section "Build client ($Env)"
Push-Location $clientDir
try {
  if($Env -eq 'staging'){ pnpm build:staging } else { pnpm build:production }
} finally { Pop-Location }

function Wait-ForUrl([string]$TargetUrl, [int]$TimeoutSec = 90){
  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  do {
    try {
      $resp = Invoke-WebRequest -Uri $TargetUrl -UseBasicParsing -Method Head -TimeoutSec 5
      if($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 500){ return $true }
    } catch { Start-Sleep -Milliseconds 500 }
  } while((Get-Date) -lt $deadline)
  return $false
}

Write-Section "Start preview server"
$previewCommand = if($Env -eq 'staging'){ 'pnpm preview:staging' } else { 'pnpm preview:production' }
$previewProc = $null
try {
  $startInfo = New-Object System.Diagnostics.ProcessStartInfo
  $startInfo.FileName = (Get-Command pwsh).Source
  $startInfo.WorkingDirectory = $clientDir
  $startInfo.Arguments = "-NoProfile -Command $previewCommand"
  $startInfo.RedirectStandardOutput = $true
  $startInfo.RedirectStandardError = $true
  $startInfo.UseShellExecute = $false
  $startInfo.CreateNoWindow = $true
  $previewProc = [System.Diagnostics.Process]::Start($startInfo)
  Write-Info "Preview PID: $($previewProc.Id)"

  if(-not (Wait-ForUrl -TargetUrl $Url -TimeoutSec 120)){
    Write-Warn "Preview not reachable at $Url within timeout; continuing"
  }
} catch {
  Write-Warn "Failed to start preview: $_"
}

if(-not $SkipLighthouse){
  Write-Section "Lighthouse audit"
  try {
    $catsArg = ($LighthouseCategories | ForEach-Object { "--only-categories=$_" }) -join ' '
    Push-Location $clientDir
    # JSON
    npx --yes lighthouse $Url --quiet --chrome-flags="--headless" $catsArg --preset=$LighthousePreset --output=json --output-path=./lh-report.json
    # HTML
    npx --yes lighthouse $Url --quiet --chrome-flags="--headless" $catsArg --preset=$LighthousePreset --output=html --output-path=./lh-report.html
    Pop-Location
    $results.lighthouse.ran = $true
    Write-Info "Lighthouse reports saved: $($results.lighthouse.json), $($results.lighthouse.html)"
  } catch {
    Write-Warn "Lighthouse failed: $_"
  }
} else {
  Write-Info 'Skipping Lighthouse as requested.'
}

Write-Section "Teardown preview"
try {
  if($previewProc -and -not $previewProc.HasExited){
    $previewProc.Kill()
    $previewProc.WaitForExit(5000) | Out-Null
  }
} catch { Write-Warn "Failed to stop preview: $_" }

Write-Section "Summary"
$summaryPath = Join-Path $repoRoot 'run_readiness.results.json'
$results | ConvertTo-Json -Depth 4 | Set-Content -Encoding UTF8 $summaryPath
Write-Host (Get-Content $summaryPath -Raw)
Write-Host "`nArtifacts:" -ForegroundColor Green
Write-Host "  - $($results.client.coveragePath)"
Write-Host "  - $($results.server.coveragePath)"
if($results.lighthouse.ran){
  Write-Host "  - $($results.lighthouse.json)"
  Write-Host "  - $($results.lighthouse.html)"
}

if($results.client.tests -ne 'passed' -or $results.server.tests -ne 'passed'){
  Write-Warn 'One or more test suites failed. See console output and coverage artifacts.'
}

Write-Section "Done"
exit 0
