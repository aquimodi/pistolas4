/*
  # Tabla de Sesiones para Persistencia
  
  Esta tabla permite que las sesiones de usuario persistan 
  incluso si el servidor se reinicia, mejorando la experiencia del usuario.
  
  1. Nueva Tabla
    - `sessions` - Almacena los datos de sesión de express-session
    - Compatible con connect-mssql-session
  
  2. Características
    - Las sesiones persisten entre reinicios del servidor
    - Limpieza automática de sesiones expiradas
    - Mejor rendimiento que el almacenamiento en memoria
*/

USE datacenter_equipment;

-- Crear tabla de sesiones para express-session con connect-mssql-session
IF OBJECT_ID('sessions', 'U') IS NOT NULL DROP TABLE sessions;

CREATE TABLE sessions (
    sid varchar(255) NOT NULL PRIMARY KEY,
    session text NOT NULL,
    expires datetime2
);

-- Índice para mejorar el rendimiento de consultas por expiración
CREATE INDEX IX_sessions_expires ON sessions(expires);

PRINT 'Tabla de sesiones creada correctamente';
PRINT 'Las sesiones ahora persistirán entre reinicios del servidor';
PRINT 'Configuración:';
PRINT '- Almacenamiento: SQL Server';
PRINT '- Limpieza automática: Sesiones expiradas se eliminarán';
PRINT '- Persistencia: Sí, incluso con reinicio del servidor';