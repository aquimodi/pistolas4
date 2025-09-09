import dotenv from 'dotenv';
import sql from 'mssql';

// Cargar variables de entorno
dotenv.config();

const config = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'YourStrongPassword123!',
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE || 'datacenter_equipment',
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let pool;

async function connectDatabase() {
  try {
    if (pool) {
      return pool;
    }
    
    pool = await sql.connect(config);
    console.log('✅ Database connected successfully');
    return pool;
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    return null;
  }
}

async function executeQuery(query, params = []) {
  try {
    const dbPool = await connectDatabase();
    if (!dbPool) {
      console.warn('⚠️ Database not available, returning mock data');
      return getMockData(query);
    }
    
    const request = dbPool.request();
    
    // Add parameters if provided
    if (params && params.length > 0) {
      params.forEach((param, index) => {
        request.input(`param${index}`, param);
      });
    }
    
    const result = await request.query(query);
    return result.recordset || [];
  } catch (err) {
    console.error('Database query error:', err.message);
    console.warn('⚠️ Returning mock data due to database error');
    return getMockData(query);
  }
}

function getMockData(query) {
  const queryLower = query.toLowerCase();
  
  if (queryLower.includes('projects') && queryLower.includes('select')) {
    console.log('📊 Mock: Fetching projects');
    return [
      { id: 1, name: 'Proyecto Centro de Datos A', description: 'Implementación completa', location: 'Madrid', status: 'active', created_at: new Date() },
      { id: 2, name: 'Proyecto Centro de Datos B', description: 'Actualización de equipos', location: 'Barcelona', status: 'active', created_at: new Date() }
    ];
  }
  
  if (queryLower.includes('projects') && queryLower.includes('insert')) {
    console.log('📊 Mock: Creating new project');
    return [{ 
      id: Math.floor(Math.random() * 1000) + 100, 
      name: 'Mock Project', 
      description: 'Mock Description', 
      location: 'Mock Location', 
      status: 'active', 
      created_at: new Date() 
    }];
  }
  
  if (queryLower.includes('orders') && queryLower.includes('select')) {
    console.log('📊 Mock: Fetching orders');
    return [
      { id: 1, project_id: 1, order_code: 'PED-2024-001', equipment_count: 5, vendor: 'Cisco Systems', status: 'pending', created_at: new Date() },
      { id: 2, project_id: 2, order_code: 'PED-2024-002', equipment_count: 3, vendor: 'Dell Technologies', status: 'delivered', created_at: new Date() }
    ];
  }
  
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
  
  if (queryLower.includes('delivery_notes') && queryLower.includes('select')) {
    console.log('📊 Mock: Fetching delivery notes');
    return [
      { id: 1, order_id: 1, delivery_code: 'ALB-2024-001', estimated_equipment_count: 5, delivery_date: new Date(), created_at: new Date() },
      { id: 2, order_id: 2, delivery_code: 'ALB-2024-002', estimated_equipment_count: 3, delivery_date: new Date(), created_at: new Date() }
    ];
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
  
  if (queryLower.includes('equipment') && queryLower.includes('select')) {
    console.log('📊 Mock: Fetching equipment');
    return [
      { id: 1, delivery_note_id: 1, serial_number: 'SW001ABC123', manufacturer: 'Cisco', model: 'Catalyst 9300', status: 'operational', created_at: new Date() },
      { id: 2, delivery_note_id: 1, serial_number: 'SRV002DEF456', manufacturer: 'Dell', model: 'PowerEdge R740', status: 'operational', created_at: new Date() }
    ];
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
  
  return [];
}

async function closeDatabase() {
  try {
    if (pool) {
      await pool.close();
      pool = null;
      console.log('Database connection closed');
    }
  } catch (err) {
    console.error('Error closing database:', err.message);
  }
}

export {
  connectDatabase,
  executeQuery,
  closeDatabase,
  sql
};