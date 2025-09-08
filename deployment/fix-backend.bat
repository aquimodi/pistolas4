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
echo    ✓ Directorio verificado
echo.

echo 3. Estableciendo variables de entorno...
set NODE_ENV=production
set PORT=3001
set HOST=0.0.0.0
set DB_SERVER=localhost
set DB_DATABASE=datacenter_equipment
echo    ✓ Variables configuradas
echo.

echo 4. Intentando iniciar con PM2...
cd /d "D:\nginx\pistolas"
pm2 start ecosystem.config.cjs --env production 2>nul
if %ERRORLEVEL% EQU 0 (
    echo    ✓ PM2 iniciado correctamente
    goto :check_status
) else (
    echo    ! PM2 falló, intentando inicio directo...
)

echo 5. Iniciando directamente con Node.js...
cd /d "%~dp0.."
echo Iniciando servidor en modo directo...
start /b node server/index.js
echo    ✓ Node.js iniciado directamente
echo.

:check_status
echo 6. Esperando que el servidor inicie...
timeout /t 5 /nobreak > nul

echo 7. Verificando estado del servidor...
curl -s http://localhost:3001/health 2>nul
if %ERRORLEVEL% EQU 0 (
    echo    ✓ ¡Servidor respondiendo correctamente!
) else (
    echo    ✗ Servidor NO responde - revisar logs
    echo    Ejecutar: pm2 logs
)
echo.

echo 8. Verificando proceso en puerto 3001...
netstat -an | findstr :3001
echo.

echo =================================
echo REPARACIÓN COMPLETADA
echo =================================
echo Verificar con: curl http://localhost:3001/health
echo Ver logs con: pm2 logs
echo Reiniciar con: pm2 restart all
echo =================================
pause