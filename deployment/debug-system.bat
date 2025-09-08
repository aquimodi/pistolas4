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
    echo    ✗ No hay procesos Node.js ejecutándose - ESTE ES EL PROBLEMA
)
echo.

echo 2. Verificando puerto 3001...
netstat -an | findstr :3001
if %ERRORLEVEL% EQU 0 (
    echo    ✓ Puerto 3001 en uso
) else (
    echo    ✗ Puerto 3001 NO está en uso - CONFIRMA EL PROBLEMA
)
echo.

echo 3. Verificando PM2...
pm2 --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo    ✓ PM2 está instalado
    pm2 list
) else (
    echo    ✗ PM2 no está instalado - INSTALAR CON: npm install -g pm2
)
echo.

echo 4. Verificando Node.js...
node --version
if %ERRORLEVEL% EQU 0 (
    echo    ✓ Node.js está disponible
) else (
    echo    ✗ Node.js no está disponible
)
echo.

echo 5. Verificando directorio de trabajo...
if exist "D:\nginx\pistolas\server\index.js" (
    echo    ✓ Archivo del servidor existe
) else (
    echo    ✗ Archivo del servidor NO existe en D:\nginx\pistolas\server\index.js
    echo    Verificando directorio actual...
    if exist "%CD%\server\index.js" (
        echo    ✓ Archivo encontrado en directorio actual
    ) else (
        echo    ✗ Archivo del servidor NO ENCONTRADO
    )
)
echo.

echo 6. Verificando variables de entorno...
echo NODE_ENV: %NODE_ENV%
echo PORT: %PORT%
echo DB_SERVER: %DB_SERVER%
echo.

echo 7. Verificando NGINX...
tasklist /FI "IMAGENAME eq nginx.exe" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo    ✓ NGINX está ejecutándose
) else (
    echo    ✗ NGINX NO está ejecutándose
)
echo.

echo =================================
echo RESUMEN DEL DIAGNÓSTICO:
echo =================================
echo El backend Node.js NO se está ejecutando en el puerto 3001
echo Esto causa los errores 502 Bad Gateway
echo =================================
pause