# ============================================================================
#  verify-all.ps1 - chay TOAN BO cong kiem tra cua ban demo SnapLife AI
#  Owner: Lead. Pham vi ghi: tools/verify-all.ps1, tools/_gate-*
#
#  File nay CO TINH thuan ASCII: PowerShell 5.1 doc .ps1 theo ANSI khi thieu BOM,
#  va chuoi co dau tieng Viet se bi hong.
#
#  Cach dung:
#     pwsh -File tools/verify-all.ps1                 # bo qua anh chup
#     pwsh -File tools/verify-all.ps1 -Shots          # chay ca shoot.ps1
#
#  Vi sao can: tools/audit.html chi soi BEN TRONG .app, nen no KHONG thay loi cua
#  khung shell (loi <body> va <div> cung mang class "shell" tung lam ca trang co
#  vao ~604px ben trai). GATE 6/7 ra doi vi dung lo hong do.
# ============================================================================
param(
  [string]$BaseUrl = 'http://127.0.0.1:8137',
  [switch]$Shots
)

$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$chrome = Join-Path $env:LOCALAPPDATA 'ms-playwright\chromium-1243\chrome-win64\chrome.exe'
if (-not (Test-Path $chrome)) { throw "Khong tim thay Chromium: $chrome" }

$script:failed = 0
$script:lines = @()

function Run-Chrome {
  param([string]$OutFile, [string]$ErrFile, [string[]]$ChromeArgs)
  $p = Start-Process -FilePath $chrome -ArgumentList $ChromeArgs -NoNewWindow -Wait -PassThru `
       -RedirectStandardOutput $OutFile -RedirectStandardError $ErrFile
  return $p.ExitCode
}

function Note {
  param([string]$Text, [bool]$Pass)
  $mark = if ($Pass) { '[ OK ]' } else { '[FAIL]' }
  if (-not $Pass) { $script:failed++ }
  $line = "$mark $Text"
  $script:lines += $line
  Write-Host $line
}

# ---------------------------------------------------------------- GATE 1: shell
Write-Host ''
Write-Host '=== GATE 1: bo cuc KHUNG SHELL (demo + web) @ 958/1278/1534/1917 ==='
Write-Host '            + ti le khung dien thoai 390:844 @ chieu cao cua so 600/722/900/1000'
$out = Join-Path $root 'tools\_gate-layout.txt'
Run-Chrome -OutFile $out -ErrFile (Join-Path $root 'tools\_gate-layout.err') -ChromeArgs @(
  '--headless=new','--disable-gpu','--disable-background-networking','--virtual-time-budget=60000','--dump-dom',
  "$BaseUrl/tools/layout-check.html?w=958,1278,1534,1917&h=901&aw=1534&hs=600,722,900,1000"
) | Out-Null
$dom = Get-Content $out -Raw
$verdict = [regex]::Match($dom, 'data-verdict="([^"]*)"').Groups[1].Value
$fails = [regex]::Match($dom, 'data-failures="([^"]*)"').Groups[1].Value
Note "layout-check: verdict=$verdict failures=$fails" ($verdict -eq 'pass')
if ($verdict -ne 'pass') {
  ($dom -split "`n") | Where-Object { $_ -match 'FAIL|de nhau|co con|tran ngang|khoang chet' } | ForEach-Object { Write-Host "      $_" }
}

# ------------------------------------------------------------- GATE 2: che do
Write-Host ''
Write-Host '=== GATE 2: che do demo/web (khoa cu bi ghim + duong thoat) ==='
$out = Join-Path $root 'tools\_gate-mode.txt'
Run-Chrome -OutFile $out -ErrFile (Join-Path $root 'tools\_gate-mode.err') -ChromeArgs @(
  '--headless=new','--disable-gpu','--disable-background-networking','--virtual-time-budget=30000','--dump-dom',
  "$BaseUrl/tools/mode-check.html"
) | Out-Null
$dom = Get-Content $out -Raw
$verdict = [regex]::Match($dom, 'data-verdict="([^"]*)"').Groups[1].Value
$fails = [regex]::Match($dom, 'data-failures="([^"]*)"').Groups[1].Value
Note "mode-check: verdict=$verdict failures=$fails" ($verdict -eq 'pass')
if ($verdict -ne 'pass') {
  ($dom -split "`n") | Where-Object { $_ -match '\[FAIL\]|FAIL' } | ForEach-Object { Write-Host "      $_" }
}

# ---------------------------------------------------------------- GATE 3: a11y
$widths = @(375, 768, 1024, 1280, 1500)
foreach ($w in $widths) {
  Write-Host ''
  Write-Host "=== GATE 3: audit.html @ $w (a11y + touch + tran ngang + tuong phan) ==="
  $out = Join-Path $root "tools\_gate-audit-$w.html"
  Run-Chrome -OutFile $out -ErrFile (Join-Path $root "tools\_gate-audit-$w.err") -ChromeArgs @(
    '--headless=new','--disable-gpu','--disable-background-networking','--virtual-time-budget=90000','--dump-dom',
    "$BaseUrl/tools/audit.html?w=$w"
  ) | Out-Null
  $dom = Get-Content $out -Raw
  $summary = [regex]::Match($dom, 'data-audit-summary="([^"]*)"').Groups[1].Value
  if (-not $summary) { $summary = 'KHONG CO KET QUA' }
  $ok = $summary -match 'screens=(\d+)/\1' -and $summary -match 'errors=0' -and $summary -match 'warns=0' -and $summary -match 'light=0' -and $summary -match 'dark=0'
  Note "audit @$w : $summary" $ok
}

# --------------------------------------------------------------- GATE 4/5: shell
Write-Host ''
Write-Host '=== GATE 4: web-check.html (tab bar <-> rail, che do web) ==='
$out = Join-Path $root 'tools\_gate-webcheck.txt'
Run-Chrome -OutFile $out -ErrFile (Join-Path $root 'tools\_gate-webcheck.err') -ChromeArgs @(
  '--headless=new','--disable-gpu','--disable-background-networking','--window-size=1400,1000','--virtual-time-budget=60000','--dump-dom',
  "$BaseUrl/tools/web-check.html"
) | Out-Null
$dom = Get-Content $out -Raw
$summary = [regex]::Match($dom, 'data-webcheck-summary="([^"]*)"').Groups[1].Value
$ok = $summary -match '^(\d+)/\1$'
Note "web-check: $summary" $ok

Write-Host ''
Write-Host '=== GATE 5: flows.html (luong end-to-end) ==='
$out = Join-Path $root 'tools\_gate-flows.txt'
Run-Chrome -OutFile $out -ErrFile (Join-Path $root 'tools\_gate-flows.err') -ChromeArgs @(
  '--headless=new','--disable-gpu','--disable-background-networking','--window-size=1400,1000','--virtual-time-budget=150000','--dump-dom',
  "$BaseUrl/tools/flows.html"
) | Out-Null
$dom = Get-Content $out -Raw
$summary = [regex]::Match($dom, 'data-flows-summary="([^"]*)"').Groups[1].Value
$ok = $summary -match '^(\d+)/\1$'
Note "flows: $summary" $ok

# --------------------------------------------------------- GATE 6/7: token
Write-Host ''
Write-Host '=== GATE 6: tools/check_contrast.py (tuong phan token) ==='
& python (Join-Path $root 'tools\check_contrast.py') 2>&1 | Select-Object -Last 2 | ForEach-Object { Write-Host "      $_" }
Note "check_contrast exit=$LASTEXITCODE" ($LASTEXITCODE -eq 0)

Write-Host ''
Write-Host '=== GATE 7: tools/check_story_ratio.py (ty le tieng Anh 15-20%) ==='
& python (Join-Path $root 'tools\check_story_ratio.py') 2>&1 | Select-Object -Last 2 | ForEach-Object { Write-Host "      $_" }
Note "check_story_ratio exit=$LASTEXITCODE" ($LASTEXITCODE -eq 0)

# ------------------------------------------------------------------ GATE 8: shot
if ($Shots) {
  Write-Host ''
  Write-Host '=== GATE 8: shoot.ps1 + check_shots.py (anh chup) ==='
  & (Join-Path $root 'tools\shoot.ps1') 2>$null | Select-Object -Last 3 | ForEach-Object { Write-Host "      $_" }
  & python (Join-Path $root 'tools\check_shots.py') (Join-Path $root 'tools\shots') 2>&1 | Select-Object -Last 3 | ForEach-Object { Write-Host "      $_" }
  Note "check_shots exit=$LASTEXITCODE" ($LASTEXITCODE -eq 0)
} else {
  Write-Host ''
  Write-Host '=== GATE 8: BO QUA anh chup (them -Shots de chay) ==='
}

# ---------------------------------------------------------------------- tong ket
Write-Host ''
Write-Host '================================ TONG KET ================================'
$script:lines | ForEach-Object { Write-Host $_ }
if ($script:failed -eq 0) {
  Write-Host 'TAT CA CONG KIEM DEU DAT'
  exit 0
} else {
  Write-Host "$script:failed CONG KIEM THAT BAI"
  exit 1
}
