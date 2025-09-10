@echo off
echo =================================
echo INICIO CON PM2 (Versión Corregida)
echo =================================
echo.

echo 1. Limpiando PM2 existente...
pm2 delete all 2>nul
pm2 kill 2>nul
echo.

echo 2. Verificando PM2...
pm2 --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo    ✗ PM2 no está disponible, instalando...
    npm install -g pm2
    if %ERRORLEVEL% NEQ 0 (
        echo    ✗ Error instalando PM2, usando inicio directo...
        goto :direct_start
    )
)
echo    ✓ PM2 disponible
echo.

echo 3. Configurando variables de entorno...
set NODE_ENV=production
set PORT=3001
set DB_SERVER=localhost
echo.

echo 4. Iniciando con PM2...
pm2 start server/index.js --name "datacenter-api" --env production
if %ERRORLEVEL% EQU 0 (
    echo    ✓ Servidor iniciado con PM2
    echo.
    echo Estado:
    pm2 list
    echo.
    echo Logs en tiempo real:
    pm2 logs datacenter-api --lines 20
) else (
    echo    ✗ Error con PM2, usando inicio directo...
    goto :direct_start
)
goto :end

:direct_start
echo.
echo =================================
echo FALLBACK: INICIO DIRECTO
echo =================================
call start-server-direct.bat

:end
echo.
pause