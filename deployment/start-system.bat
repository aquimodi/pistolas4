@echo off
echo =================================
echo Datacenter Equipment Management System
echo =================================
echo.

echo Checking system status...
echo.

REM Check if Node.js is available
echo 1. Checking Node.js...
node --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo    ✓ Node.js is available
) else (
    echo    ✗ Node.js not found - Please install Node.js
    pause
    exit /b 1
)

REM Check if PM2 is available
echo 2. Checking PM2...
pm2 --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo    ✓ PM2 is available
) else (
    echo    ! PM2 not found - Installing PM2...
    npm install -g pm2
)

echo.
echo Starting services...
echo.

REM Stop any existing processes
echo 3. Stopping existing services...
pm2 delete all >nul 2>&1
taskkill /F /IM nginx.exe >nul 2>&1

echo.
echo 4. Starting Node.js API...
cd /d "%~dp0.."
set NODE_ENV=production
set PORT=3001
set HOST=0.0.0.0

REM Try to start with PM2 first
pm2 start ecosystem.config.cjs --env production
if %ERRORLEVEL% EQU 0 (
    echo    ✓ API started with PM2
) else (
    echo    ! PM2 failed, starting directly...
    start /b node server/index.js
    timeout /t 3 /nobreak > nul
    echo    ✓ API started directly
)

echo.
echo 5. Starting NGINX...
if exist "D:\nginx\nginx.exe" (
    cd /d "D:\nginx"
    start /b nginx.exe
    echo    ✓ NGINX started
) else (
    echo    ! NGINX not found at D:\nginx\nginx.exe
    echo    Please ensure NGINX is installed
)

echo.
echo 6. Checking service status...
timeout /t 5 /nobreak > nul

REM Check if API is responding
echo Testing API connection...
curl -s http://localhost:3001/health >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo    ✓ API is responding
) else (
    echo    ✗ API is not responding
)

REM Check if frontend is accessible
echo Testing frontend connection...
curl -s http://localhost/ >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo    ✓ Frontend is accessible
) else (
    echo    ✗ Frontend is not accessible
)

echo.
echo =================================
echo System Status:
echo Web Interface: http://localhost
echo API Endpoint: http://localhost:3001
echo Health Check: http://localhost:3001/health
echo =================================
echo.
echo Press any key to view logs...
pause > nul
pm2 logs --lines 50