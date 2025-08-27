/*
  # Datacenter Equipment Management Database Schema
  
  This script creates the complete database schema for the datacenter equipment management system.
  
  ## Tables Created:
  1. users - System users with role-based access
  2. projects - Main project containers
  3. orders - Equipment orders within projects
  4. delivery_notes - Delivery documentation for orders
  5. equipment - Individual equipment items
  6. audit_logs - Activity tracking and audit trail
  
  ## Relationships:
  - Projects contain multiple Orders
  - Orders contain multiple Delivery Notes
  - Delivery Notes contain multiple Equipment items
  
  ## Security:
  - Password hashing for user authentication
  - Audit logging for all critical operations
  - Proper foreign key constraints
*/

-- Create database if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'datacenter_equipment')
BEGIN
    CREATE DATABASE datacenter_equipment;
END;

USE datacenter_equipment;

-- Users table for authentication
CREATE TABLE users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(100) UNIQUE NOT NULL,
    email NVARCHAR(255) UNIQUE NOT NULL,
    password_hash NVARCHAR(255) NOT NULL,
    role NVARCHAR(50) NOT NULL DEFAULT 'operator',
    is_active BIT NOT NULL DEFAULT 1,
    last_login DATETIME2,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    
    CONSTRAINT CHK_users_role CHECK (role IN ('admin', 'manager', 'operator', 'viewer'))
);

-- Projects table
CREATE TABLE projects (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    status NVARCHAR(50) NOT NULL DEFAULT 'active',
    created_by INT NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    
    CONSTRAINT CHK_projects_status CHECK (status IN ('active', 'completed', 'on_hold', 'cancelled')),
    CONSTRAINT FK_projects_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Orders table
CREATE TABLE orders (
    id INT IDENTITY(1,1) PRIMARY KEY,
    project_id INT NOT NULL,
    order_number NVARCHAR(100) UNIQUE NOT NULL,
    vendor NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    order_date DATETIME2 NOT NULL DEFAULT GETDATE(),
    expected_delivery_date DATETIME2,
    actual_delivery_date DATETIME2,
    status NVARCHAR(50) NOT NULL DEFAULT 'pending',
    created_by INT NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    
    CONSTRAINT CHK_orders_status CHECK (status IN ('pending', 'received', 'partial', 'cancelled')),
    CONSTRAINT FK_orders_project_id FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT FK_orders_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Delivery Notes table
CREATE TABLE delivery_notes (
    id INT IDENTITY(1,1) PRIMARY KEY,
    order_id INT NOT NULL,
    delivery_note_number NVARCHAR(100) UNIQUE NOT NULL,
    delivery_date DATETIME2 NOT NULL,
    carrier NVARCHAR(255),
    tracking_number NVARCHAR(255),
    notes NVARCHAR(MAX),
    status NVARCHAR(50) NOT NULL DEFAULT 'received',
    created_by INT NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    
    CONSTRAINT CHK_delivery_notes_status CHECK (status IN ('received', 'processing', 'completed')),
    CONSTRAINT FK_delivery_notes_order_id FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT FK_delivery_notes_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Equipment table
CREATE TABLE equipment (
    id INT IDENTITY(1,1) PRIMARY KEY,
    delivery_note_id INT NOT NULL,
    serial_number NVARCHAR(255) UNIQUE NOT NULL,
    asset_tag NVARCHAR(100),
    manufacturer NVARCHAR(255) NOT NULL,
    model NVARCHAR(255) NOT NULL,
    category NVARCHAR(100),
    specifications NVARCHAR(MAX),
    condition_status NVARCHAR(50) DEFAULT 'new',
    location NVARCHAR(255),
    status NVARCHAR(50) NOT NULL DEFAULT 'received',
    warranty_expiry DATETIME2,
    purchase_price DECIMAL(10,2),
    created_by INT NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    
    CONSTRAINT CHK_equipment_condition CHECK (condition_status IN ('new', 'good', 'fair', 'poor')),
    CONSTRAINT CHK_equipment_status CHECK (status IN ('received', 'installed', 'configured', 'decommissioned')),
    CONSTRAINT FK_equipment_delivery_note_id FOREIGN KEY (delivery_note_id) REFERENCES delivery_notes(id) ON DELETE CASCADE,
    CONSTRAINT FK_equipment_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Audit logs table for tracking all operations
CREATE TABLE audit_logs (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT,
    action NVARCHAR(100) NOT NULL,
    table_name NVARCHAR(100) NOT NULL,
    record_id INT,
    old_values NVARCHAR(MAX),
    new_values NVARCHAR(MAX),
    ip_address NVARCHAR(45),
    user_agent NVARCHAR(500),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    
    CONSTRAINT FK_audit_logs_user_id FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create indexes for better performance
CREATE INDEX IX_projects_status ON projects(status);
CREATE INDEX IX_projects_created_at ON projects(created_at);
CREATE INDEX IX_orders_project_id ON orders(project_id);
CREATE INDEX IX_orders_status ON orders(status);
CREATE INDEX IX_orders_order_number ON orders(order_number);
CREATE INDEX IX_delivery_notes_order_id ON delivery_notes(order_id);
CREATE INDEX IX_delivery_notes_delivery_date ON delivery_notes(delivery_date);
CREATE INDEX IX_equipment_delivery_note_id ON equipment(delivery_note_id);
CREATE INDEX IX_equipment_serial_number ON equipment(serial_number);
CREATE INDEX IX_equipment_status ON equipment(status);
CREATE INDEX IX_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IX_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IX_audit_logs_created_at ON audit_logs(created_at);