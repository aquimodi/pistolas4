@echo off
echo =================================
echo DIAGNÓSTICO COMPLETO DEL BACKEND
echo =================================
echo.

echo 1. Verificando procesos Node.js...
tasklist /FI "IMAGENAME eq node.exe" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo    ✓ Procesos Node.js encontrados
) else (
    echo    ✗ No hay procesos Node.js ejecutándose
)
echo.

echo 2. Verificando puerto 3001...
netstat -an | findstr :3001
if %ERRORLEVEL% EQU 0 (
    echo    ✓ Puerto 3001 en uso
) else (
    echo    ✗ Puerto 3001 NO está en uso - ESTE ES EL PROBLEMA
)
echo.

echo 3. Verificando PM2...
pm2 list
echo.

echo 4. Estado detallado de PM2...
pm2 describe datacenter-equipment-api
echo.

echo 5. Logs recientes de PM2...
pm2 logs --lines 10
echo.

echo 6. Verificando variables de entorno...
echo NODE_ENV: %NODE_ENV%
echo PORT: %PORT%
echo DB_SERVER: %DB_SERVER%
echo.

echo 7. Probando conexión local al backend...
echo Verificando http://localhost:3001/health
curl -v http://localhost:3001/health 2>&1
echo.

echo 8. Probando conexión desde IP externa...
echo Verificando http://107.3.52.136:3001/health
curl -v http://107.3.52.136:3001/health 2>&1
echo.

echo 9. Verificando configuración NGINX...
if exist "D:\nginx\conf\nginx.conf" (
    echo    ✓ nginx.conf existe
    findstr /C:"proxy_pass" D:\nginx\conf\nginx.conf
    if %ERRORLEVEL% EQU 0 (
        echo    ✓ Configuración proxy encontrada
    ) else (
        echo    ✗ Configuración proxy NO encontrada
    )
) else (
    echo    ✗ nginx.conf NO existe
)
echo.

echo =================================
echo RESUMEN DEL DIAGNÓSTICO:
echo =================================
echo Si el puerto 3001 NO está en uso, el problema es que
echo el backend Node.js NO se está ejecutando.
echo.
echo Soluciones:
echo 1. pm2 start ecosystem.config.cjs --env production
echo 2. node server/index.js (para testing)
echo 3. Revisar logs: pm2 logs
echo =================================
pause