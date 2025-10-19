Add-Type -AssemblyName System.Drawing

$files = @(
    "screenshot-dashboard.png",
    "screenshot-library.png",
    "screenshot-reading.png",
    "screenshot-statistics.png",
    "screenshot-notes.png",
    "screenshot-mentor.png"
)

foreach ($file in $files) {
    $path = "c:\Users\Jolma\Vibe-Code\my-library-app-2\client2\public\$file"
    $img = [System.Drawing.Image]::FromFile($path)
    Write-Output "$file : $($img.Width)x$($img.Height)"
    $img.Dispose()
}
