# Instrucciones de Actualización - Sistema de Gestión de Equipos

## Problema Resuelto
Se ha solucionado el error de timeout 504 al consultar ServiceNow y se ha agregado soporte para visualización permanente de archivos subidos.

## Cambios Realizados

### 1. Backend (Node.js)
- ✅ Mejorada la gestión de tipos de datos SQL para prevenir errores de validación
- ✅ Agregado servicio de archivos estáticos en `/uploads`
- ✅ Normalización de valores nulos en campos opcionales

### 2. Frontend (React)
- ✅ Nuevo componente `FileViewer` para visualizar y descargar archivos
- ✅ Timeout extendido para llamadas a ServiceNow (120 segundos)
- ✅ Visualización de archivos en tarjetas de proyectos y albaranes
- ✅ Opciones de ver, descargar y cambiar archivos en modales

### 3. Nginx
- ✅ Timeout extendido para endpoint de ServiceNow (120 segundos)
- ✅ Configuración para servir archivos estáticos desde `/uploads`

## Pasos para Aplicar la Actualización

### 1. Detener los Servicios Actuales

```powershell
# Detener PM2
cd D:\nginx\pistolas
npm run server:stop

# Detener Nginx (desde el directorio de nginx)
cd D:\nginx
.\nginx.exe -s stop
```

### 2. Hacer Backup de Configuración Actual

```powershell
# Backup de nginx.conf
copy D:\nginx\conf\nginx.conf D:\nginx\conf\nginx.conf.backup

# Backup de archivos actuales (opcional)
xcopy D:\nginx\pistolas\* D:\nginx\pistolas_backup\ /E /I
```

### 3. Copiar Archivos Actualizados

```powershell
# Copiar desde el proyecto actualizado
# Asumiendo que los archivos están en C:\temp\project (ajusta la ruta según corresponda)

# Copiar nueva configuración de Nginx
copy "C:\temp\project\deployment\nginx.conf" "D:\nginx\conf\nginx.conf"

# Copiar archivos del backend actualizados
copy "C:\temp\project\server\*" "D:\nginx\pistolas\server\" /Y /S

# Copiar frontend construido
copy "C:\temp\project\dist\*" "D:\nginx\pistolas\dist\" /Y /S

# Copiar package.json actualizado
copy "C:\temp\project\package.json" "D:\nginx\pistolas\package.json"
```

### 4. Instalar Dependencias (si hay nuevas)

```powershell
cd D:\nginx\pistolas
npm install
```

### 5. Crear Directorio de Uploads (si no existe)

```powershell
cd D:\nginx\pistolas
mkdir uploads\projects -Force
mkdir uploads\delivery_notes -Force
mkdir uploads\equipment -Force
```

### 6. Recargar Nginx con Nueva Configuración

```powershell
cd D:\nginx

# Verificar configuración
.\nginx.exe -t

# Si la configuración es correcta, recargar
.\nginx.exe -s reload

# Si Nginx estaba detenido, iniciar
.\nginx.exe
```

### 7. Iniciar Backend con PM2

```powershell
cd D:\nginx\pistolas

# Iniciar servicios
npm run server:start

# Verificar estado
npm run server:status

# Ver logs
npm run server:logs
```

### 8. Verificar que Todo Funciona

1. Abrir navegador en `http://107.3.52.136`
2. Iniciar sesión
3. Probar crear un proyecto con código RITM (debería tardar menos de 2 minutos)
4. Subir un archivo Excel al proyecto
5. Verificar que el archivo se muestra en la tarjeta del proyecto
6. Probar descargar y visualizar el archivo

## Troubleshooting

### Si el timeout persiste:
```powershell
# Verificar que Nginx recargó la configuración
cd D:\nginx
.\nginx.exe -t
.\nginx.exe -s reload
```

### Si los archivos no se visualizan:
```powershell
# Verificar que existe el directorio uploads
ls D:\nginx\pistolas\uploads

# Verificar permisos del directorio
# Asegurar que el usuario que ejecuta Nginx tiene permisos de lectura
```

### Si el backend no inicia:
```powershell
# Ver logs de PM2
cd D:\nginx\pistolas
npm run server:logs

# Reiniciar servicios
npm run server:stop
npm run server:start
```

### Ver logs en tiempo real:
```powershell
# Backend
cd D:\nginx\pistolas
pm2 logs datacenter-equipment-api --lines 100

# Nginx error log
cd D:\nginx
type logs\error.log

# Nginx access log
type logs\access.log
```

## Rollback (si algo sale mal)

```powershell
# Restaurar configuración anterior de Nginx
copy D:\nginx\conf\nginx.conf.backup D:\nginx\conf\nginx.conf
cd D:\nginx
.\nginx.exe -s reload

# Restaurar archivos anteriores
xcopy D:\nginx\pistolas_backup\* D:\nginx\pistolas\ /E /I /Y

# Reiniciar servicios
cd D:\nginx\pistolas
npm run server:stop
npm run server:start
```

## Notas Importantes

1. **Timeout de ServiceNow**: El timeout ahora es de 120 segundos (2 minutos). Si las consultas tardan más, ajustar en:
   - `deployment/nginx.conf` (línea 93-94)
   - `src/services/api.ts` (línea 113)

2. **Archivos Subidos**: Los archivos se almacenan en `D:\nginx\pistolas\uploads\` y se sirven directamente por Nginx para mejor rendimiento.

3. **Caché de Archivos**: Los archivos subidos tienen caché de 1 año. Si se necesita forzar actualización, cambiar el nombre del archivo.

4. **Seguridad**: Los archivos en `/uploads` son públicos. No subir información sensible que no deba ser accesible.

## Verificación Post-Actualización

✅ Nginx funcionando: `http://107.3.52.136/health`
✅ Backend funcionando: Revisar `pm2 list`
✅ Login funciona correctamente
✅ Creación de proyectos con RITM sin timeout
✅ Subida de archivos funciona
✅ Visualización de archivos en tarjetas
✅ Descarga de archivos funciona

## Soporte

Si encuentras problemas durante la actualización:
1. Revisar logs de PM2: `pm2 logs`
2. Revisar logs de Nginx: `D:\nginx\logs\error.log`
3. Verificar que todos los servicios están corriendo
4. En caso necesario, realizar rollback y reportar el error
