# ============================================================================
# Fix Port 3000 - Windows Port Exclusion Diagnostic & Fix Script
# ============================================================================
# This script diagnoses why port 3000 is blocked and provides fix options

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Port 3000 Diagnostic & Fix Script" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "WARNING: This script is not running as Administrator." -ForegroundColor Yellow
    Write-Host "Some fix options will require administrator privileges.`n" -ForegroundColor Yellow
}

# Step 1: Check current excluded port ranges
Write-Host "[Step 1] Checking Windows excluded port ranges..." -ForegroundColor Green
$excludedRanges = netsh interface ipv4 show excludedportrange protocol=tcp
Write-Host $excludedRanges
Write-Host ""

# Step 2: Check if anything is actively using port 3000
Write-Host "[Step 2] Checking if any process is actively using port 3000..." -ForegroundColor Green
$port3000Process = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

if ($port3000Process) {
    Write-Host "FOUND: Process using port 3000" -ForegroundColor Red
    $port3000Process | Format-Table LocalAddress, LocalPort, State, OwningProcess -AutoSize

    # Get process details
    foreach ($proc in $port3000Process) {
        $processInfo = Get-Process -Id $proc.OwningProcess -ErrorAction SilentlyContinue
        if ($processInfo) {
            Write-Host "  Process Name: $($processInfo.ProcessName)" -ForegroundColor Yellow
            Write-Host "  Process ID: $($processInfo.Id)" -ForegroundColor Yellow
            Write-Host "  Path: $($processInfo.Path)" -ForegroundColor Yellow
            Write-Host ""
        }
    }
} else {
    Write-Host "No process is actively using port 3000" -ForegroundColor Yellow
    Write-Host "Port is blocked by Windows excluded port range (likely Hyper-V/WSL2/Docker)`n" -ForegroundColor Yellow
}

# Step 3: Check which services might be causing the exclusion
Write-Host "[Step 3] Checking Windows services that reserve port ranges..." -ForegroundColor Green

$services = @(
    @{Name="Hyper-V"; ServiceName="vmms"; Description="Hyper-V Virtual Machine Management"},
    @{Name="WSL2"; ServiceName="LxssManager"; Description="Windows Subsystem for Linux"},
    @{Name="Docker"; ServiceName="com.docker.service"; Description="Docker Desktop Service"},
    @{Name="Windows NAT"; ServiceName="winnat"; Description="Windows NAT Driver"}
)

foreach ($svc in $services) {
    $service = Get-Service -Name $svc.ServiceName -ErrorAction SilentlyContinue
    if ($service) {
        $status = $service.Status
        $color = if ($status -eq "Running") { "Red" } else { "Gray" }
        Write-Host "  [$status] $($svc.Name) - $($svc.Description)" -ForegroundColor $color
    }
}
Write-Host ""

# Step 4: Provide fix options
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "FIX OPTIONS" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

Write-Host "Option 1: Restart Windows NAT (Quick Fix - Temporary)" -ForegroundColor Yellow
Write-Host "  This will temporarily free up ports but the range may be reserved again later."
Write-Host "  Commands:"
Write-Host "    net stop winnat" -ForegroundColor Gray
Write-Host "    net start winnat`n" -ForegroundColor Gray

Write-Host "Option 2: Reserve Port 3000 for Development (Recommended - Permanent)" -ForegroundColor Yellow
Write-Host "  This prevents Windows from dynamically allocating port 3000."
Write-Host "  Command (requires Administrator):"
Write-Host "    netsh int ipv4 add excludedportrange protocol=tcp startport=3000 numberofports=1`n" -ForegroundColor Gray

Write-Host "Option 3: Use Different Port (Easiest - No admin required)" -ForegroundColor Yellow
Write-Host "  Change Vite config to use port 5173 (Vite default) which is not blocked."
Write-Host "  Already configured in vite.config.mjs`n" -ForegroundColor Gray

Write-Host "Option 4: Disable Hyper-V Dynamic Port Reservation" -ForegroundColor Yellow
Write-Host "  This is more involved but prevents the issue permanently."
Write-Host "  See: https://github.com/microsoft/WSL/issues/4150`n" -ForegroundColor Gray

# Interactive prompt
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Would you like to apply a fix now? (Requires Administrator)" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

if (-not $isAdmin) {
    Write-Host "Please run this script as Administrator to apply fixes." -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'`n" -ForegroundColor Red
    pause
    exit
}

Write-Host "Select an option:" -ForegroundColor Green
Write-Host "  [1] Restart Windows NAT (temporary fix)"
Write-Host "  [2] Reserve port 3000 permanently (recommended)"
Write-Host "  [3] Both Option 1 and 2"
Write-Host "  [Q] Quit (no changes)"
Write-Host ""

$choice = Read-Host "Enter your choice"

switch ($choice.ToUpper()) {
    "1" {
        Write-Host "`nRestarting Windows NAT service..." -ForegroundColor Yellow
        try {
            Stop-Service winnat -Force -ErrorAction Stop
            Write-Host "Stopped winnat" -ForegroundColor Green
            Start-Sleep -Seconds 2
            Start-Service winnat -ErrorAction Stop
            Write-Host "Started winnat" -ForegroundColor Green
            Write-Host "`nChecking excluded port ranges after restart..." -ForegroundColor Yellow
            netsh interface ipv4 show excludedportrange protocol=tcp
            Write-Host "`nNOTE: Port 3000 should now be available temporarily." -ForegroundColor Cyan
            Write-Host "The exclusion may return after reboot or service restart." -ForegroundColor Cyan
        } catch {
            Write-Host "ERROR: Failed to restart winnat - $_" -ForegroundColor Red
        }
    }
    "2" {
        Write-Host "`nReserving port 3000 permanently..." -ForegroundColor Yellow
        try {
            $result = netsh int ipv4 add excludedportrange protocol=tcp startport=3000 numberofports=1
            Write-Host $result
            Write-Host "`nPort 3000 has been reserved for development use." -ForegroundColor Green
            Write-Host "This setting persists across reboots." -ForegroundColor Green
        } catch {
            Write-Host "ERROR: Failed to reserve port - $_" -ForegroundColor Red
        }
    }
    "3" {
        Write-Host "`nApplying both fixes..." -ForegroundColor Yellow

        # First restart winnat
        try {
            Write-Host "Restarting Windows NAT service..." -ForegroundColor Yellow
            Stop-Service winnat -Force -ErrorAction Stop
            Write-Host "  Stopped winnat" -ForegroundColor Green
            Start-Sleep -Seconds 2
            Start-Service winnat -ErrorAction Stop
            Write-Host "  Started winnat" -ForegroundColor Green
        } catch {
            Write-Host "  ERROR: Failed to restart winnat - $_" -ForegroundColor Red
        }

        # Then reserve port
        try {
            Write-Host "`nReserving port 3000 permanently..." -ForegroundColor Yellow
            $result = netsh int ipv4 add excludedportrange protocol=tcp startport=3000 numberofports=1
            Write-Host $result
            Write-Host "`nPort 3000 is now available and reserved." -ForegroundColor Green
        } catch {
            Write-Host "  ERROR: Failed to reserve port - $_" -ForegroundColor Red
        }
    }
    "Q" {
        Write-Host "`nNo changes made. Exiting..." -ForegroundColor Gray
        exit
    }
    default {
        Write-Host "`nInvalid choice. No changes made." -ForegroundColor Red
    }
}

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "VERIFICATION" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

Write-Host "Current excluded port ranges:" -ForegroundColor Yellow
netsh interface ipv4 show excludedportrange protocol=tcp

Write-Host "`n`nYou can now try running: pnpm run dev" -ForegroundColor Green
Write-Host ""
pause
