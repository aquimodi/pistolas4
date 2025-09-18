@echo off
echo =================================
echo CONFIGURACIÓN DE CERTIFICADO SSL
echo =================================
echo.

echo Este script te ayudará a configurar tu certificado .cer existente para NGINX
echo.

echo 1. Creando directorio de certificados...
if not exist "D:\nginx\cert\" (
    mkdir "D:\nginx\cert\"
    echo    ✓ Directorio D:\nginx\cert\ creado
) else (
    echo    ✓ Directorio D:\nginx\cert\ ya existe
)
echo.

echo 2. INSTRUCCIONES MANUALES:
echo =================================
echo A. Localiza tu archivo certificado .cer en el servidor
echo B. Localiza tu archivo de clave privada .key correspondiente
echo C. Copia ambos archivos al directorio: D:\nginx\cert\
echo D. Renombra los archivos de la siguiente manera:
echo    - Tu archivo .cer → server.crt
echo    - Tu archivo .key → server.key
echo.

echo EJEMPLO:
echo    copy "ruta\tu_certificado.cer" "D:\nginx\cert\server.crt"
echo    copy "ruta\tu_clave_privada.key" "D:\nginx\cert\server.key"
echo.

echo 3. Verificando archivos existentes...
if exist "D:\nginx\cert\server.crt" (
    echo    ✓ server.crt encontrado
    dir "D:\nginx\cert\server.crt" | findstr /C:"server.crt"
) else (
    echo    ✗ server.crt NO encontrado
    echo    Por favor, copia tu archivo .cer como server.crt
)

if exist "D:\nginx\cert\server.key" (
    echo    ✓ server.key encontrado
    dir "D:\nginx\cert\server.key" | findstr /C:"server.key"
) else (
    echo    ✗ server.key NO encontrado
    echo    Por favor, copia tu archivo de clave privada como server.key
)
echo.

echo 4. Probando configuración de NGINX...
nginx -t
if %ERRORLEVEL% EQU 0 (
    echo    ✓ Configuración de NGINX válida
    echo.
    echo 5. Recargando NGINX...
    nginx -s reload
    if %ERRORLEVEL% EQU 0 (
        echo    ✓ NGINX recargado correctamente
        echo    ✓ HTTPS ahora debería estar disponible en https://localhost
    ) else (
        echo    ✗ Error al recargar NGINX
    )
) else (
    echo    ✗ Error en la configuración de NGINX
    echo    Revisa que los archivos server.crt y server.key estén en D:\nginx\cert\
)
echo.

echo =================================
echo PRÓXIMOS PASOS:
echo =================================
echo 1. Si los archivos de certificado no están presentes:
echo    - Localiza tu certificado .cer y clave privada .key
echo    - Cópialos a D:\nginx\cert\
echo    - Renómbralos como server.crt y server.key
echo    - Ejecuta este script nuevamente
echo.
echo 2. Una vez configurado correctamente:
echo    - Accede a https://localhost
echo    - La API getUserMedia funcionará en contexto HTTPS
echo.
echo 3. Para verificar el certificado:
echo    - Abre https://localhost en tu navegador
echo    - Haz clic en el candado para ver detalles del certificado
echo =================================
pause