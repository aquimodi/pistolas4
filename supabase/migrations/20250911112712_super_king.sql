/*
  # Sistema de Verificación de Equipos - Migración
  
  1. Añadir columna de verificación
    - `is_verified` (bit) - Indica si el equipo ha sido verificado físicamente
    - Valor por defecto: 0 (no verificado)
  
  2. Índices para optimización
    - Índice en `is_verified` para consultas rápidas de equipos no verificados
    - Índice compuesto en `delivery_note_id` y `is_verified`
*/

USE datacenter_equipment;

-- Añadir columna is_verified a la tabla equipment
ALTER TABLE equipment 
ADD is_verified bit NOT NULL DEFAULT 0;

-- Índices para optimizar consultas de verificación
CREATE INDEX IX_equipment_is_verified ON equipment(is_verified);
CREATE INDEX IX_equipment_delivery_verified ON equipment(delivery_note_id, is_verified);

-- Actualizar algunos equipos existentes como verificados para pruebas
UPDATE equipment 
SET is_verified = 1 
WHERE id IN (1, 2, 3);

PRINT 'Columna is_verified añadida correctamente a la tabla equipment';
PRINT 'Índices de verificación creados';
PRINT 'Algunos equipos marcados como verificados para pruebas';