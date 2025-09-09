/*
  # Datacenter Equipment Management Database Schema

  1. New Tables
    - `users` - System users with plain text passwords
      - `id` (int, primary key, identity)
      - `username` (varchar, unique)
      - `email` (varchar, unique)
      - `password` (varchar) - PLAIN TEXT passwords
      - `role` (varchar) - admin, manager, operator, viewer
      - `is_active` (bit)
      - `created_at` (datetime2)
      - `last_login` (datetime2)
    
    - `projects` - Top-level project containers
      - `id` (int, primary key, identity)
      - `name` (varchar)
      - `description` (text)
      - `status` (varchar)
      - `created_by` (int, foreign key to users)
      - `created_at` (datetime2)
      - `updated_at` (datetime2)
    
    - `orders` - Equipment purchase orders
      - `id` (int, primary key, identity)
      - `project_id` (int, foreign key to projects)
      - `order_number` (varchar, unique)
      - `vendor` (varchar)
      - `description` (text)
      - `expected_delivery_date` (date)
      - `status` (varchar)
      - `created_by` (int, foreign key to users)
      - `created_at` (datetime2)
      - `updated_at` (datetime2)
    
    - `delivery_notes` - Shipment tracking documents
      - `id` (int, primary key, identity)
      - `order_id` (int, foreign key to orders)
      - `delivery_note_number` (varchar, unique)
      - `delivery_date` (date)
      - `carrier` (varchar)
      - `tracking_number` (varchar)
      - `notes` (text)
      - `status` (varchar)
      - `created_by` (int, foreign key to users)
      - `created_at` (datetime2)
      - `updated_at` (datetime2)
    
    - `equipment` - Individual equipment items
      - `id` (int, primary key, identity)
      - `delivery_note_id` (int, foreign key to delivery_notes)
      - `serial_number` (varchar, unique)
      - `asset_tag` (varchar, unique)
      - `manufacturer` (varchar)
      - `model` (varchar)
      - `category` (varchar)
      - `specifications` (text)
      - `condition_status` (varchar)
      - `location` (varchar)
      - `status` (varchar)
      - `created_by` (int, foreign key to users)
      - `created_at` (datetime2)
      - `updated_at` (datetime2)

  2. Security
    - All tables have proper foreign key constraints
    - Audit trail with created_by and timestamps
    - Unique constraints on critical fields

  3. Important Notes
    - Passwords are stored in PLAIN TEXT for demo purposes
    - NOT suitable for production environments
    - Users table uses 'password' column, not 'password_hash'
*/

-- Create database if not exists (run this against master database first)
-- USE master;
-- IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'datacenter_equipment')
-- BEGIN
--     CREATE DATABASE datacenter_equipment;
-- END

-- Use the datacenter equipment database
USE datacenter_equipment;

-- Drop existing tables if they exist (in correct order to handle foreign keys)
IF OBJECT_ID('equipment', 'U') IS NOT NULL DROP TABLE equipment;
IF OBJECT_ID('delivery_notes', 'U') IS NOT NULL DROP TABLE delivery_notes;
IF OBJECT_ID('orders', 'U') IS NOT NULL DROP TABLE orders;
IF OBJECT_ID('projects', 'U') IS NOT NULL DROP TABLE projects;
IF OBJECT_ID('audit_logs', 'U') IS NOT NULL DROP TABLE audit_logs;
IF OBJECT_ID('users', 'U') IS NOT NULL DROP TABLE users;

-- Create users table with PLAIN TEXT passwords
CREATE TABLE users (
    id int IDENTITY(1,1) PRIMARY KEY,
    username varchar(50) UNIQUE NOT NULL,
    email varchar(100) UNIQUE NOT NULL,
    password varchar(255) NOT NULL, -- PLAIN TEXT PASSWORD
    role varchar(20) NOT NULL DEFAULT 'viewer',
    is_active bit NOT NULL DEFAULT 1,
    created_at datetime2 DEFAULT GETDATE(),
    last_login datetime2,
    updated_at datetime2 DEFAULT GETDATE(),
    
    CONSTRAINT CHK_users_role CHECK (role IN ('admin', 'manager', 'operator', 'viewer'))
);

-- Create projects table
CREATE TABLE projects (
    id int IDENTITY(1,1) PRIMARY KEY,
    name varchar(200) NOT NULL,
    description text,
    status varchar(20) NOT NULL DEFAULT 'active',
    created_by int NOT NULL,
    created_at datetime2 DEFAULT GETDATE(),
    updated_at datetime2 DEFAULT GETDATE(),
    
    FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT CHK_projects_status CHECK (status IN ('active', 'on_hold', 'completed', 'cancelled'))
);

-- Create orders table
CREATE TABLE orders (
    id int IDENTITY(1,1) PRIMARY KEY,
    project_id int NOT NULL,
    order_number varchar(50) UNIQUE NOT NULL,
    vendor varchar(200) NOT NULL,
    description text,
    expected_delivery_date date,
    status varchar(20) NOT NULL DEFAULT 'pending',
    created_by int NOT NULL,
    created_at datetime2 DEFAULT GETDATE(),
    updated_at datetime2 DEFAULT GETDATE(),
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT CHK_orders_status CHECK (status IN ('pending', 'received', 'partial', 'cancelled'))
);

-- Create delivery_notes table
CREATE TABLE delivery_notes (
    id int IDENTITY(1,1) PRIMARY KEY,
    order_id int NOT NULL,
    delivery_note_number varchar(50) UNIQUE NOT NULL,
    delivery_date date NOT NULL,
    carrier varchar(200),
    tracking_number varchar(100),
    notes text,
    status varchar(20) NOT NULL DEFAULT 'received',
    created_by int NOT NULL,
    created_at datetime2 DEFAULT GETDATE(),
    updated_at datetime2 DEFAULT GETDATE(),
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT CHK_delivery_notes_status CHECK (status IN ('received', 'processing', 'completed'))
);

-- Create equipment table
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

-- Create audit_logs table for tracking user actions
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

-- Create indexes for better performance
CREATE INDEX IX_projects_created_by ON projects(created_by);
CREATE INDEX IX_projects_status ON projects(status);
CREATE INDEX IX_projects_created_at ON projects(created_at);

CREATE INDEX IX_orders_project_id ON orders(project_id);
CREATE INDEX IX_orders_status ON orders(status);
CREATE INDEX IX_orders_created_at ON orders(created_at);

CREATE INDEX IX_delivery_notes_order_id ON delivery_notes(order_id);
CREATE INDEX IX_delivery_notes_delivery_date ON delivery_notes(delivery_date);

CREATE INDEX IX_equipment_delivery_note_id ON equipment(delivery_note_id);
CREATE INDEX IX_equipment_serial_number ON equipment(serial_number);
CREATE INDEX IX_equipment_asset_tag ON equipment(asset_tag);
CREATE INDEX IX_equipment_manufacturer ON equipment(manufacturer);
CREATE INDEX IX_equipment_status ON equipment(status);

CREATE INDEX IX_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IX_audit_logs_created_at ON audit_logs(created_at);

PRINT 'Database schema created successfully with plain text passwords';