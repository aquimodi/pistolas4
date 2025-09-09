import sql from 'mssql';
import logger from '../utils/logger.js';

let pool;
let isConnected = false;
let isMockMode = false;
let connectionAttempted = false;

const dbConfig = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'YourPassword123!',
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'DatacenterEquipment',
  options: {
    encrypt: false,
    enableArithAbort: true,
    trustServerCertificate: true
  },
  connectionTimeout: 30000,
  requestTimeout: 30000,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

export const connectDatabase = async () => {
  if (connectionAttempted) {
    return { connected: isConnected, mockMode: isMockMode };
  }
  
  connectionAttempted = true;
  
  try {
    logger.info('🔧 Attempting to connect to SQL Server database...');
    pool = await sql.connect(dbConfig);
    isConnected = true;
    isMockMode = false;
    logger.info('✅ Successfully connected to SQL Server database');
    return { connected: true, mockMode: false };
  } catch (error) {
    logger.warn('⚠ Failed to connect to SQL Server database:', {
      service: 'datacenter-equipment-api',
      timestamp: new Date().toISOString().slice(0, 19).replace('T', ' ')
    });
    logger.info('🔄 Switching to mock mode for API responses', {
      service: 'datacenter-equipment-api', 
      timestamp: new Date().toISOString().slice(0, 19).replace('T', ' ')
    });
    isConnected = false;
    isMockMode = true;
    return { connected: false, mockMode: true };
  }
};

export const executeQuery = async (query, params = []) => {
  if (isMockMode) {
    // Reduce log noise in mock mode
    if (Math.random() < 0.1) { // Only log 10% of mock queries
      logger.debug('📊 Mock mode: Generating fake data for query');
    }
    return generateMockResponse(query, params);
  }

  try {
    if (!isConnected) {
      await connectDatabase();
    }
    
    const request = pool.request();
    
    // Add parameters
    params.forEach((param, index) => {
      request.input(`param${index}`, param);
    });
    
    const result = await request.query(query);
    return result.recordset || result.recordsets[0] || [];
  } catch (error) {
    logger.error('Database query error:', error);
    logger.info('🔄 Falling back to mock mode');
    isMockMode = true;
    return generateMockResponse(query, params);
  }
};

const generateMockResponse = (query, params) => {
  const queryLower = query.toLowerCase();
  
  // Mock responses for INSERT operations
  if (queryLower.includes('orders') && queryLower.includes('insert')) {
    console.log('📊 Mock: Creating new order');
    return [{ 
      id: Math.floor(Math.random() * 1000) + 100, 
      project_id: 1, 
      order_code: 'PED-2024-NEW', 
      equipment_count: 1, 
      vendor: 'Mock Vendor', 
      created_at: new Date() 
    }];
  }
  
  if (queryLower.includes('delivery_notes') && queryLower.includes('insert')) {
    console.log('📊 Mock: Creating new delivery note');
    return [{ 
      id: Math.floor(Math.random() * 1000) + 100, 
      order_id: 1, 
      delivery_code: 'ALB-2024-NEW', 
      estimated_equipment_count: 1, 
      delivery_date: new Date(), 
      created_at: new Date() 
    }];
  }
  
  if (queryLower.includes('equipment') && queryLower.includes('insert')) {
    console.log('📊 Mock: Creating new equipment');
    return [{ 
      id: Math.floor(Math.random() * 1000) + 100, 
      delivery_note_id: 1, 
      serial_number: 'MOCK-' + Math.random().toString(36).substr(2, 6).toUpperCase(), 
      manufacturer: 'Mock Manufacturer', 
      model: 'Mock Model', 
      created_at: new Date() 
    }];
  }
  
  // Mock responses for SELECT operations
  if (queryLower.includes('orders') && queryLower.includes('select')) {
    return [
      {
        id: 1,
        project_id: 1,
        order_code: 'PED-2024-001',
        equipment_count: 15,
        vendor: 'Dell Technologies',
        description: 'Mock order for testing',
        status: 'pending',
        created_at: new Date('2024-01-15'),
        project_name: 'Mock Project A'
      },
      {
        id: 2,
        project_id: 1,
        order_code: 'PED-2024-002', 
        equipment_count: 8,
        vendor: 'HPE',
        description: 'Mock server equipment',
        status: 'completed',
        created_at: new Date('2024-01-20'),
        project_name: 'Mock Project A'
      }
    ];
  }

  if (queryLower.includes('delivery_notes') && queryLower.includes('select')) {
    return [
      {
        id: 1,
        order_id: 1,
        delivery_code: 'ALB-2024-001',
        estimated_equipment_count: 12,
        delivery_date: new Date('2024-01-25'),
        carrier: 'FedEx',
        status: 'received',
        created_at: new Date('2024-01-25'),
        order_number: 'PED-2024-001',
        project_name: 'Mock Project A'
      }
    ];
  }

  if (queryLower.includes('equipment') && queryLower.includes('select')) {
    return [
      {
        id: 1,
        delivery_note_id: 1,
        serial_number: 'MOCK-SVR001',
        asset_tag: 'AT-001',
        manufacturer: 'Dell',
        model: 'PowerEdge R750',
        category: 'Server',
        condition_status: 'New',
        location: 'Rack A1',
        status: 'active',
        created_at: new Date('2024-01-25')
      }
    ];
  }

  if (queryLower.includes('projects') && queryLower.includes('select')) {
    return [
      {
        id: 1,
        name: 'Mock Project A',
        description: 'Mock project for testing',
        status: 'active',
        start_date: new Date('2024-01-01'),
        created_at: new Date('2024-01-01')
      }
    ];
  }

  if (queryLower.includes('users') && queryLower.includes('select')) {
    return [
      {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin',
        created_at: new Date('2024-01-01')
      }
    ];
  }

  return [];
};

export const getConnectionStatus = () => ({
  connected: isConnected,
  mockMode: isMockMode
});