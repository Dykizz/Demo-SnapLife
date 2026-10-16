# ============================================================================
#  qa-gates.ps1 - chay lai cac cong kiem tra bang Chromium (QA doc lap)
#  Owner: qa-verify. Pham vi ghi: tools/qa-*
#  File nay CO TINH thuan ASCII (PowerShell 5.1 doc .ps1 theo ANSI khi thieu BOM).
#
#  Vi sao dung Start-Process -Wait -RedirectStandardOutput thay vi `& $chrome ... > file`:
#  khi chay tu mot so ngu canh (khong phai console that), `&` khong cho stdout cua
#  Chromium vao pipeline PowerShell -> file ra rong. Start-Process -Wait -Redirect...
#  cho ket qua on dinh va tra ve ca exit code.
# ============================================================================
param(
  [string]$BaseUrl = 'http://127.0.0.1:8137',
  [switch]$SkipShots
)

$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$chrome = Join-Path $env:LOCALAPPDATA 'ms-playwright\chromium-1243\chrome-win64\chrome.exe'
if (-not (Test-Path $chrome)) { throw "Khong tim thay Chromium: $chrome" }

function Run-Chrome {
  # LUU Y: khong dat ten tham so la $Args â€” do la bien tu dong cua PowerShell va se
  # luon rong, khien Start-Process bao "argument is null".
  param([string]$OutFile, [string]$ErrFile, [string[]]$ChromeArgs)
  $p = Start-Process -FilePath $chrome -ArgumentList $ChromeArgs -NoNewWindow -Wait -PassThru `
       -RedirectStandardOutput $OutFile -RedirectStandardError $ErrFile
  return $p.ExitCode
}

Write-Host '=== GATE 3: tools/audit.html (a11y + touch + tran ngang + tuong phan thuc te) ==='
$out3 = Join-Path $root 'tools\qa-dom-audit.html'
$rc = Run-Chrome -OutFile $out3 -ErrFile (Join-Path $root 'tools\qa-audit-err.txt') -ChromeArgs @(
  '--headless=new','--disable-gpu','--virtual-time-budget=60000','--dump-dom',
  "$BaseUrl/tools/audit.html"
)
Write-Host "chromium exit=$rc  stdout bytes=$((Get-Item $out3).Length)"
Select-String -Path $out3 -Pattern 'data-audit-summary' | ForEach-Object { $_.Line.Trim() }

Write-Host ''
Write-Host '=== GATE 4: tools/flows.html (luong end-to-end) ==='
$out4 = Join-Path $root 'tools\qa-dom-flows.html'
$rc = Run-Chrome -OutFile $out4 -ErrFile (Join-Path $root 'tools\qa-flows-err.txt') -ChromeArgs @(
  '--headless=new','--disable-gpu','--window-size=1400,1000','--virtual-time-budget=120000','--dump-dom',
  "$BaseUrl/tools/flows.html"
)
Write-Host "chromium exit=$rc  stdout bytes=$((Get-Item $out4).Length)"
Select-String -Path $out4 -Pattern 'data-flows-summary' | ForEach-Object { $_.Line.Trim() }

Write-Host ''
Write-Host '=== GATE 5: tools/check_shots.py tools/shots ==='
& python (Join-Path $root 'tools\check_shots.py') (Join-Path $root 'tools\shots')
Write-Host "check_shots exit=$LASTEXITCODE"

