/*
  # Datos de Muestra Actualizados con Nuevos Campos
*/

USE datacenter_equipment;

-- 1. INSERTAR USUARIOS
INSERT INTO users (username, email, password, role, is_active) VALUES
('admin', 'admin@datacenter.com', 'admin', 'admin', 1),
('manager', 'manager@datacenter.com', 'manager', 'manager', 1),
('operator', 'operator@datacenter.com', 'operator', 'operator', 1),
('viewer', 'viewer@datacenter.com', 'viewer', 'viewer', 1),
('john.smith', 'john.smith@datacenter.com', 'password123', 'operator', 1),
('jane.doe', 'jane.doe@datacenter.com', 'password123', 'manager', 1);

-- 2. INSERTAR PROYECTOS (con nuevos campos)
INSERT INTO projects (ritm_code, project_name, client, datacenter, delivery_date, teams_folder_url, excel_file_path, status, created_by) VALUES
('RITM0012345', 'Expansión Datacenter Fase 1', 'Telefónica España', 'Madrid DC-1', '2024-06-30', 'https://teams.microsoft.com/l/channel/19%3A...', '/uploads/projects/RITM0012345_equipment_list.xlsx', 'active', 1),
('RITM0012346', 'Renovación Servidores 2024', 'BBVA', 'Barcelona DC-2', '2024-05-15', 'https://teams.microsoft.com/l/channel/19%3A...', '/uploads/projects/RITM0012346_server_specs.xlsx', 'active', 2),
('RITM0012347', 'Upgrade Red Troncal Q1', 'Santander', 'Sevilla DC-3', '2024-04-20', 'https://teams.microsoft.com/l/channel/19%3A...', '/uploads/projects/RITM0012347_network_plan.xlsx', 'active', 1),
('RITM0012348', 'Migración Storage NVMe', 'Iberdrola', 'Valencia DC-4', '2024-07-10', 'https://teams.microsoft.com/l/channel/19%3A...', '/uploads/projects/RITM0012348_storage_migration.xlsx', 'on_hold', 2),
('RITM0012349', 'Mejora Seguridad SOC', 'Repsol', 'Bilbao DC-5', '2024-03-31', 'https://teams.microsoft.com/l/channel/19%3A...', '/uploads/projects/RITM0012349_security_tools.xlsx', 'completed', 1);

-- 3. INSERTAR PEDIDOS (con nuevos campos)
INSERT INTO orders (project_id, order_code, equipment_count, vendor, description, expected_delivery_date, status, created_by) VALUES
-- Pedidos para proyecto 1 (Expansión Datacenter Fase 1)
(1, 'PED-2024-001', 10, 'Dell Technologies', '10x PowerEdge R750 servers con 64GB RAM', '2024-03-15', 'received', 1),
(1, 'PED-2024-002', 5, 'HPE', '5x ProLiant DL380 Gen11 para virtualización', '2024-03-20', 'pending', 1),
(1, 'PED-2024-003', 8, 'Cisco Systems', 'Switches y routers para infraestructura ampliada', '2024-03-25', 'partial', 2),

-- Pedidos para proyecto 2 (Renovación Servidores 2024)
(2, 'PED-2024-004', 15, 'Dell Technologies', '15x PowerEdge R650 servidores de reemplazo', '2024-04-01', 'pending', 2),
(2, 'PED-2024-005', 8, 'Lenovo', '8x ThinkSystem SR650 V3 para cargas críticas', '2024-04-10', 'pending', 1),

-- Pedidos para proyecto 3 (Upgrade Red Troncal Q1)
(3, 'PED-2024-006', 12, 'Cisco Systems', 'Catalyst 9000 series switches y ASR routers', '2024-03-30', 'received', 1),

-- Pedidos para proyecto 4 (Migración Storage NVMe)
(4, 'PED-2024-007', 6, 'NetApp', 'AFF A800 arrays de almacenamiento flash', '2024-05-15', 'pending', 2);

-- 4. INSERTAR ALBARANES (con nuevos campos)
INSERT INTO delivery_notes (order_id, delivery_code, estimated_equipment_count, delivery_date, carrier, tracking_number, attached_document_path, notes, status, created_by) VALUES
-- Albaranes para pedido 1 (PED-2024-001)
(1, 'ALB-2024-001', 5, '2024-03-14', 'FedEx', 'FX123456789', '/uploads/delivery_notes/ALB-2024-001.pdf', 'Primera entrega de servidores Dell - 5 unidades', 'completed', 3),
(1, 'ALB-2024-002', 5, '2024-03-16', 'FedEx', 'FX987654321', '/uploads/delivery_notes/ALB-2024-002.pdf', 'Segunda entrega completando el pedido - 5 unidades', 'completed', 3),

-- Albaranes para pedido 3 (PED-2024-003)
(3, 'ALB-2024-003', 4, '2024-03-24', 'UPS', 'UP555666777', '/uploads/delivery_notes/ALB-2024-003.pdf', 'Switches Cisco entregados - routers pendientes', 'processing', 3),

-- Albaranes para pedido 6 (PED-2024-006)
(6, 'ALB-2024-004', 12, '2024-03-29', 'DHL', 'DH999888777', '/uploads/delivery_notes/ALB-2024-004.pdf', 'Equipos de red Cisco completos según especificación', 'completed', 4),

-- Albarán adicional para pedido 1 (accesorios)
(1, 'ALB-2024-005', 3, '2024-03-17', 'FedEx', 'FX111222333', '/uploads/delivery_notes/ALB-2024-005.pdf', 'Accesorios y cables para servidores Dell', 'completed', 3);

-- 5. INSERTAR EQUIPOS (datos existentes actualizados)
INSERT INTO equipment (delivery_note_id, serial_number, asset_tag, manufacturer, model, category, specifications, condition_status, location, status, created_by) VALUES
-- Equipos del albarán 1 (ALB-2024-001) - Primeros 5 servidores Dell
(1, 'DL001234', 'TEF-SRV-001', 'Dell', 'PowerEdge R750', 'Server', 'Intel Xeon Gold 6338, 64GB RAM, 2x 960GB SSD', 'new', 'Madrid DC-1 Rack A1-U01', 'configured', 1),
(1, 'DL001235', 'TEF-SRV-002', 'Dell', 'PowerEdge R750', 'Server', 'Intel Xeon Gold 6338, 64GB RAM, 2x 960GB SSD', 'new', 'Madrid DC-1 Rack A1-U03', 'configured', 1),
(1, 'DL001236', 'TEF-SRV-003', 'Dell', 'PowerEdge R750', 'Server', 'Intel Xeon Gold 6338, 64GB RAM, 2x 960GB SSD', 'new', 'Madrid DC-1 Rack A1-U05', 'installed', 1),
(1, 'DL001237', 'TEF-SRV-004', 'Dell', 'PowerEdge R750', 'Server', 'Intel Xeon Gold 6338, 64GB RAM, 2x 960GB SSD', 'new', 'Madrid DC-1 Rack A1-U07', 'installed', 1),
(1, 'DL001238', 'TEF-SRV-005', 'Dell', 'PowerEdge R750', 'Server', 'Intel Xeon Gold 6338, 64GB RAM, 2x 960GB SSD', 'new', 'Madrid DC-1 Rack A1-U09', 'received', 1),

-- Equipos del albarán 2 (ALB-2024-002) - Últimos 5 servidores Dell
(2, 'DL001239', 'TEF-SRV-006', 'Dell', 'PowerEdge R750', 'Server', 'Intel Xeon Gold 6338, 64GB RAM, 2x 960GB SSD', 'new', 'Madrid DC-1 Rack A2-U01', 'configured', 1),
(2, 'DL001240', 'TEF-SRV-007', 'Dell', 'PowerEdge R750', 'Server', 'Intel Xeon Gold 6338, 64GB RAM, 2x 960GB SSD', 'new', 'Madrid DC-1 Rack A2-U03', 'configured', 1),
(2, 'DL001241', 'TEF-SRV-008', 'Dell', 'PowerEdge R750', 'Server', 'Intel Xeon Gold 6338, 64GB RAM, 2x 960GB SSD', 'new', 'Madrid DC-1 Rack A2-U05', 'installed', 1),
(2, 'DL001242', 'TEF-SRV-009', 'Dell', 'PowerEdge R750', 'Server', 'Intel Xeon Gold 6338, 64GB RAM, 2x 960GB SSD', 'new', 'Madrid DC-1 Rack A2-U07', 'installed', 1),
(2, 'DL001243', 'TEF-SRV-010', 'Dell', 'PowerEdge R750', 'Server', 'Intel Xeon Gold 6338, 64GB RAM, 2x 960GB SSD', 'new', 'Madrid DC-1 Rack A2-U09', 'received', 1),

-- Equipos del albarán 3 (ALB-2024-003) - Equipos de red Cisco
(3, 'CS445566', 'TEF-NET-001', 'Cisco', 'Catalyst 9300-48P', 'Network', '48-Port Gigabit Switch with PoE+', 'new', 'Madrid DC-1 Rack C1-U42', 'installed', 2),
(3, 'CS445567', 'TEF-NET-002', 'Cisco', 'Catalyst 9300-24P', 'Network', '24-Port Gigabit Switch with PoE+', 'new', 'Madrid DC-1 Rack C1-U40', 'received', 2),

-- Equipos del albarán 4 (ALB-2024-004) - Más equipos de red Cisco
(4, 'CS778899', 'SAN-NET-001', 'Cisco', 'ASR 1001-X', 'Network', 'Aggregation Services Router con 6 puertos GE', 'new', 'Sevilla DC-3 Rack C1-U38', 'configured', 2),
(4, 'CS778900', 'SAN-NET-002', 'Cisco', 'Catalyst 9500-48Y4C', 'Network', '48-Port 25G Switch con 4x100G uplinks', 'new', 'Sevilla DC-3 Rack C1-U36', 'installed', 2),
(4, 'CS778901', 'SAN-FW-001', 'Cisco', 'ASA 5516-X', 'Security', 'Next-Generation Firewall con 8GB RAM', 'new', 'Sevilla DC-3 Rack D1-U01', 'configured', 2),

-- Equipos del albarán 5 (ALB-2024-005) - Accesorios de servidor
(5, 'DL-ACC-001', 'TEF-ACC-001', 'Dell', 'PowerEdge Rail Kit', 'Accessory', 'Kit de rieles deslizantes para PowerEdge R750', 'new', 'Madrid DC-1 Storage Room A', 'received', 3),
(5, 'DL-ACC-002', 'TEF-ACC-002', 'Dell', 'Power Cable IEC C14', 'Accessory', 'Cable de alimentación 10A 250V 2.5m', 'new', 'Madrid DC-1 Storage Room A', 'received', 3),
(5, 'DL-ACC-003', 'TEF-ACC-003', 'Dell', 'CAT6A Cable 3m', 'Accessory', 'Cable Ethernet CAT6A 3 metros azul', 'new', 'Madrid DC-1 Storage Room A', 'received', 3);

PRINT 'Datos de muestra actualizados insertados correctamente';
PRINT 'Datos incluyen:';
PRINT '- 6 usuarios con roles variados';
PRINT '- 5 proyectos con códigos RITM, clientes, datacenters, fechas y URLs';
PRINT '- 7 pedidos con códigos y contadores de equipos';
PRINT '- 5 albaranes con códigos, contadores estimados y documentos adjuntos';
PRINT '- 18 equipos con ubicaciones específicas de datacenter';