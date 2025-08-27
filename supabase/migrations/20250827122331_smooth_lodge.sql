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
-- Password for all users is: "admin" for admin user and "operator" for operator user (hashed with bcrypt)
INSERT INTO users (username, email, password_hash, role, is_active) VALUES
('admin', 'admin@datacenter.com', '$2b$10$rOTzB8qY9X.K5vN2sJ8HO.JY5vN2sJ8HO.JY5vN2sJ8HO.JY5vN2s', 'admin', 1),
('manager', 'manager@datacenter.com', '$2b$10$rOTzB8qY9X.K5vN2sJ8HO.JY5vN2sJ8HO.JY5vN2sJ8HO.JY5vN2s', 'manager', 1),
('operator', 'operator@datacenter.com', '$2b$10$rOTzB8qY9X.K5vN2sJ8HO.JY5vN2sJ8HO.JY5vN2sJ8HO.JY5vN2s', 'operator', 1),
('viewer', 'viewer@datacenter.com', '$2b$10$rOTzB8qY9X.K5vN2sJ8HO.JY5vN2sJ8HO.JY5vN2sJ8HO.JY5vN2s', 'viewer', 1);

-- Insert sample projects
INSERT INTO projects (name, description, status, created_by) VALUES
('DC Expansion Phase 1', 'First phase of datacenter expansion including new server racks and networking equipment', 'active', 1),
('Server Refresh 2024', 'Annual server hardware refresh program replacing end-of-life equipment', 'active', 1),
('Network Infrastructure Upgrade', 'Upgrade core networking infrastructure to support 100Gbps connectivity', 'active', 2),
('Storage System Modernization', 'Replace legacy storage systems with modern NVMe-based solutions', 'on_hold', 1);

-- Insert sample orders
INSERT INTO orders (project_id, order_number, vendor, description, expected_delivery_date, status, created_by) VALUES
(1, 'ORD-2024-001', 'Dell Technologies', '10x PowerEdge R750 servers for compute cluster', '2024-02-15', 'received', 1),
(1, 'ORD-2024-002', 'HPE', 'Networking switches and cables for rack connectivity', '2024-02-20', 'partial', 2),
(2, 'ORD-2024-003', 'Cisco Systems', 'UCS blade chassis and compute blades', '2024-03-01', 'pending', 1),
(3, 'ORD-2024-004', 'Juniper Networks', 'Core routing equipment and optics', '2024-02-25', 'received', 1);

-- Insert sample delivery notes
INSERT INTO delivery_notes (order_id, delivery_note_number, delivery_date, carrier, tracking_number, notes, status, created_by) VALUES
(1, 'DN-2024-001', '2024-02-14', 'FedEx', '1234567890123456', 'All servers arrived in excellent condition. Packaging intact.', 'completed', 3),
(1, 'DN-2024-002', '2024-02-16', 'FedEx', '1234567890123457', 'Additional accessories and rails delivered separately.', 'completed', 3),
(2, 'DN-2024-003', '2024-02-19', 'UPS', '1Z999AA1234567890', 'Partial delivery - missing 2 switch units.', 'processing', 3),
(4, 'DN-2024-004', '2024-02-24', 'DHL', 'JD014600006542123456', 'Router and optics delivered. Requires immediate inspection.', 'received', 3);

-- Insert sample equipment
INSERT INTO equipment (delivery_note_id, serial_number, asset_tag, manufacturer, model, category, specifications, condition_status, location, status, created_by) VALUES
-- Dell servers from first delivery note
(1, 'DL001234567890', 'SRV-001', 'Dell', 'PowerEdge R750', 'Server', '2x Intel Xeon Silver 4314, 128GB RAM, 4x 480GB SSD', 'new', 'Rack A1-U1', 'installed', 3),
(1, 'DL001234567891', 'SRV-002', 'Dell', 'PowerEdge R750', 'Server', '2x Intel Xeon Silver 4314, 128GB RAM, 4x 480GB SSD', 'new', 'Rack A1-U3', 'installed', 3),
(1, 'DL001234567892', 'SRV-003', 'Dell', 'PowerEdge R750', 'Server', '2x Intel Xeon Silver 4314, 128GB RAM, 4x 480GB SSD', 'new', 'Rack A1-U5', 'configured', 3),
(1, 'DL001234567893', 'SRV-004', 'Dell', 'PowerEdge R750', 'Server', '2x Intel Xeon Silver 4314, 128GB RAM, 4x 480GB SSD', 'new', 'Staging Area', 'received', 3),

-- Dell accessories from second delivery note
(2, 'DL991234567890', 'RAIL-001', 'Dell', 'ReadyRails Kit', 'Accessory', 'Sliding rails for R750 servers', 'new', 'Storage Room', 'received', 3),
(2, 'DL991234567891', 'RAIL-002', 'Dell', 'ReadyRails Kit', 'Accessory', 'Sliding rails for R750 servers', 'new', 'Storage Room', 'received', 3),

-- HPE networking equipment
(3, 'HP567890123456', 'SW-001', 'HPE', 'Aruba CX 6300M', 'Network Switch', '48x 1GbE ports, 4x 10GbE SFP+ uplinks', 'new', 'Rack B1-U42', 'installed', 3),
(3, 'HP567890123457', 'SW-002', 'HPE', 'Aruba CX 6300M', 'Network Switch', '48x 1GbE ports, 4x 10GbE SFP+ uplinks', 'new', 'Staging Area', 'received', 3),

-- Juniper routing equipment
(4, 'JN789012345678', 'RTR-001', 'Juniper', 'MX204', 'Router', '4x 100GbE QSFP28 ports, advanced routing features', 'new', 'Core Network Room', 'configured', 3),
(4, 'JN789012345679', 'OPT-001', 'Juniper', '100GBASE-LR4', 'Optics', '100G single-mode fiber optic transceivers', 'new', 'Core Network Room', 'installed', 3);