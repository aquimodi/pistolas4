@echo off
echo =================================
echo DIAGNÓSTICO COMPLETO DEL SERVIDOR
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

echo 2. Verificando PM2...
pm2 --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo    ✓ PM2 está instalado
    echo    Estado de PM2:
    pm2 list
    echo.
    echo    Procesos PM2:
    pm2 describe datacenter-equipment-api 2>nul
) else (
    echo    ✗ PM2 no está instalado o no funciona
)
echo.

echo 3. Verificando puerto 3001...
netstat -an | findstr :3001
if %ERRORLEVEL% EQU 0 (
    echo    ✓ Puerto 3001 está en uso
) else (
    echo    ✗ Puerto 3001 NO está en uso
)
echo.

echo 4. Verificando archivo del servidor...
if exist "server\index.js" (
    echo    ✓ server\index.js existe en directorio actual
) else (
    echo    ✗ server\index.js NO existe en directorio actual
)
echo.

echo 5. Verificando Node.js...
node --version
echo.

echo =================================
echo RECOMENDACIONES:
echo =================================
if not exist "server\index.js" (
    echo ❌ PROBLEMA: No se encuentra server\index.js
    echo    Solución: Ejecutar desde el directorio correcto
)

pm2 list 2>nul | findstr "datacenter" >nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ PROBLEMA: PM2 no tiene procesos ejecutándose
    echo    Solución: Ejecutar start-server-direct.bat
)

echo =================================
pause