$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root
New-Item -ItemType Directory -Force -Path "$root\logs" | Out-Null

Write-Host "Starting UI Design viewer..." -ForegroundColor Cyan

# Stop anything left over from a previous run
& "$root\stop-all.ps1" -Quiet

# One static server for everything (viewer + all six designs)
Start-Process cmd -WindowStyle Hidden -WorkingDirectory $root -ArgumentList "/c npx --yes serve . -l 3000 > `"$root\logs\viewer.log`" 2>&1"

Write-Host "Waiting for server to start (about 8 seconds)..."
Start-Sleep -Seconds 8

Start-Process "http://localhost:3000/viewer.html"
Write-Host ""
Write-Host "Viewer opened in your browser." -ForegroundColor Green
Write-Host "To stop everything, double-click 'Stop Viewer.bat'."
Start-Sleep -Seconds 5