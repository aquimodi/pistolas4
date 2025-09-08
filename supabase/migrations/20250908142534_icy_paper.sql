/*
  # Esquema Actualizado - Sistema de Gestión de Equipos Datacenter
  
  Campos actualizados según especificaciones:
  
  PROYECTO:
  - Código RITM (ServiceNow)
  - Nombre del Proyecto
  - Cliente
  - Datacenter
  - Fecha de Entrega
  - URL de Carpeta Teams
  - Archivo Excel con información del proyecto y equipos estimados
  
  PEDIDO:
  - Código Pedido
  - Número de equipos
  
  ALBARÁN:
  - Código Albarán
  - Número de equipos estimados
  - Adjuntar documento del albarán (opcional)
*/

USE datacenter_equipment;

-- Eliminar tablas existentes en orden correcto (foreign keys primero)
IF OBJECT_ID('equipment', 'U') IS NOT NULL DROP TABLE equipment;
IF OBJECT_ID('delivery_notes', 'U') IS NOT NULL DROP TABLE delivery_notes;
IF OBJECT_ID('orders', 'U') IS NOT NULL DROP TABLE orders;
IF OBJECT_ID('projects', 'U') IS NOT NULL DROP TABLE projects;
IF OBJECT_ID('audit_logs', 'U') IS NOT NULL DROP TABLE audit_logs;
IF OBJECT_ID('users', 'U') IS NOT NULL DROP TABLE users;

-- 1. Tabla USERS
CREATE TABLE users (
    id int IDENTITY(1,1) PRIMARY KEY,
    username varchar(50) UNIQUE NOT NULL,
    email varchar(100) UNIQUE NOT NULL,
    password varchar(255) NOT NULL,
    role varchar(20) NOT NULL DEFAULT 'viewer',
    is_active bit NOT NULL DEFAULT 1,
    created_at datetime2 DEFAULT GETDATE(),
    last_login datetime2,
    updated_at datetime2 DEFAULT GETDATE(),
    
    CONSTRAINT CHK_users_role CHECK (role IN ('admin', 'manager', 'operator', 'viewer'))
);

-- 2. Tabla PROJECTS (campos actualizados)
CREATE TABLE projects (
    id int IDENTITY(1,1) PRIMARY KEY,
    ritm_code varchar(50) UNIQUE NOT NULL, -- Código RITM (ServiceNow)
    project_name varchar(200) NOT NULL, -- Nombre del Proyecto
    client varchar(200) NOT NULL, -- Cliente
    datacenter varchar(100) NOT NULL, -- Datacenter
    delivery_date date, -- Fecha de Entrega
    teams_folder_url varchar(500), -- URL de Carpeta Teams
    excel_file_path varchar(500), -- Archivo Excel con información del proyecto
    status varchar(20) NOT NULL DEFAULT 'active',
    created_by int NOT NULL,
    created_at datetime2 DEFAULT GETDATE(),
    updated_at datetime2 DEFAULT GETDATE(),
    
    FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT CHK_projects_status CHECK (status IN ('active', 'on_hold', 'completed', 'cancelled'))
);

-- 3. Tabla ORDERS (campos actualizados)
CREATE TABLE orders (
    id int IDENTITY(1,1) PRIMARY KEY,
    project_id int NOT NULL,
    order_code varchar(50) UNIQUE NOT NULL, -- Código Pedido
    equipment_count int NOT NULL DEFAULT 0, -- Número de equipos
    vendor varchar(200), -- Mantenemos vendor como campo opcional
    description text,
    expected_delivery_date date,
    status varchar(20) NOT NULL DEFAULT 'pending',
    created_by int NOT NULL,
    created_at datetime2 DEFAULT GETDATE(),
    updated_at datetime2 DEFAULT GETDATE(),
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT CHK_orders_status CHECK (status IN ('pending', 'received', 'partial', 'cancelled')),
    CONSTRAINT CHK_equipment_count CHECK (equipment_count >= 0)
);

-- 4. Tabla DELIVERY_NOTES (campos actualizados)
CREATE TABLE delivery_notes (
    id int IDENTITY(1,1) PRIMARY KEY,
    order_id int NOT NULL,
    delivery_code varchar(50) UNIQUE NOT NULL, -- Código Albarán
    estimated_equipment_count int NOT NULL DEFAULT 0, -- Número de equipos estimados
    delivery_date date NOT NULL,
    carrier varchar(200),
    tracking_number varchar(100),
    attached_document_path varchar(500), -- Adjuntar documento (docx, pdf, xlsx)
    notes text,
    status varchar(20) NOT NULL DEFAULT 'received',
    created_by int NOT NULL,
    created_at datetime2 DEFAULT GETDATE(),
    updated_at datetime2 DEFAULT GETDATE(),
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT CHK_delivery_notes_status CHECK (status IN ('received', 'processing', 'completed')),
    CONSTRAINT CHK_estimated_equipment_count CHECK (estimated_equipment_count >= 0)
);

-- 5. Tabla EQUIPMENT (sin cambios majores)
CREATE TABLE equipment (
    id int IDENTITY(1,1) PRIMARY KEY,
    delivery_note_id int NOT NULL,
    serial_number varchar(100) UNIQUE NOT NULL,
    asset_tag varchar(50) UNIQUE,
    manufacturer varchar(100) NOT NULL,
    model varchar(200) NOT NULL,
    category varchar(50),
    specifications text,
    condition_status varchar(20) DEFAULT 'new',
    location varchar(200),
    status varchar(20) NOT NULL DEFAULT 'received',
    created_by int NOT NULL,
    created_at datetime2 DEFAULT GETDATE(),
    updated_at datetime2 DEFAULT GETDATE(),
    
    FOREIGN KEY (delivery_note_id) REFERENCES delivery_notes(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT CHK_equipment_condition CHECK (condition_status IN ('new', 'good', 'fair', 'poor')),
    CONSTRAINT CHK_equipment_status CHECK (status IN ('received', 'installed', 'configured', 'decommissioned'))
);

-- 6. Tabla AUDIT_LOGS
CREATE TABLE audit_logs (
    id int IDENTITY(1,1) PRIMARY KEY,
    user_id int,
    action varchar(100) NOT NULL,
    table_name varchar(50),
    record_id int,
    old_values text,
    new_values text,
    ip_address varchar(45),
    user_agent text,
    created_at datetime2 DEFAULT GETDATE(),
    
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ÍNDICES PARA RENDIMIENTO
CREATE INDEX IX_projects_created_by ON projects(created_by);
CREATE INDEX IX_projects_status ON projects(status);
CREATE INDEX IX_projects_ritm_code ON projects(ritm_code);

CREATE INDEX IX_orders_project_id ON orders(project_id);
CREATE INDEX IX_orders_created_by ON orders(created_by);
CREATE INDEX IX_orders_status ON orders(status);
CREATE INDEX IX_orders_order_code ON orders(order_code);

CREATE INDEX IX_delivery_notes_order_id ON delivery_notes(order_id);
CREATE INDEX IX_delivery_notes_created_by ON delivery_notes(created_by);
CREATE INDEX IX_delivery_notes_delivery_code ON delivery_notes(delivery_code);

CREATE INDEX IX_equipment_delivery_note_id ON equipment(delivery_note_id);
CREATE INDEX IX_equipment_created_by ON equipment(created_by);
CREATE INDEX IX_equipment_serial_number ON equipment(serial_number);
CREATE INDEX IX_equipment_asset_tag ON equipment(asset_tag);
CREATE INDEX IX_equipment_status ON equipment(status);

CREATE INDEX IX_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IX_audit_logs_created_at ON audit_logs(created_at);

PRINT 'Esquema actualizado creado correctamente';
PRINT 'Nuevos campos:';
PRINT '- PROJECTS: ritm_code, project_name, client, datacenter, delivery_date, teams_folder_url, excel_file_path';
PRINT '- ORDERS: order_code, equipment_count';
PRINT '- DELIVERY_NOTES: delivery_code, estimated_equipment_count, attached_document_path';