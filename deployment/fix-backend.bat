@echo off
echo =================================
echo REPARACIÓN AUTOMÁTICA DEL BACKEND
echo =================================
echo.

echo 1. Deteniendo procesos existentes...
pm2 delete all 2>nul
taskkill /F /IM node.exe 2>nul
echo    ✓ Procesos limpiados
echo.

echo 2. Verificando directorio de trabajo...
if not exist "D:\nginx\pistolas" (
    echo    ✗ Directorio D:\nginx\pistolas NO existe
    echo    Creando directorio...
    mkdir "D:\nginx\pistolas" 2>nul
)

echo 3. Estableciendo variables de entorno...
set NODE_ENV=production
set PORT=3001
set HOST=0.0.0.0
set DB_SERVER=localhost
set DB_DATABASE=datacenter_equipment
echo    ✓ Variables configuradas
echo.

echo 4. Verificando archivo del servidor...
if exist "D:\nginx\pistolas\server\index.js" (
    echo    ✓ Usando archivo en D:\nginx\pistolas
    cd /d "D:\nginx\pistolas"
) else (
    echo    ! Archivo no encontrado en pistolas, usando directorio actual
    echo    Directorio actual: %CD%
)
echo.

echo 5. Intentando iniciar con PM2...
pm2 start ecosystem.config.cjs --env production 2>nul
if %ERRORLEVEL% EQU 0 (
    echo    ✓ PM2 iniciado correctamente
    timeout /t 3 /nobreak > nul
    goto :check_status
) else (
    echo    ! PM2 falló, intentando inicio directo...
)

echo 6. Iniciando directamente con Node.js...
echo Iniciando servidor en modo directo...
start /b node server/index.js
timeout /t 3 /nobreak > nul
echo    ✓ Node.js iniciado directamente
echo.

:check_status
echo 7. Verificando estado del servidor...
timeout /t 2 /nobreak > nul
curl -s http://localhost:3001/health 2>nul
if %ERRORLEVEL% EQU 0 (
    echo    ✓ ¡Servidor respondiendo correctamente!
    echo    ✓ Problema solucionado - Backend funcionando
) else (
    echo    ✗ Servidor NO responde
    echo    Verificando proceso...
    netstat -an | findstr :3001
    if %ERRORLEVEL% EQU 0 (
        echo    ✓ Puerto 3001 está en uso, pero no responde
        echo    Puede necesitar unos segundos más para iniciar
    ) else (
        echo    ✗ Puerto 3001 NO está en uso - PROCESO FALLÓ
        echo    Revisar logs con: pm2 logs
    )
)
echo.

echo =================================
echo VERIFICACIÓN FINAL
echo =================================
echo Probando conexión:
curl -v http://localhost:3001/health
echo.
echo Si aún falla, ejecutar: deployment\start-backend-only.bat
echo =================================
pause