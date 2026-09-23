param([switch]$Quiet)

$ports = 3000
foreach ($p in $ports) {
  $conns = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue
  foreach ($c in $conns) {
    Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
  }
}

if (-not $Quiet) {
  Write-Host "Everything stopped." -ForegroundColor Green
  Start-Sleep -Seconds 2
}