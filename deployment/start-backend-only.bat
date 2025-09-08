@echo off
echo =================================
echo INICIO SOLO DEL BACKEND API
echo =================================
echo.

echo Configurando variables de entorno...
set NODE_ENV=production
set PORT=3001
set HOST=0.0.0.0
set DB_SERVER=localhost
set DB_PORT=1433
set DB_DATABASE=datacenter_equipment
set DB_USER=sa
set ALLOWED_ORIGINS=http://localhost,http://107.3.52.136,https://107.3.52.136

echo Variables configuradas:
echo - NODE_ENV: %NODE_ENV%
echo - PORT: %PORT%
echo - HOST: %HOST%
echo - DB_SERVER: %DB_SERVER%
echo.

echo Cambiando al directorio del proyecto...
cd /d "%~dp0.."
echo Directorio actual: %CD%
echo.

echo Iniciando servidor backend...
echo ========================================
node server/index.js
echo ========================================
echo.

echo Si llegaste aquí, el servidor se detuvo.
echo Revisa los mensajes de error arriba.
pause