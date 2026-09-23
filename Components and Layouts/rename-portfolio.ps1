$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

$map = [ordered]@{
  "Portfolio\Components\Claude Opus 5 Medium 40 x 3 Components.html"     = "1. Claude Opus 5 Medium.html"
  "Portfolio\Components\DeepSeek 40 x 3 Components.html"                 = "2. DeepSeek.html"
  "Portfolio\Components\Gemini 3.8 Flash Medium 40 x 3 Components.html"  = "3. Gemini 3.8 Flash.html"
  "Portfolio\Components\Grok 4.6 40 x 3 Components 2 - Best.html"        = "4. Grok 4.6 (Best).html"
  "Portfolio\Components\Grok 4.6 40 x 3 Components.html"                 = "5. Grok 4.6.html"
  "Portfolio\Components\Grok 4.7 xHigh 40 x 3 Components.html"           = "6. Grok 4.7 xHigh.html"
  "Portfolio\Components\Kimi k3 40 x 3 Components.html"                  = "7. Kimi k3.html"
}

foreach ($old in $map.Keys) {
  $new = $map[$old]
  $dir = Split-Path $old
  $newPath = Join-Path $dir $new
  if (Test-Path -LiteralPath $old) {
    if (Test-Path -LiteralPath $newPath) {
      Write-Host "SKIP  $old  (target exists)" -ForegroundColor Yellow
    } else {
      Rename-Item -LiteralPath $old -NewName $new
      Write-Host "OK    ->  $new" -ForegroundColor Green
    }
  } else {
    Write-Host "MISS  $old" -ForegroundColor DarkGray
  }
}