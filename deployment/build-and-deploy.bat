@echo off
echo =================================
echo Building Datacenter Equipment Management System
echo =================================
echo.

set INSTALL_PATH=D:\nginx\pistolas

echo 1. Installing dependencies...
npm install
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to install dependencies
    exit /b 1
)

echo.
echo 2. Building frontend application...
npm run build
if %ERRORLEVEL% NEQ 0 (
    echo Error: Frontend build failed
    exit /b 1
)

echo.
echo 3. Copying files to deployment directory...
if not exist "%INSTALL_PATH%" mkdir "%INSTALL_PATH%"
if not exist "%INSTALL_PATH%\dist" mkdir "%INSTALL_PATH%\dist"
if not exist "%INSTALL_PATH%\server" mkdir "%INSTALL_PATH%\server"
if not exist "%INSTALL_PATH%\logs" mkdir "%INSTALL_PATH%\logs"

xcopy /E /I /Y "dist\*" "%INSTALL_PATH%\dist\"
xcopy /E /I /Y "server\*" "%INSTALL_PATH%\server\"
copy /Y "package.json" "%INSTALL_PATH%\"
copy /Y ".env" "%INSTALL_PATH%\"
copy /Y "deployment\ecosystem.config.js" "%INSTALL_PATH%\"

echo.
echo 4. Installing production dependencies...
cd /d "%INSTALL_PATH%"
npm install --production
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to install production dependencies
    exit /b 1
)

echo.
echo 5. Starting services...
pm2 delete all 2>nul
pm2 start ecosystem.config.cjs --env production
pm2 save

echo.
echo =================================
echo Deployment completed successfully!
echo =================================
echo.
echo Web Interface: http://localhost
echo API Endpoint: http://localhost:3001
echo.
echo To view logs: pm2 logs
echo To stop services: pm2 stop all
echo.
pause