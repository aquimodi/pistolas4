@echo off
echo =================================
echo SYSTEM DIAGNOSTIC - Debug Mode
echo =================================
echo.

echo Environment Information:
echo NODE_ENV: %NODE_ENV%
echo PORT: %PORT%
echo Current Directory: %CD%
echo.

echo Checking ports...
netstat -an | findstr :3001
netstat -an | findstr :80
echo.

echo Checking processes...
tasklist | findstr node
tasklist | findstr nginx
tasklist | findstr pm2
echo.

echo PM2 Status:
pm2 list
echo.

echo PM2 Logs (last 20 lines):
pm2 logs --lines 20
echo.

echo Testing API directly...
curl -v http://localhost:3001/health
echo.

echo Testing through NGINX...
curl -v http://localhost/api/auth/verify
echo.

echo Checking NGINX configuration...
if exist "D:\nginx\conf\nginx.conf" (
    echo NGINX config exists
    findstr "proxy_pass" D:\nginx\conf\nginx.conf
) else (
    echo NGINX config not found
)
echo.

echo =================================
echo Debug completed
echo =================================
pause