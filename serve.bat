@echo off
REM ============================================================
REM  启动本地服务器并在浏览器中打开太阳系页面
REM  推荐路径：检测到 npm 时使用 Vite 开发服务器
REM ============================================================
cd /d "%~dp0"

where npm >nul 2>nul
if %ERRORLEVEL%==0 if exist package.json (
  echo 用 Vite 启动开发服务器在 http://localhost:5173/
  start "" "http://localhost:5173/"
  npm run dev
  exit /b
)

set PORT=8765
REM 兼容旧方式：优先用 Python 静态服务器
where python >nul 2>nul
if %ERRORLEVEL%==0 (
  echo 用 Python 启动服务器在 http://localhost:%PORT%
  start "" "http://localhost:%PORT%/index.html"
  python -m http.server %PORT%
  exit /b
)

REM 退而求其次：Node http-server
where npx >nul 2>nul
if %ERRORLEVEL%==0 (
  echo 用 npx http-server 启动 ...
  start "" "http://localhost:%PORT%/index.html"
  npx --yes http-server -p %PORT% -c-1
  exit /b
)

echo.
echo 未检测到 npm、Python 或 Node.js。请安装其一：
echo   Node:   https://nodejs.org/
echo   Python: https://www.python.org/downloads/
echo.
pause
