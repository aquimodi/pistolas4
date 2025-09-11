```sql
USE datacenter_equipment;

-- Añadir columna verification_photo_path a la tabla equipment
ALTER TABLE equipment
ADD verification_photo_path VARCHAR(500);

PRINT 'Columna verification_photo_path añadida correctamente a la tabla equipment';
```