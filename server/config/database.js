import sql from 'mssql';
import logger from '../utils/logger.js';

const config = {
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'ProjectManagement',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'YourPassword123',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    requestTimeout: 30000,
    connectionTimeout: 30000
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let pool;
let isConnected = false;
let mockMode = false;

export const connectDatabase = async () => {
  try {
    logger.info('🔌 Attempting to connect to SQL Server database...');
    pool = await sql.connect(config);
    isConnected = true;
    mockMode = false;
    logger.info('✅ Connected to SQL Server database successfully');
    return pool;
  } catch (error) {
    logger.warn('⚠️ Failed to connect to SQL Server database:', error.message);
    logger.info('📊 Switching to mock mode for API responses');
    isConnected = false;
    mockMode = true;
    return null;
  }
};

export const executeQuery = async (query, params = []) => {
  // If in mock mode, return mock data
  if (mockMode || !isConnected) {
    logger.debug('📊 Mock mode: Generating fake data for query');
    return generateMockData(query, params);
  }

  try {
    const request = pool.request();
    
    // Add parameters to the request
    params.forEach((param, index) => {
      request.input(`param${index}`, param);
    });
    
    const result = await request.query(query);
    logger.debug(`Query executed: ${result.recordset?.length || 0} rows returned`);
    return result.recordset || [];
  } catch (error) {
    logger.error('Database query error:', error);
    logger.info('📊 Falling back to mock mode for this query');
    return generateMockData(query, params);
  }
};

// Generate mock data based on the query
const generateMockData = (query, params) => {
  const queryLower = query.toLowerCase();
  
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
  
  if (queryLower.includes('orders') && queryLower.includes('select')) {
    return [
      {
        id: 1,
        project_id: 1,
        order_code: 'PED-2024-001',
        equipment_count: 5,
        vendor: 'Tech Solutions S.L.',
        description: 'Equipamiento de red para proyecto Madrid DC-1',
        expected_delivery_date: '2024-12-15',
        status: 'pending',
        created_at: new Date('2024-01-15'),
        project_name: 'Expansión Red Madrid',
        client: 'Telefónica España',
        delivery_notes_count: 2
      },
      {
        id: 2,
        project_id: 2,
        order_code: 'PED-2024-002', 
        equipment_count: 3,
        vendor: 'Cisco Systems',
        description: 'Switches y routers para Barcelona',
        expected_delivery_date: '2024-11-30',
        status: 'delivered',
        created_at: new Date('2024-02-20'),
        project_name: 'Modernización BCN',
        client: 'Orange España',
        delivery_notes_count: 1
      }
    ];
  }
  
  if (queryLower.includes('delivery_notes') && queryLower.includes('select')) {
    return [
      {
        id: 1,
        order_id: 1,
        delivery_code: 'ALB-2024-001',
        estimated_equipment_count: 5,
        delivery_date: '2024-01-20',
        carrier: 'MRW',
        tracking_number: 'MRW123456789',
        attached_document_path: '/documents/alb-2024-001.pdf',
        notes: 'Entrega completa según especificaciones',
        status: 'delivered',
        created_at: new Date('2024-01-20'),
        order_code: 'PED-2024-001',
        vendor: 'Tech Solutions S.L.',
        project_name: 'Expansión Red Madrid',
        client: 'Telefónica España',
        equipment_count: 5
      },
      {
        id: 2,
        order_id: 2,
        delivery_code: 'ALB-2024-002',
        estimated_equipment_count: 3,
        delivery_date: '2024-02-25',
        carrier: 'SEUR',
        tracking_number: 'SEUR987654321',
        attached_document_path: '/documents/alb-2024-002.xlsx',
        notes: 'Equipos revisados y conformes',
        status: 'delivered', 
        created_at: new Date('2024-02-25'),
        order_code: 'PED-2024-002',
        vendor: 'Cisco Systems',
        project_name: 'Modernización BCN',
        client: 'Orange España',
        equipment_count: 3
      }
    ];
  }
  
  if (queryLower.includes('equipment') && queryLower.includes('select')) {
    return [
      {
        id: 1,
        delivery_note_id: 1,
        serial_number: 'SW001-MAD-2024',
        asset_tag: 'TEF-AST-001',
        manufacturer: 'Cisco',
        model: 'Catalyst 2960-X',
        category: 'Network Switch',
        specifications: '24 ports, PoE+, Layer 2',
        condition_status: 'new',
        location: 'Madrid DC-1, Rack A-01',
        status: 'deployed',
        created_at: new Date('2024-01-21'),
        delivery_code: 'ALB-2024-001',
        order_code: 'PED-2024-001',
        vendor: 'Tech Solutions S.L.',
        project_name: 'Expansión Red Madrid'
      },
      {
        id: 2,
        delivery_note_id: 1,
        serial_number: 'RT001-MAD-2024',
        asset_tag: 'TEF-AST-002',
        manufacturer: 'Cisco',
        model: 'ISR 4331',
        category: 'Router',
        specifications: '3 GE ports, 2 NIM slots, Security bundle',
        condition_status: 'new',
        location: 'Madrid DC-1, Rack A-02',
        status: 'testing',
        created_at: new Date('2024-01-21'),
        delivery_code: 'ALB-2024-001',
        order_code: 'PED-2024-001',
        vendor: 'Tech Solutions S.L.',
        project_name: 'Expansión Red Madrid'
      }
    ];
  }
  
  if (queryLower.includes('projects') && queryLower.includes('select')) {
    return [
      {
        id: 1,
        ritm_code: 'RITM0012345',
        project_name: 'Expansión Red Madrid',
        client: 'Telefónica España',
        datacenter: 'Madrid DC-1',
        delivery_date: '2024-12-31',
        teams_folder_url: 'https://teams.microsoft.com/folders/proyecto-madrid',
        excel_file_path: '/documents/proyecto-madrid-equipos.xlsx',
        description: 'Ampliación de infraestructura de red en datacenter principal de Madrid',
        status: 'active',
        created_at: new Date('2024-01-10'),
        orders_count: 2,
        total_orders: 8
      },
      {
        id: 2,
        ritm_code: 'RITM0012346',
        project_name: 'Modernización BCN',
        client: 'Orange España', 
        datacenter: 'Barcelona DC-2',
        delivery_date: '2024-11-15',
        teams_folder_url: 'https://teams.microsoft.com/folders/proyecto-bcn',
        excel_file_path: '/documents/proyecto-bcn-equipos.xlsx',
        description: 'Actualización de equipamiento obsoleto en Barcelona',
        status: 'active',
        created_at: new Date('2024-02-15'),
        orders_count: 1,
        total_orders: 3
      }
    ];
  }
  
  // Default empty response
  return [];
};

// Initialize database connection
connectDatabase();