<#
.SYNOPSIS
  Chup anh + kiem tra loi runtime cho moi man hinh SnapLife AI.

.DESCRIPTION
  Chup qua tools/probe.html - khung 390x844 dat co dinh tai (0,0) - roi cat dung
  390x844 bang Pillow.

  Vi sao khong chup thang index.html: `--window-size=390,844` KHONG tao viewport
  390x844. Chrome ep viewport len toi thieu ~500x748 roi moi cat anh, nen anh ra
  bi lech va thieu. Cach o day cho ra anh dung kich thuoc that cua thiet bi.

  GHI CHU QUAN TRONG VE ENCODING: file nay CO TINH viet thuan ASCII (khong dau).
  Windows PowerShell 5.1 doc file .ps1 theo ANSI khi file thieu BOM, nen bat ky
  ky tu co dau nao cung lam vo viec phan tich cu phap. Giu ASCII thi file chay
  dung du duoc luu boi bat ky cong cu nao. Script Python trong tools/ khong bi
  van de nay (Python mac dinh doc source la UTF-8).

.EXAMPLE
  & .\tools\shoot.ps1
  & .\tools\shoot.ps1 -Screens home,reader,regions -Theme light
  & .\tools\shoot.ps1 -Theme both -OutDir tools/shots-both
#>
param(
  [string[]]$Screens = @(
    'splash','onboarding','placement','topics','home',
    'capture','regions','wordlist','worddetail',
    'compose','reader','speaking','stories',
    'review-hub','review-run','review-summary',
    'diary','progress','profile','compare','system-states'
  ),
  # 'light' | 'dark' | 'both'
  [string]$Theme = 'light',
  [string]$BaseUrl = 'http://127.0.0.1:8137',
  [string]$OutDir = 'tools/shots'
)

# KHONG dat 'Stop': Chromium luon ghi vai dong canh bao ra stderr
# ("Sandbox cannot access executable...", "Network service crashed...") du anh
# van duoc ghi ra binh thuong. Voi ErrorActionPreference='Stop', PowerShell coi
# stderr cua tien trinh ngoai la loi chan va script dung ngay o anh dau tien.
# Ta tu kiem ket qua bang su ton tai cua file anh va ma thoat.
$ErrorActionPreference = 'Continue'

$root = Split-Path -Parent $PSScriptRoot
$out = Join-Path $root $OutDir
New-Item -ItemType Directory -Force -Path $out | Out-Null

$chrome = Join-Path $env:LOCALAPPDATA 'ms-playwright\chromium-1243\chrome-win64\chrome.exe'
if (-not (Test-Path $chrome)) {
  $chrome = (Get-ChildItem "$env:LOCALAPPDATA\ms-playwright" -Recurse -Filter chrome.exe -ErrorAction SilentlyContinue |
             Select-Object -First 1 -ExpandProperty FullName)
}
if (-not $chrome) { throw "Khong tim thay Chromium. Cai playwright hoac sua duong dan trong script." }

$themes = if ($Theme -eq 'both') { @('light','dark') } else { @($Theme) }

Write-Host ""
Write-Host ("SnapLife - chup {0} man hinh - theme: {1}" -f $Screens.Count, ($themes -join ', ')) -ForegroundColor Cyan
Write-Host ""

$rows = @()
foreach ($themeName in $themes) {
  foreach ($id in $Screens) {
    $suffix  = if ($Theme -eq 'both') { "-$themeName" } else { '' }
    $pngName = "$id$suffix.png"
    $raw     = Join-Path $out "_raw-$pngName"
    $url     = '{0}/tools/probe.html?screen={1}&theme={2}' -f $BaseUrl, $id, $themeName

    # Cua so lon hon khung de khung 390x844 khong bi ep; cat lai bang Pillow.
    & $chrome --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 `
      --window-size=520,920 --virtual-time-budget=6000 `
      --screenshot="$raw" $url 2>$null | Out-Null
    $shotOk = Test-Path $raw

    # Kiem tra runtime cua chinh app that (khong phai khung probe).
    $domFile = Join-Path $out "_dom-$id$suffix.html"
    & $chrome --headless=new --disable-gpu --virtual-time-budget=6000 --dump-dom `
      "$BaseUrl/index.html#/$id" 2>$null | Out-File -Encoding utf8 $domFile
    $dom = Get-Content $domFile -Raw -Encoding utf8
    Remove-Item $domFile -Force -ErrorAction SilentlyContinue

    $ready       = $dom -match 'data-ready="true"'
    $errs        = [regex]::Match($dom, 'data-boot-errors="([^"]*)"').Groups[1].Value
    $placeholder = $dom -match 'Man hinh dang duoc dung'

    $status = if (-not $shotOk)         { 'KHONG CHUP DUOC' }
              elseif (-not $ready -and $dom.Length -lt 200) { 'DEMO CHUA CHAY?' }
              elseif (-not $ready)      { 'KHONG KHOI DONG' }
              elseif ($errs)            { 'CO LOI' }
              elseif ($placeholder)     { 'placeholder' }
              else                      { 'ok' }
    $color = switch ($status) { 'ok' { 'Green' } 'placeholder' { 'Yellow' } default { 'Red' } }
    Write-Host ("  {0,-22} {1,-16} {2}" -f "$id$suffix", $status, $themeName) -ForegroundColor $color

    $rows += [pscustomobject]@{ id = "$id$suffix"; theme = $themeName; status = $status; errors = $errs }
  }
}

# Cat tat ca anh tho ve dung 390x844.
Write-Host ""
Write-Host "Cat anh ve 390x844..." -ForegroundColor Cyan
& python (Join-Path $root 'tools\crop_shots.py') $out

$summary = Join-Path $out '_summary.txt'
$lines = @()
$lines += "SnapLife AI - chup man hinh - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
$lines += ("{0,-22} {1,-16} {2}" -f 'id', 'status', 'theme')
$lines += ('-' * 52)
foreach ($r in $rows) { $lines += ("{0,-22} {1,-16} {2}" -f $r.id, $r.status, $r.theme) }
$bad = $rows | Where-Object { $_.status -ne 'ok' }
$lines += ''
$lines += "ok: $(($rows | Where-Object status -eq 'ok').Count) / $($rows.Count)"
if ($bad) {
  $lines += 'Can xem lai:'
  foreach ($r in $bad) { $lines += ("  {0} - {1} {2}" -f $r.id, $r.status, $r.errors) }
}
$lines | Out-File -Encoding utf8 $summary
$lines | ForEach-Object { Write-Host $_ }

Write-Host ""
Write-Host "Anh: $out" -ForegroundColor Cyan
Write-Host "Tong ket: $summary" -ForegroundColor Cyan
Write-Host ""
if ($bad) { exit 1 }
