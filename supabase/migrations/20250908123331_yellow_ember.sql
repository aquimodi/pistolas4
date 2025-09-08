/*
  # Datos de Muestra Corregidos con Relaciones Apropiadas

  1. Usuarios del Sistema
  2. Proyectos (con created_by correcto)
  3. Pedidos (con project_id y created_by correctos)
  4. Albaranes (con order_id y created_by correctos)
  5. Equipos (con delivery_note_id y created_by correctos)

  IMPORTANTE: Las foreign keys deben coincidir exactamente
*/

USE datacenter_equipment;

-- 1. INSERTAR USUARIOS (ID base para todas las relaciones)
INSERT INTO users (username, email, password, role, is_active) VALUES
('admin', 'admin@datacenter.com', 'admin', 'admin', 1),
('manager', 'manager@datacenter.com', 'manager', 'manager', 1),
('operator', 'operator@datacenter.com', 'operator', 'operator', 1),
('viewer', 'viewer@datacenter.com', 'viewer', 'viewer', 1),
('john.smith', 'john.smith@datacenter.com', 'password123', 'operator', 1),
('jane.doe', 'jane.doe@datacenter.com', 'password123', 'manager', 1);

-- 2. INSERTAR PROYECTOS (con created_by = users.id)
INSERT INTO projects (name, description, status, created_by) VALUES
('DC Expansion Phase 1', 'Primary datacenter expansion with new server racks and cooling systems', 'active', 1),
('Server Refresh 2024', 'Annual server hardware refresh and modernization project', 'active', 2),
('Network Upgrade Q1', 'Core network infrastructure upgrade and optimization', 'active', 1),
('Storage Migration', 'Migration from legacy storage to new NVMe-based systems', 'on_hold', 2),
('Security Enhancement', 'Implementation of advanced security monitoring tools', 'completed', 1);

-- 3. INSERTAR PEDIDOS (con project_id = projects.id y created_by = users.id)
INSERT INTO orders (project_id, order_number, vendor, description, expected_delivery_date, status, created_by) VALUES
-- Pedidos para proyecto 1 (DC Expansion Phase 1)
(1, 'ORD-2024-001', 'Dell Technologies', '10x PowerEdge R750 servers with 64GB RAM and dual PSUs', '2024-03-15', 'received', 1),
(1, 'ORD-2024-002', 'HPE', '5x ProLiant DL380 Gen11 servers for virtualization', '2024-03-20', 'pending', 1),
(1, 'ORD-2024-003', 'Cisco Systems', 'Network switches and routers for expanded infrastructure', '2024-03-25', 'partial', 2),

-- Pedidos para proyecto 2 (Server Refresh 2024)
(2, 'ORD-2024-004', 'Dell Technologies', '15x PowerEdge R650 replacement servers', '2024-04-01', 'pending', 2),
(2, 'ORD-2024-005', 'Lenovo', '8x ThinkSystem SR650 V3 servers', '2024-04-10', 'pending', 1),

-- Pedidos para proyecto 3 (Network Upgrade Q1)
(3, 'ORD-2024-006', 'Cisco Systems', 'Catalyst 9000 series switches and ASR routers', '2024-03-30', 'received', 1),

-- Pedidos para proyecto 4 (Storage Migration)
(4, 'ORD-2024-007', 'NetApp', 'AFF A800 all-flash storage arrays', '2024-05-15', 'pending', 2);

-- 4. INSERTAR ALBARANES (con order_id = orders.id y created_by = users.id)
INSERT INTO delivery_notes (order_id, delivery_note_number, delivery_date, carrier, tracking_number, notes, status, created_by) VALUES
-- Albaranes para pedido 1 (ORD-2024-001)
(1, 'DN-2024-001', '2024-03-14', 'FedEx', 'FX123456789', 'First batch of Dell servers - 5 units delivered', 'completed', 3),
(1, 'DN-2024-002', '2024-03-16', 'FedEx', 'FX987654321', 'Remaining 5 Dell servers delivered', 'completed', 3),

-- Albaranes para pedido 3 (ORD-2024-003)
(3, 'DN-2024-003', '2024-03-24', 'UPS', 'UP555666777', 'Cisco switches delivered - routers pending', 'processing', 3),

-- Albaranes para pedido 6 (ORD-2024-006)
(6, 'DN-2024-004', '2024-03-29', 'DHL', 'DH999888777', 'Complete Cisco network equipment order', 'completed', 4),

-- Albarán adicional para pedido 1 (accesorios)
(1, 'DN-2024-005', '2024-03-17', 'FedEx', 'FX111222333', 'Server accessories and cables', 'completed', 3);

-- 5. INSERTAR EQUIPOS (con delivery_note_id = delivery_notes.id y created_by = users.id)
INSERT INTO equipment (delivery_note_id, serial_number, asset_tag, manufacturer, model, category, specifications, condition_status, location, status, created_by) VALUES
-- Equipos del albarán 1 (DN-2024-001) - Primeros 5 servidores Dell
(1, 'DL001234', 'DC-SRV-001', 'Dell', 'PowerEdge R750', 'Server', 'Intel Xeon Gold 6338, 64GB RAM, 2x 960GB SSD', 'new', 'Rack A1-U01', 'configured', 1),
(1, 'DL001235', 'DC-SRV-002', 'Dell', 'PowerEdge R750', 'Server', 'Intel Xeon Gold 6338, 64GB RAM, 2x 960GB SSD', 'new', 'Rack A1-U03', 'configured', 1),
(1, 'DL001236', 'DC-SRV-003', 'Dell', 'PowerEdge R750', 'Server', 'Intel Xeon Gold 6338, 64GB RAM, 2x 960GB SSD', 'new', 'Rack A1-U05', 'installed', 1),
(1, 'DL001237', 'DC-SRV-004', 'Dell', 'PowerEdge R750', 'Server', 'Intel Xeon Gold 6338, 64GB RAM, 2x 960GB SSD', 'new', 'Rack A1-U07', 'installed', 1),
(1, 'DL001238', 'DC-SRV-005', 'Dell', 'PowerEdge R750', 'Server', 'Intel Xeon Gold 6338, 64GB RAM, 2x 960GB SSD', 'new', 'Rack A1-U09', 'received', 1),

-- Equipos del albarán 2 (DN-2024-002) - Últimos 5 servidores Dell
(2, 'DL001239', 'DC-SRV-006', 'Dell', 'PowerEdge R750', 'Server', 'Intel Xeon Gold 6338, 64GB RAM, 2x 960GB SSD', 'new', 'Rack A2-U01', 'configured', 1),
(2, 'DL001240', 'DC-SRV-007', 'Dell', 'PowerEdge R750', 'Server', 'Intel Xeon Gold 6338, 64GB RAM, 2x 960GB SSD', 'new', 'Rack A2-U03', 'configured', 1),
(2, 'DL001241', 'DC-SRV-008', 'Dell', 'PowerEdge R750', 'Server', 'Intel Xeon Gold 6338, 64GB RAM, 2x 960GB SSD', 'new', 'Rack A2-U05', 'installed', 1),
(2, 'DL001242', 'DC-SRV-009', 'Dell', 'PowerEdge R750', 'Server', 'Intel Xeon Gold 6338, 64GB RAM, 2x 960GB SSD', 'new', 'Rack A2-U07', 'installed', 1),
(2, 'DL001243', 'DC-SRV-010', 'Dell', 'PowerEdge R750', 'Server', 'Intel Xeon Gold 6338, 64GB RAM, 2x 960GB SSD', 'new', 'Rack A2-U09', 'received', 1),

-- Equipos del albarán 3 (DN-2024-003) - Equipos de red Cisco
(3, 'CS445566', 'DC-NET-001', 'Cisco', 'Catalyst 9300-48P', 'Network', '48-Port Gigabit Switch with PoE+', 'new', 'Rack C1-U42', 'installed', 2),
(3, 'CS445567', 'DC-NET-002', 'Cisco', 'Catalyst 9300-24P', 'Network', '24-Port Gigabit Switch with PoE+', 'new', 'Rack C1-U40', 'received', 2),

-- Equipos del albarán 4 (DN-2024-004) - Equipo de red completo Cisco
(4, 'CS778899', 'DC-NET-003', 'Cisco', 'ASR 1001-X', 'Network', 'Aggregation Services Router with 6 built-in GE ports', 'new', 'Rack C1-U38', 'configured', 2),
(4, 'CS778900', 'DC-NET-004', 'Cisco', 'Catalyst 9500-48Y4C', 'Network', '48-Port 25G Switch with 4x100G uplinks', 'new', 'Rack C1-U36', 'installed', 2),
(4, 'CS778901', 'DC-FW-001', 'Cisco', 'ASA 5516-X', 'Security', 'Next-Generation Firewall with 8GB RAM', 'new', 'Rack D1-U01', 'configured', 2),

-- Equipos del albarán 5 (DN-2024-005) - Accesorios de servidor
(5, 'DL-ACC-001', 'DC-ACC-001', 'Dell', 'PowerEdge Rail Kit', 'Accessory', 'Sliding rail kit for PowerEdge R750', 'new', 'Storage Room A', 'received', 3),
(5, 'DL-ACC-002', 'DC-ACC-002', 'Dell', 'Power Cable IEC C14', 'Accessory', '10A 250V power cable 2.5m', 'new', 'Storage Room A', 'received', 3),
(5, 'DL-ACC-003', 'DC-ACC-003', 'Dell', 'CAT6A Cable 3m', 'Accessory', 'Ethernet cable CAT6A 3 meter blue', 'new', 'Storage Room A', 'received', 3);

PRINT 'Datos de muestra insertados correctamente con relaciones apropiadas';
PRINT 'Relaciones verificadas:';
PRINT '- 6 usuarios creados';
PRINT '- 5 proyectos con created_by válidos';
PRINT '- 7 pedidos con project_id y created_by válidos';
PRINT '- 5 albaranes con order_id y created_by válidos';
PRINT '- 18 equipos con delivery_note_id y created_by válidos';