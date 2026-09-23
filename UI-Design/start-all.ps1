$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root
New-Item -ItemType Directory -Force -Path "$root\logs" | Out-Null

Write-Host "Starting UI Design viewer..." -ForegroundColor Cyan

# Make sure PostgreSQL is running (needed for designs 9-11)
Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue | Where-Object { $_.Status -ne 'Running' } | ForEach-Object { Start-Service $_.Name -ErrorAction SilentlyContinue }

# Stop anything left over from a previous run
& "$root\stop-all.ps1" -Quiet

# Viewer + designs 1-4 on port 3000 (hidden)
Start-Process cmd -WindowStyle Hidden -WorkingDirectory $root -ArgumentList "/c npx --yes serve . -l 3000 > `"$root\logs\viewer.log`" 2>&1"

# Designs 5-11, one hidden server each on port 4000+N
foreach ($n in 5..11) {
  $port = 4000 + $n
  $dir = Join-Path $root "UI-Design-$n"
  if (Test-Path $dir) {
    Write-Host "  Starting design $n on port $port"
    Start-Process cmd -WindowStyle Hidden -WorkingDirectory $dir -ArgumentList "/c set PORT=$port && npm run dev > `"$root\logs\design-$n.log`" 2>&1"
  }
}

Write-Host "Waiting for servers to start (about 15 seconds)..."
Start-Sleep -Seconds 15
Start-Process "http://localhost:3000/viewer.html"
Write-Host ""
Write-Host "Viewer opened in your browser. Everything is running in the background." -ForegroundColor Green
Write-Host "To stop everything, double-click 'Stop Viewer.bat'."
Start-Sleep -Seconds 5
