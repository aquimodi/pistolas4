import dotenv from 'dotenv';
import sql from 'mssql';
import logger from '../utils/logger.js';

// Ensure environment variables are loaded
dotenv.config();

// Log database configuration for debugging
logger.info('Database configuration:', {
  server: process.env.DB_SERVER || 'localhost',
  port: parseInt(process.env.DB_PORT) || 1433,
  database: process.env.DB_DATABASE || 'datacenter_equipment',
  user: process.env.DB_USER || 'sa',
  hasPassword: !!process.env.DB_PASSWORD
});

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
    
    // Use mock data when SQL Server is not available (development/demo mode)
    logger.warn('SQL Server not available, using mock database for development');
    return { connected: false, mock: true };
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
  
  console.log('Using mock data for query:', query.substring(0, 100));
  
  if (queryLower.includes('users') && queryLower.includes('select')) {
    return [
      { id: 1, username: 'admin', email: 'admin@datacenter.com', role: 'admin', is_active: 1, password: 'admin', created_at: new Date() },
      { id: 2, username: 'manager', email: 'manager@datacenter.com', role: 'manager', is_active: 1, password: 'manager', created_at: new Date() },
      { id: 3, username: 'operator', email: 'operator@datacenter.com', role: 'operator', is_active: 1, password: 'operator', created_at: new Date() },
      { id: 4, username: 'viewer', email: 'viewer@datacenter.com', role: 'viewer', is_active: 1, password: 'viewer', created_at: new Date() }
    ];
  }
  
  if (queryLower.includes('projects')) {
    return [
      { id: 1, name: 'DC Expansion Phase 1', description: 'Primary datacenter expansion with new server racks', status: 'active', created_at: new Date(), created_by: 1 },
      { id: 2, name: 'Server Refresh 2024', description: 'Annual server hardware refresh and modernization', status: 'active', created_at: new Date(), created_by: 1 },
      { id: 3, name: 'Network Upgrade Q1', description: 'Core network infrastructure upgrade', status: 'on_hold', created_at: new Date(), created_by: 2 }
    ];
  }
  
  if (queryLower.includes('orders')) {
    return [
      { id: 1, project_id: 1, order_number: 'ORD-2024-001', vendor: 'Dell Technologies', description: '10x PowerEdge R750 servers', status: 'received', created_at: new Date(), project_name: 'DC Expansion Phase 1' },
      { id: 2, project_id: 1, order_number: 'ORD-2024-002', vendor: 'HPE', description: '5x ProLiant DL380 servers', status: 'pending', created_at: new Date(), project_name: 'DC Expansion Phase 1' },
      { id: 3, project_id: 2, order_number: 'ORD-2024-003', vendor: 'Cisco Systems', description: 'Network switches and routers', status: 'partial', created_at: new Date(), project_name: 'Server Refresh 2024' }
    ];
  }
  
  if (queryLower.includes('delivery_notes')) {
    return [
      { id: 1, order_id: 1, delivery_note_number: 'DN-2024-001', delivery_date: new Date(), status: 'completed', carrier: 'FedEx', created_at: new Date(), order_number: 'ORD-2024-001', project_name: 'DC Expansion Phase 1' },
      { id: 2, order_id: 2, delivery_note_number: 'DN-2024-002', delivery_date: new Date(), status: 'processing', carrier: 'UPS', created_at: new Date(), order_number: 'ORD-2024-002', project_name: 'DC Expansion Phase 1' },
      { id: 3, order_id: 3, delivery_note_number: 'DN-2024-003', delivery_date: new Date(), status: 'received', carrier: 'DHL', created_at: new Date(), order_number: 'ORD-2024-003', project_name: 'Server Refresh 2024' }
    ];
  }
  
  if (queryLower.includes('equipment')) {
    return [
      { id: 1, delivery_note_id: 1, serial_number: 'DL001234', asset_tag: 'DC-SRV-001', model: 'PowerEdge R750', manufacturer: 'Dell', category: 'Server', condition_status: 'new', status: 'configured', location: 'Rack A1-U01', specifications: 'Intel Xeon Gold 6338, 64GB RAM, 2x 960GB SSD', created_at: new Date() },
      { id: 2, delivery_note_id: 1, serial_number: 'DL001235', asset_tag: 'DC-SRV-002', model: 'PowerEdge R750', manufacturer: 'Dell', category: 'Server', condition_status: 'new', status: 'installed', location: 'Rack A1-U03', specifications: 'Intel Xeon Gold 6338, 64GB RAM, 2x 960GB SSD', created_at: new Date() },
      { id: 3, delivery_note_id: 2, serial_number: 'CS445566', asset_tag: 'DC-NET-001', model: 'Catalyst 9300-48P', manufacturer: 'Cisco', category: 'Network', condition_status: 'new', status: 'received', location: 'Rack C1-U42', specifications: '48-Port Gigabit Switch with PoE+', created_at: new Date() }
    ];
  }
  
  return [];
}

export { sql };