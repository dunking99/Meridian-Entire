$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

$renames = @(
    # --- Markets / Components (currently 01-... through 06-...) ---
    @{ old = "Markets\Components\01-claude-opus-5-low.html";     new = "1. Claude Opus 5 Low.html" }
    @{ old = "Markets\Components\02-claude-opus-5-medium.html";  new = "2. Claude Opus 5 Medium.html" }
    @{ old = "Markets\Components\03-mimo-v2.6-flash-vol-2.html"; new = "3. Mimo v2.6 Flash Vol 2.html" }
    @{ old = "Markets\Components\04-mimo-v2.6-flash.html";       new = "4. Mimo v2.6 Flash.html" }
    @{ old = "Markets\Components\05-meridian-120-designs.html";  new = "5. Meridian 120 Designs.html" }
    @{ old = "Markets\Components\06-run-15.html";                new = "6. Run 15.html" }

    # --- Markets / Page-Layout ---
    @{ old = "Markets\Page-Layout\Markets - Layout - Claude Opus 5 - Terminal, The Ledger, Pulse.html";          new = "1. Claude Opus 5.html" }
    @{ old = "Markets\Page-Layout\Markets - Layout - Fable 5.1 Max - Atlas, The Markets Journal, Bento.html";    new = "2. Fable 5.1 Max.html" }
    @{ old = "Markets\Page-Layout\Markets - Layout - Mimo v2.6 Flash - APX, Ledger, Strand.html";               new = "3. Mimo v2.6 Flash.html" }
    @{ old = "Markets\Page-Layout\Markets - Layout - Mimo v2.6 Pro - Night Desk, The Ledger, Atlas.html";        new = "4. Mimo v2.6 Pro.html" }

    # --- Research / Components ---
    @{ old = "Research\Components\Research - Components - Claude Fable 5.1 Low.html";     new = "1. Claude Fable 5.1 Low.html" }
    @{ old = "Research\Components\Research - Components - Claude Opus 4.8 Thinking.html"; new = "2. Claude Opus 4.8 Thinking.html" }
    @{ old = "Research\Components\Research - Components - Claude Opus 5 Max.html";        new = "3. Claude Opus 5 Max.html" }
    @{ old = "Research\Components\Research - Components - GLM 5.3 Max.html";              new = "4. GLM 5.3 Max.html" }
    @{ old = "Research\Components\Research - Components - Grok 4.7 xHigh.html";           new = "5. Grok 4.7 xHigh.html" }
    @{ old = "Research\Components\Research - Components - u2 Flash.html";                 new = "6. u2 Flash.html" }
    @{ old = "Research\Components\meridian-specimen-book.html";                            new = "7. Meridian Specimen Book.html" }
)

foreach ($r in $renames) {
    $old = $r.old; $new = $r.new
    $dir = Split-Path $old
    $newPath = Join-Path $dir $new
    if (Test-Path -LiteralPath $old) {
        if (Test-Path -LiteralPath $newPath) {
            Write-Host "SKIP (target exists)  $new" -ForegroundColor Yellow
        } else {
            Rename-Item -LiteralPath $old -NewName $new
            Write-Host "OK    $new" -ForegroundColor Green
        }
    } else {
        Write-Host "MISS  $old" -ForegroundColor DarkGray
    }
}
Write-Host ""
Write-Host "Done. Any MISS lines mean the source name didn't match - send me them." -ForegroundColor Cyan