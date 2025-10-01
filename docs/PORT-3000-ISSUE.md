# Port 3000 Permission Denied Issue on Windows

## Problem
When running `pnpm run dev`, the client fails to start with error:
```
Error: listen EACCES: permission denied 127.0.0.1:3000
```

## Root Cause
Windows has dynamically reserved port 3000 in an excluded port range (2919-3018). This is caused by:
- **Hyper-V** - Virtual machine networking
- **WSL2** - Windows Subsystem for Linux 2 (uses Hyper-V)
- **Docker Desktop** - Uses Hyper-V networking
- **Windows NAT Driver** - Network address translation

When a port is in an excluded range, applications cannot bind to it.

## Diagnosis
Check excluded port ranges:
```powershell
netsh interface ipv4 show excludedportrange protocol=tcp
```

## Solutions

### Option 1: Run the Fix Script (Recommended)
We've created an automated script:
```powershell
# Run PowerShell as Administrator, then:
.\fix-port-3000.ps1
```

The script will:
1. Diagnose what's blocking the port
2. Show which services are causing the issue
3. Provide interactive fix options

### Option 2: Quick Temporary Fix
Restart Windows NAT service (requires Administrator):
```powershell
net stop winnat
net start winnat
```
**Note**: This is temporary - the port range may be reserved again after reboot.

### Option 3: Permanent Fix - Reserve Port 3000
Prevent Windows from dynamically allocating port 3000 (requires Administrator):
```powershell
netsh int ipv4 add excludedportrange protocol=tcp startport=3000 numberofports=1
```

### Option 4: Use Different Port (No admin required)
The Vite config has been updated to fall back to port 5173 if needed:
```javascript
// client2/vite.config.mjs
server: {
  host: '127.0.0.1',
  port: 5173,  // Vite's default - outside excluded ranges
  strictPort: false,
}
```

## Verification
After applying a fix, verify port 3000 is available:
```powershell
# Check excluded ranges again
netsh interface ipv4 show excludedportrange protocol=tcp

# Try running the dev server
pnpm run dev
```

## References
- [Microsoft WSL Issue #4150](https://github.com/microsoft/WSL/issues/4150)
- [Hyper-V Network Troubleshooting](https://docs.microsoft.com/en-us/virtualization/hyper-v-on-windows/user-guide/troubleshooting)
