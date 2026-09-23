# rename-for-viewer.ps1
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

$map = [ordered]@{
  "Markets - Components - Claude Opus 5 Low.html"     = "01-claude-opus-5-low.html"
  "Markets - Components - Claude Opus 5 Medium.html"  = "02-claude-opus-5-medium.html"
  "Markets - Components - Mimo v2.6 Flash Vol 2.html" = "03-mimo-v2.6-flash-vol-2.html"
  "Markets - Components - Mimo v2.6 Flash.html"       = "04-mimo-v2.6-flash.html"
  "meridian-120-designs.html"                         = "05-meridian-120-designs.html"
  "run-15.html"                                       = "06-run-15.html"
}

foreach ($old in $map.Keys) {
  $new = $map[$old]
  if (Test-Path -LiteralPath $old) {
    if (Test-Path -LiteralPath $new) {
      Write-Host "SKIP  $old  (target already exists)" -ForegroundColor Yellow
    } else {
      Rename-Item -LiteralPath $old -NewName $new
      Write-Host "OK    $old  ->  $new" -ForegroundColor Green
    }
  } else {
    Write-Host "MISS  $old" -ForegroundColor DarkGray
  }
}
Write-Host ""
Write-Host "Done. If any showed MISS, check the exact filename (spaces, capitalization)." -ForegroundColor Cyan