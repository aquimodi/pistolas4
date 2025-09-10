@echo off
echo =================================
echo VERIFICACIÓN RÁPIDA DE LA API
echo =================================
echo.

echo 1. Verificando si el servidor responde...
curl -s http://localhost:3001/health 2>nul
if %ERRORLEVEL% EQU 0 (
    echo    ✓ Servidor responde correctamente
) else (
    echo    ✗ Servidor NO responde
)
echo.

echo 2. Verificando endpoint de auth...
curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"test\",\"password\":\"test\"}" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo    ✓ Endpoint de auth responde
) else (
    echo    ✗ Endpoint de auth NO responde
)
echo.

echo 3. Verificando procesos...
echo Procesos Node.js:
tasklist /FI "IMAGENAME eq node.exe" 2>nul
echo.

echo Puertos en uso:
netstat -an | findstr :3001
echo.

echo =================================
pause