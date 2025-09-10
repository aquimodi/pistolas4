@echo off
echo =================================
echo INICIO DIRECTO DEL SERVIDOR (sin PM2)
echo =================================
echo.

echo Limpiando procesos existentes...
taskkill /F /IM node.exe 2>nul
pm2 delete all 2>nul
echo.

echo Configurando variables de entorno...
set NODE_ENV=development
set PORT=3001
set DB_SERVER=localhost
set DB_DATABASE=datacenter_equipment
set DB_USER=sa
echo.

echo Variables configuradas:
echo - NODE_ENV: %NODE_ENV%
echo - PORT: %PORT%
echo - DB_SERVER: %DB_SERVER%
echo.

echo Verificando archivo del servidor...
if exist "server\index.js" (
    echo ✓ server\index.js encontrado
) else (
    echo ✗ server\index.js NO encontrado
    echo Directorio actual: %CD%
    pause
    exit /b 1
)
echo.

echo =================================
echo INICIANDO SERVIDOR BACKEND
echo =================================
echo Servidor ejecutándose en: http://localhost:3001
echo API Health Check: http://localhost:3001/health
echo.
echo Presiona Ctrl+C para detener el servidor
echo =================================
echo.

node server/index.js

echo.
echo =================================
echo SERVIDOR DETENIDO
echo =================================
pause