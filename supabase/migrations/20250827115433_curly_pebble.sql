/*
  # Sample Data for Datacenter Equipment Management System
  
  This script populates the database with sample data for testing and demonstration purposes.
  
  ## Data Includes:
  - Administrative and operator users
  - Sample projects for datacenter expansion
  - Equipment orders from major vendors
  - Delivery notes with tracking information
  - Various equipment items with different statuses
*/

USE datacenter_equipment;

-- Insert sample users
-- Password for all users is: "password123" (hashed with bcrypt)
INSERT INTO users (username, email, password_hash, role, is_active) VALUES
('admin', 'admin@datacenter.com', '$2b$10$rOTzB8qY9X.K5vN2sJ8HO.JY5vN2sJ8HO.JY5vN2sJ8HO.JY5vN2s', 'admin', 1),
('manager', 'manager@datacenter.com', '$2b$10$rOTzB8qY9X.K5vN2sJ8HO.JY5vN2sJ8HO.JY5vN2sJ8HO.JY5vN2s', 'manager', 1),
('operator1', 'operator1@datacenter.com', '$2b$10$rOTzB8qY9X.K5vN2sJ8HO.JY5vN2sJ8HO.JY5vN2sJ8HO.JY5vN2s', 'operator', 1),
('operator2', 'operator2@datacenter.com', '$2b$10$rOTzB8qY9X.K5vN2sJ8HO.JY5vN2sJ8HO.JY5vN2sJ8HO.JY5vN2s', 'operator', 1),
('viewer', 'viewer@datacenter.com', '$2b$10$rOTzB8qY9X.K5vN2sJ8HO.JY5vN2sJ8HO.JY5vN2sJ8HO.JY5vN2s', 'viewer', 1);

-- Insert sample projects
INSERT INTO projects (name, description, status, created_by) VALUES
('DC Expansion Phase 1', 'First phase of datacenter expansion including new server racks and networking equipment', 'active', 1),
('Server Refresh 2024', 'Annual server hardware refresh program replacing end-of-life equipment', 'active', 1),
('Network Infrastructure Upgrade', 'Upgrade core networking infrastructure to support 100Gbps connectivity', 'active', 2),
('Storage System Modernization', 'Replace legacy storage systems with modern NVMe-based solutions', 'on_hold', 1),
('Security System Implementation', 'Implementation of new physical security systems', 'completed', 2);

-- Insert sample orders
INSERT INTO orders (project_id, order_number, vendor, description, expected_delivery_date, status, created_by) VALUES
(1, 'ORD-2024-001', 'Dell Technologies', '10x PowerEdge R750 servers for compute cluster', '2024-02-15', 'received', 1),
(1, 'ORD-2024-002', 'HPE', 'Networking switches and cables for rack connectivity', '2024-02-20', 'partial', 2),
(2, 'ORD-2024-003', 'Cisco Systems', 'UCS blade chassis and compute blades', '2024-03-01', 'pending', 1),
(2, 'ORD-2024-004', 'Pure Storage', 'FlashArray storage system', '2024-03-10', 'pending', 2),
(3, 'ORD-2024-005', 'Juniper Networks', 'Core routing equipment and optics', '2024-02-25', 'received', 1),
(4, 'ORD-2024-006', 'NetApp', 'All-flash storage arrays', '2024-04-01', 'pending', 2);

-- Insert sample delivery notes
INSERT INTO delivery_notes (order_id, delivery_note_number, delivery_date, carrier, tracking_number, notes, status, created_by) VALUES
(1, 'DN-2024-001', '2024-02-14', 'FedEx', '1234567890123456', 'All servers arrived in excellent condition. Packaging intact.', 'completed', 3),
(1, 'DN-2024-002', '2024-02-16', 'FedEx', '1234567890123457', 'Additional accessories and rails delivered separately.', 'completed', 3),
(2, 'DN-2024-003', '2024-02-19', 'UPS', '1Z999AA1234567890', 'Partial delivery - missing 2 switch units.', 'processing', 4),
(5, 'DN-2024-004', '2024-02-24', 'DHL', 'JD014600006542123456', 'Router and optics delivered. Requires immediate inspection.', 'received', 3);

-- Insert sample equipment
INSERT INTO equipment (delivery_note_id, serial_number, asset_tag, manufacturer, model, category, specifications, condition_status, location, status, created_by) VALUES
-- Dell servers from first delivery note
(1, 'DL001234567890', 'SRV-001', 'Dell', 'PowerEdge R750', 'Server', '2x Intel Xeon Silver 4314, 128GB RAM, 4x 480GB SSD', 'new', 'Rack A1-U1', 'installed', 3),
(1, 'DL001234567891', 'SRV-002', 'Dell', 'PowerEdge R750', 'Server', '2x Intel Xeon Silver 4314, 128GB RAM, 4x 480GB SSD', 'new', 'Rack A1-U3', 'installed', 3),
(1, 'DL001234567892', 'SRV-003', 'Dell', 'PowerEdge R750', 'Server', '2x Intel Xeon Silver 4314, 128GB RAM, 4x 480GB SSD', 'new', 'Rack A1-U5', 'configured', 3),
(1, 'DL001234567893', 'SRV-004', 'Dell', 'PowerEdge R750', 'Server', '2x Intel Xeon Silver 4314, 128GB RAM, 4x 480GB SSD', 'new', 'Staging Area', 'received', 3),
(1, 'DL001234567894', 'SRV-005', 'Dell', 'PowerEdge R750', 'Server', '2x Intel Xeon Silver 4314, 128GB RAM, 4x 480GB SSD', 'new', 'Staging Area', 'received', 3),

-- Dell accessories from second delivery note
(2, 'DL991234567890', 'RAIL-001', 'Dell', 'ReadyRails Kit', 'Accessory', 'Sliding rails for R750 servers', 'new', 'Storage Room', 'received', 3),
(2, 'DL991234567891', 'RAIL-002', 'Dell', 'ReadyRails Kit', 'Accessory', 'Sliding rails for R750 servers', 'new', 'Storage Room', 'received', 3),

-- HPE networking equipment
(3, 'HP567890123456', 'SW-001', 'HPE', 'Aruba CX 6300M', 'Network Switch', '48x 1GbE ports, 4x 10GbE SFP+ uplinks', 'new', 'Rack B1-U42', 'installed', 4),
(3, 'HP567890123457', 'SW-002', 'HPE', 'Aruba CX 6300M', 'Network Switch', '48x 1GbE ports, 4x 10GbE SFP+ uplinks', 'new', 'Staging Area', 'received', 4),

-- Juniper routing equipment
(4, 'JN789012345678', 'RTR-001', 'Juniper', 'MX204', 'Router', '4x 100GbE QSFP28 ports, advanced routing features', 'new', 'Core Network Room', 'configured', 3),
(4, 'JN789012345679', 'OPT-001', 'Juniper', '100GBASE-LR4', 'Optics', '100G single-mode fiber optic transceivers', 'new', 'Core Network Room', 'installed', 3);

-- Create some audit log entries
INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values, ip_address, user_agent) VALUES
(1, 'INSERT', 'projects', 1, '{"name":"DC Expansion Phase 1","status":"active"}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
(2, 'INSERT', 'orders', 1, '{"order_number":"ORD-2024-001","vendor":"Dell Technologies"}', '192.168.1.101', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
(3, 'INSERT', 'equipment', 1, '{"serial_number":"DL001234567890","status":"installed"}', '192.168.1.102', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
(3, 'UPDATE', 'equipment', 1, '{"status":"installed","location":"Rack A1-U1"}', '192.168.1.102', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

-- Create views for common queries
GO
CREATE VIEW vw_equipment_summary AS
SELECT 
    e.id,
    e.serial_number,
    e.asset_tag,
    e.manufacturer,
    e.model,
    e.location,
    e.status,
    e.created_at,
    dn.delivery_note_number,
    o.order_number,
    o.vendor,
    p.name as project_name
FROM equipment e
    INNER JOIN delivery_notes dn ON e.delivery_note_id = dn.id
    INNER JOIN orders o ON dn.order_id = o.id
    INNER JOIN projects p ON o.project_id = p.id;

GO
CREATE VIEW vw_project_statistics AS
SELECT 
    p.id,
    p.name,
    p.status,
    COUNT(DISTINCT o.id) as order_count,
    COUNT(DISTINCT dn.id) as delivery_note_count,
    COUNT(DISTINCT e.id) as equipment_count,
    SUM(CASE WHEN e.status = 'received' THEN 1 ELSE 0 END) as equipment_received,
    SUM(CASE WHEN e.status = 'installed' THEN 1 ELSE 0 END) as equipment_installed,
    SUM(CASE WHEN e.status = 'configured' THEN 1 ELSE 0 END) as equipment_configured
FROM projects p
    LEFT JOIN orders o ON p.id = o.project_id
    LEFT JOIN delivery_notes dn ON o.id = dn.order_id
    LEFT JOIN equipment e ON dn.id = e.delivery_note_id
GROUP BY p.id, p.name, p.status;

-- Grant permissions (adjust based on your security requirements)
-- Note: In production, create specific roles and users with minimal required permissions