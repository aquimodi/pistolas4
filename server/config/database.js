import sql from 'mssql';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

const config = {
  server: process.env.DB_SERVER || 'localhost',
  port: parseInt(process.env.DB_PORT) || 1433,
  database: process.env.DB_DATABASE || 'datacenter_equipment',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    requestTimeout: 30000,
    connectionTimeout: 30000,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool = null;

export async function connectDB() {
  try {
    if (pool && pool.connected) {
      return pool;
    }
    
    pool = await sql.connect(config);
    logger.info('Connected to SQL Server successfully');
    return pool;
  } catch (error) {
    logger.error('Database connection failed:', error);
    
    // For development/demo purposes, use mock data when SQL Server is not available
    if (process.env.NODE_ENV === 'development') {
      logger.warn('Using mock database for development');
      return { connected: false, mock: true };
    }
    throw error;
  }
}

export async function executeQuery(query, params = []) {
  try {
    const db = await connectDB();
    
    // Return mock data if using mock database
    if (db.mock) {
      return getMockData(query);
    }
    
    const request = pool.request();
    
    // Add parameters if provided
    params.forEach((param, index) => {
      request.input(`param${index}`, param);
    });
    
    const result = await request.query(query);
    logger.debug(`Query executed successfully: ${query.substring(0, 100)}...`);
    return result.recordset;
  } catch (error) {
    logger.error('Query execution failed:', error);
    throw error;
  }
}

// Mock data for development
function getMockData(query) {
  const queryLower = query.toLowerCase();
  
  if (queryLower.includes('users') && queryLower.includes('select')) {
    return [
      { id: 1, username: 'admin', email: 'admin@datacenter.com', role: 'admin', is_active: 1, password_hash: '$2b$10$rOTzB8qY9X.K5vN2sJ8HO.JY5vN2sJ8HO.JY5vN2sJ8HO.JY5vN2s', created_at: new Date() },
      { id: 2, username: 'operator', email: 'operator@datacenter.com', role: 'operator', is_active: 1, password_hash: '$2b$10$rOTzB8qY9X.K5vN2sJ8HO.JY5vN2sJ8HO.JY5vN2sJ8HO.JY5vN2s', created_at: new Date() }
    ];
  }
  
  if (queryLower.includes('projects')) {
    return [
      { id: 1, name: 'DC Expansion Phase 1', description: 'Datacenter expansion project', status: 'active', created_at: new Date() },
      { id: 2, name: 'Server Refresh 2024', description: 'Annual server hardware refresh', status: 'active', created_at: new Date() }
    ];
  }
  
  if (queryLower.includes('orders')) {
    return [
      { id: 1, project_id: 1, order_number: 'ORD-2024-001', vendor: 'Dell Technologies', status: 'pending', created_at: new Date() },
      { id: 2, project_id: 1, order_number: 'ORD-2024-002', vendor: 'HPE', status: 'received', created_at: new Date() }
    ];
  }
  
  if (queryLower.includes('delivery_notes')) {
    return [
      { id: 1, order_id: 1, delivery_note_number: 'DN-2024-001', delivery_date: new Date(), status: 'received', created_at: new Date() },
      { id: 2, order_id: 2, delivery_note_number: 'DN-2024-002', delivery_date: new Date(), status: 'processing', created_at: new Date() }
    ];
  }
  
  if (queryLower.includes('equipment')) {
    return [
      { id: 1, delivery_note_id: 1, serial_number: 'DL001234', model: 'PowerEdge R750', manufacturer: 'Dell', status: 'received', location: 'Rack A1', created_at: new Date() },
      { id: 2, delivery_note_id: 1, serial_number: 'DL005678', model: 'PowerEdge R740', manufacturer: 'Dell', status: 'installed', location: 'Rack A2', created_at: new Date() }
    ];
  }
  
  return [];
}

export { sql };