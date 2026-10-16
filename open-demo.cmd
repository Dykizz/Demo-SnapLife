@echo off
REM ===========================================================================
REM  SnapLife AI - Mo demo giao dien
REM  Khong can cai gi them: chi can Node.js (da co san tren may nay).
REM ===========================================================================
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Khong tim thay Node.js.
  echo   Cach khac: chay  python -m http.server 8137  tai thu muc nay,
  echo   roi mo  http://127.0.0.1:8137/index.html
  echo.
  pause
  exit /b 1
)

echo.
echo   Dang mo SnapLife AI...
node "tools\serve.mjs" 8137 --open
