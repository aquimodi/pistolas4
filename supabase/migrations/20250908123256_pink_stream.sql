/*
  # Esquema de Base de Datos Corregido - Sistema de Gestión de Equipos Datacenter

  1. Nuevas Tablas con Relaciones Correctas
    - `users` - Usuarios del sistema
    - `projects` - Proyectos (referencia created_by -> users.id)
    - `orders` - Pedidos (referencia project_id -> projects.id, created_by -> users.id)
    - `delivery_notes` - Albaranes (referencia order_id -> orders.id, created_by -> users.id)
    - `equipment` - Equipos (referencia delivery_note_id -> delivery_notes.id, created_by -> users.id)

  2. Relaciones Jerárquicas Correctas
    users -> projects -> orders -> delivery_notes -> equipment

  3. Foreign Keys Apropiadas
    - Todas las tablas tienen created_by que referencia users.id
    - Jerarquía clara: projects.id -> orders.project_id -> delivery_notes.order_id -> equipment.delivery_note_id
*/

-- Usar la base de datos datacenter equipment
USE datacenter_equipment;

-- Eliminar tablas existentes en orden correcto (foreign keys primero)
IF OBJECT_ID('equipment', 'U') IS NOT NULL DROP TABLE equipment;
IF OBJECT_ID('delivery_notes', 'U') IS NOT NULL DROP TABLE delivery_notes;
IF OBJECT_ID('orders', 'U') IS NOT NULL DROP TABLE orders;
IF OBJECT_ID('projects', 'U') IS NOT NULL DROP TABLE projects;
IF OBJECT_ID('audit_logs', 'U') IS NOT NULL DROP TABLE audit_logs;
IF OBJECT_ID('users', 'U') IS NOT NULL DROP TABLE users;

-- 1. Tabla USERS (base de todo el sistema)
CREATE TABLE users (
    id int IDENTITY(1,1) PRIMARY KEY,
    username varchar(50) UNIQUE NOT NULL,
    email varchar(100) UNIQUE NOT NULL,
    password varchar(255) NOT NULL, -- PLAIN TEXT para demo
    role varchar(20) NOT NULL DEFAULT 'viewer',
    is_active bit NOT NULL DEFAULT 1,
    created_at datetime2 DEFAULT GETDATE(),
    last_login datetime2,
    updated_at datetime2 DEFAULT GETDATE(),
    
    CONSTRAINT CHK_users_role CHECK (role IN ('admin', 'manager', 'operator', 'viewer'))
);

-- 2. Tabla PROJECTS (proyecto principal)
CREATE TABLE projects (
    id int IDENTITY(1,1) PRIMARY KEY,
    name varchar(200) NOT NULL,
    description text,
    status varchar(20) NOT NULL DEFAULT 'active',
    created_by int NOT NULL, -- FK a users.id
    created_at datetime2 DEFAULT GETDATE(),
    updated_at datetime2 DEFAULT GETDATE(),
    
    FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT CHK_projects_status CHECK (status IN ('active', 'on_hold', 'completed', 'cancelled'))
);

-- 3. Tabla ORDERS (pedidos de un proyecto)
CREATE TABLE orders (
    id int IDENTITY(1,1) PRIMARY KEY,
    project_id int NOT NULL, -- FK a projects.id (RELACIÓN CRÍTICA)
    order_number varchar(50) UNIQUE NOT NULL,
    vendor varchar(200) NOT NULL,
    description text,
    expected_delivery_date date,
    status varchar(20) NOT NULL DEFAULT 'pending',
    created_by int NOT NULL, -- FK a users.id
    created_at datetime2 DEFAULT GETDATE(),
    updated_at datetime2 DEFAULT GETDATE(),
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE, -- RELACIÓN CON PROJECT
    FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT CHK_orders_status CHECK (status IN ('pending', 'received', 'partial', 'cancelled'))
);

-- 4. Tabla DELIVERY_NOTES (albaranes de un pedido)
CREATE TABLE delivery_notes (
    id int IDENTITY(1,1) PRIMARY KEY,
    order_id int NOT NULL, -- FK a orders.id (RELACIÓN CRÍTICA)
    delivery_note_number varchar(50) UNIQUE NOT NULL,
    delivery_date date NOT NULL,
    carrier varchar(200),
    tracking_number varchar(100),
    notes text,
    status varchar(20) NOT NULL DEFAULT 'received',
    created_by int NOT NULL, -- FK a users.id
    created_at datetime2 DEFAULT GETDATE(),
    updated_at datetime2 DEFAULT GETDATE(),
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE, -- RELACIÓN CON ORDER
    FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT CHK_delivery_notes_status CHECK (status IN ('received', 'processing', 'completed'))
);

-- 5. Tabla EQUIPMENT (equipos de un albarán)
CREATE TABLE equipment (
    id int IDENTITY(1,1) PRIMARY KEY,
    delivery_note_id int NOT NULL, -- FK a delivery_notes.id (RELACIÓN CRÍTICA)
    serial_number varchar(100) UNIQUE NOT NULL,
    asset_tag varchar(50) UNIQUE,
    manufacturer varchar(100) NOT NULL,
    model varchar(200) NOT NULL,
    category varchar(50),
    specifications text,
    condition_status varchar(20) DEFAULT 'new',
    location varchar(200),
    status varchar(20) NOT NULL DEFAULT 'received',
    created_by int NOT NULL, -- FK a users.id
    created_at datetime2 DEFAULT GETDATE(),
    updated_at datetime2 DEFAULT GETDATE(),
    
    FOREIGN KEY (delivery_note_id) REFERENCES delivery_notes(id) ON DELETE CASCADE, -- RELACIÓN CON DELIVERY_NOTE
    FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT CHK_equipment_condition CHECK (condition_status IN ('new', 'good', 'fair', 'poor')),
    CONSTRAINT CHK_equipment_status CHECK (status IN ('received', 'installed', 'configured', 'decommissioned'))
);

-- 6. Tabla AUDIT_LOGS (auditoría del sistema)
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

-- ÍNDICES PARA RENDIMIENTO Y RELACIONES
CREATE INDEX IX_projects_created_by ON projects(created_by);
CREATE INDEX IX_projects_status ON projects(status);

CREATE INDEX IX_orders_project_id ON orders(project_id); -- ÍNDICE CRÍTICO PARA RELACIÓN
CREATE INDEX IX_orders_created_by ON orders(created_by);
CREATE INDEX IX_orders_status ON orders(status);

CREATE INDEX IX_delivery_notes_order_id ON delivery_notes(order_id); -- ÍNDICE CRÍTICO PARA RELACIÓN
CREATE INDEX IX_delivery_notes_created_by ON delivery_notes(created_by);

CREATE INDEX IX_equipment_delivery_note_id ON equipment(delivery_note_id); -- ÍNDICE CRÍTICO PARA RELACIÓN
CREATE INDEX IX_equipment_created_by ON equipment(created_by);
CREATE INDEX IX_equipment_serial_number ON equipment(serial_number);
CREATE INDEX IX_equipment_asset_tag ON equipment(asset_tag);
CREATE INDEX IX_equipment_status ON equipment(status);

CREATE INDEX IX_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IX_audit_logs_created_at ON audit_logs(created_at);

PRINT 'Esquema de base de datos creado correctamente con relaciones apropiadas';
PRINT 'Relaciones: users -> projects -> orders -> delivery_notes -> equipment';