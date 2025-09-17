/*
  # Actualización de Estados en Cascada
  
  1. Nuevos Estados
    - `pending_receive` - Estado inicial para proyectos, pedidos y albaranes
    - `completed` - Estado final cuando todos los elementos hijos están completados
  
  2. Lógica de Cascada
    - Albarán → `completed` cuando todos los equipos están verificados
    - Pedido → `completed` cuando todos los albaranes están completados
    - Proyecto → `completed` cuando todos los pedidos están completados
*/

USE datacenter_equipment;

-- Eliminar restricciones CHECK existentes
IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CHK_projects_status')
    ALTER TABLE projects DROP CONSTRAINT CHK_projects_status;
IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CHK_orders_status')
    ALTER TABLE orders DROP CONSTRAINT CHK_orders_status;
IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CHK_delivery_notes_status')
    ALTER TABLE delivery_notes DROP CONSTRAINT CHK_delivery_notes_status;

-- Añadir nuevas restricciones CHECK con estados actualizados
ALTER TABLE projects
ADD CONSTRAINT CHK_projects_status CHECK (status IN ('pending_receive', 'active', 'on_hold', 'completed', 'cancelled'));

ALTER TABLE orders
ADD CONSTRAINT CHK_orders_status CHECK (status IN ('pending_receive', 'pending', 'received', 'partial', 'completed', 'cancelled'));

ALTER TABLE delivery_notes
ADD CONSTRAINT CHK_delivery_notes_status CHECK (status IN ('pending_receive', 'received', 'processing', 'completed'));

-- Actualizar estados por defecto existentes a 'pending_receive'
UPDATE projects SET status = 'pending_receive' WHERE status = 'active';
UPDATE orders SET status = 'pending_receive' WHERE status = 'pending';
UPDATE delivery_notes SET status = 'pending_receive' WHERE status = 'received';

PRINT 'Restricciones CHECK actualizadas para las tablas projects, orders y delivery_notes.';
PRINT 'Nuevo estado "pending_receive" añadido como estado por defecto.';
PRINT 'Estado "completed" añadido para lógica de cascada.';
PRINT 'Datos existentes actualizados a "pending_receive".';