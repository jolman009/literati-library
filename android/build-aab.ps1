# Build AAB for Play Store
Set-Location "C:\Users\Jolma\Vibe-Code\my-library-app-2\android"
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Building AAB for Google Play Store" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Using Java from: $env:JAVA_HOME" -ForegroundColor Yellow
Write-Host ""

Write-Host "Cleaning previous builds and stopping Gradle daemon..." -ForegroundColor Yellow
.\gradlew.bat --stop
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "Cleaning build artifacts..." -ForegroundColor Yellow
.\gradlew.bat clean

Write-Host ""
Write-Host "Building Android App Bundle (AAB)..." -ForegroundColor Yellow
Write-Host "This is the file you'll upload to Play Store" -ForegroundColor Green
Write-Host "This may take 5-10 minutes..." -ForegroundColor Yellow
Write-Host ""

.\gradlew.bat bundleRelease --no-daemon --stacktrace

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Build failed! Check the errors above." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  AAB BUILD SUCCESSFUL!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "App Bundle location:" -ForegroundColor Yellow
Write-Host "app\build\outputs\bundle\release\app-release.aab" -ForegroundColor Cyan
Write-Host ""

if (Test-Path "app\build\outputs\bundle\release\app-release.aab") {
    $fileInfo = Get-Item "app\build\outputs\bundle\release\app-release.aab"
    $fileSizeMB = [math]::Round($fileInfo.Length / 1MB, 2)
    Write-Host "File size: $fileSizeMB MB" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ This file is ready for Google Play Store submission!" -ForegroundColor Green
