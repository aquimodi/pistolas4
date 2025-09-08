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
    idleTimeoutMillis: 30000
  },
};

let pool = null;

export async function connectDB() {
  try {
    logger.info('Attempting database connection...', {
      server: config.server,
      database: config.database,
      user: config.user
    });
    
    if (pool && pool.connected) {
      return pool;
    }
    
    pool = await sql.connect(config);
    logger.info('Connected to SQL Server successfully');
    console.log('📊 Database connection established');
    return pool;
  } catch (error) {
    logger.error('Database connection failed:', error);
    console.warn('⚠️  Database not available, using mock mode');
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
    const users = [
      { id: 1, username: 'admin', email: 'admin@datacenter.com', role: 'admin', is_active: 1, password: 'admin', created_at: new Date() },
      { id: 2, username: 'manager', email: 'manager@datacenter.com', role: 'manager', is_active: 1, password: 'manager', created_at: new Date() },
      { id: 3, username: 'operator', email: 'operator@datacenter.com', role: 'operator', is_active: 1, password: 'operator', created_at: new Date() },
      { id: 4, username: 'viewer', email: 'viewer@datacenter.com', role: 'viewer', is_active: 1, password: 'viewer', created_at: new Date() }
    ];
    console.log('📊 Mock users:', users.length);
    return users;
  }
  
  if (queryLower.includes('projects') && queryLower.includes('select')) {
    const projects = [
      { id: 1, name: 'DC Expansion Phase 1', description: 'Primary datacenter expansion with new server racks', status: 'active', created_at: new Date(), created_by: 1 },
      { id: 2, name: 'Server Refresh 2024', description: 'Annual server hardware refresh and modernization', status: 'active', created_at: new Date(), created_by: 2 },
      { id: 3, name: 'Network Upgrade Q1', description: 'Core network infrastructure upgrade', status: 'on_hold', created_at: new Date(), created_by: 1 },
      { id: 4, name: 'Storage Migration', description: 'Migration from legacy storage to new NVMe-based systems', status: 'on_hold', created_at: new Date(), created_by: 2 },
      { id: 5, name: 'Security Enhancement', description: 'Implementation of advanced security monitoring tools', status: 'completed', created_at: new Date(), created_by: 1 }
    ];
    console.log('📊 Mock projects:', projects.length);
    return projects;
  }
  
  if (queryLower.includes('orders') && queryLower.includes('select')) {
    // Detectar si es una consulta por proyecto específico
    const isProjectSpecific = queryLower.includes('project_id = @param0');
    
    const allOrders = [
      // Órdenes para proyecto 1 (DC Expansion Phase 1)
      { id: 1, project_id: 1, order_number: 'ORD-2024-001', vendor: 'Dell Technologies', description: '10x PowerEdge R750 servers', status: 'received', created_at: new Date(), project_name: 'DC Expansion Phase 1', expected_delivery_date: new Date(), created_by: 1 },
      { id: 2, project_id: 1, order_number: 'ORD-2024-002', vendor: 'HPE', description: '5x ProLiant DL380 servers', status: 'pending', created_at: new Date(), project_name: 'DC Expansion Phase 1', expected_delivery_date: new Date(), created_by: 1 },
      { id: 3, project_id: 1, order_number: 'ORD-2024-003', vendor: 'Cisco Systems', description: 'Network switches and routers', status: 'partial', created_at: new Date(), project_name: 'DC Expansion Phase 1', expected_delivery_date: new Date(), created_by: 2 },
      
      // Órdenes para proyecto 2 (Server Refresh 2024)
      { id: 4, project_id: 2, order_number: 'ORD-2024-004', vendor: 'Dell Technologies', description: '15x PowerEdge R650 servers', status: 'pending', created_at: new Date(), project_name: 'Server Refresh 2024', expected_delivery_date: new Date(), created_by: 2 },
      { id: 5, project_id: 2, order_number: 'ORD-2024-005', vendor: 'Lenovo', description: '8x ThinkSystem SR650 V3 servers', status: 'pending', created_at: new Date(), project_name: 'Server Refresh 2024', expected_delivery_date: new Date(), created_by: 1 },
      
      // Órdenes para proyecto 3 (Network Upgrade Q1)
      { id: 6, project_id: 3, order_number: 'ORD-2024-006', vendor: 'Cisco Systems', description: 'Catalyst 9000 series switches', status: 'received', created_at: new Date(), project_name: 'Network Upgrade Q1', expected_delivery_date: new Date(), created_by: 1 },
      
      // Órdenes para proyecto 4 (Storage Migration)
      { id: 7, project_id: 4, order_number: 'ORD-2024-007', vendor: 'NetApp', description: 'AFF A800 all-flash storage arrays', status: 'pending', created_at: new Date(), project_name: 'Storage Migration', expected_delivery_date: new Date(), created_by: 2 }
    ];
    
    if (isProjectSpecific) {
      // Para consultas específicas de proyecto, filtrar (mock - en realidad SQL lo haría)
      console.log('📊 Mock orders for project (showing first 3):', 3);
      return allOrders.filter(order => order.project_id === 1); // Mock para proyecto 1
    }
    
    console.log('📊 Mock all orders:', allOrders.length);
    return allOrders;
  }
  
  if (queryLower.includes('delivery_notes') && queryLower.includes('select')) {
    // Detectar el tipo de consulta
    const isOrderSpecific = queryLower.includes('order_id = @param0');
    const isAllDeliveryNotes = queryLower.includes('left join orders o on') && queryLower.includes('left join projects p on');
    
    const allDeliveryNotes = [
      // Albaranes para pedido 1 (ORD-2024-001)
      { id: 1, order_id: 1, delivery_note_number: 'DN-2024-001', delivery_date: new Date(), status: 'completed', carrier: 'FedEx', tracking_number: 'FX123456789', created_at: new Date(), order_number: 'ORD-2024-001', project_name: 'DC Expansion Phase 1', notes: 'First batch of servers', created_by: 3 },
      { id: 2, order_id: 1, delivery_note_number: 'DN-2024-002', delivery_date: new Date(), status: 'completed', carrier: 'FedEx', tracking_number: 'FX987654321', created_at: new Date(), order_number: 'ORD-2024-001', project_name: 'DC Expansion Phase 1', notes: 'Remaining servers', created_by: 3 },
      { id: 5, order_id: 1, delivery_note_number: 'DN-2024-005', delivery_date: new Date(), status: 'completed', carrier: 'FedEx', tracking_number: 'FX111222333', created_at: new Date(), order_number: 'ORD-2024-001', project_name: 'DC Expansion Phase 1', notes: 'Server accessories', created_by: 3 },
      
      // Albaranes para pedido 3 (ORD-2024-003)
      { id: 3, order_id: 3, delivery_note_number: 'DN-2024-003', delivery_date: new Date(), status: 'processing', carrier: 'UPS', tracking_number: 'UP555666777', created_at: new Date(), order_number: 'ORD-2024-003', project_name: 'DC Expansion Phase 1', notes: 'Switches delivered, routers pending', created_by: 3 },
      
      // Albaranes para pedido 6 (ORD-2024-006)
      { id: 4, order_id: 6, delivery_note_number: 'DN-2024-004', delivery_date: new Date(), status: 'completed', carrier: 'DHL', tracking_number: 'DH999888777', created_at: new Date(), order_number: 'ORD-2024-006', project_name: 'Network Upgrade Q1', notes: 'Complete network equipment', created_by: 4 }
    ];
    
    if (isAllDeliveryNotes) {
      // Para consulta de TODOS los delivery notes con joins
      console.log('📊 Mock ALL delivery notes with project info:', allDeliveryNotes.length);
      return allDeliveryNotes;
    }
    
    if (isOrderSpecific) {
      // Para consultas específicas de pedido, filtrar (mock - en realidad SQL lo haría)
      console.log('📊 Mock delivery notes for order (showing first order):', allDeliveryNotes.filter(dn => dn.order_id === 1).length);
      return allDeliveryNotes.filter(dn => dn.order_id === 1); // Mock para pedido 1
    }
    
    console.log('📊 Mock all delivery notes:', allDeliveryNotes.length);
    return allDeliveryNotes;
  }
  
  if (queryLower.includes('equipment') && queryLower.includes('select')) {
    // Detectar si es una consulta por albarán específico
    const isDeliveryNoteSpecific = queryLower.includes('delivery_note_id = @param0');
    
    const allEquipment = [
      // Equipos del albarán 1 (DN-2024-001) - Primeros servidores Dell
      { id: 1, delivery_note_id: 1, serial_number: 'DL001234', asset_tag: 'DC-SRV-001', model: 'PowerEdge R750', manufacturer: 'Dell', category: 'Server', condition_status: 'new', status: 'configured', location: 'Rack A1-U01', specifications: 'Intel Xeon Gold 6338, 64GB RAM, 2x 960GB SSD', created_at: new Date(), delivery_note_number: 'DN-2024-001', created_by: 1 },
      { id: 2, delivery_note_id: 1, serial_number: 'DL001235', asset_tag: 'DC-SRV-002', model: 'PowerEdge R750', manufacturer: 'Dell', category: 'Server', condition_status: 'new', status: 'configured', location: 'Rack A1-U03', specifications: 'Intel Xeon Gold 6338, 64GB RAM, 2x 960GB SSD', created_at: new Date(), delivery_note_number: 'DN-2024-001', created_by: 1 },
      { id: 3, delivery_note_id: 1, serial_number: 'DL001236', asset_tag: 'DC-SRV-003', model: 'PowerEdge R750', manufacturer: 'Dell', category: 'Server', condition_status: 'new', status: 'installed', location: 'Rack A1-U05', specifications: 'Intel Xeon Gold 6338, 64GB RAM, 2x 960GB SSD', created_at: new Date(), delivery_note_number: 'DN-2024-001', created_by: 1 },
      
      // Equipos del albarán 2 (DN-2024-002) - Más servidores Dell
      { id: 6, delivery_note_id: 2, serial_number: 'DL001239', asset_tag: 'DC-SRV-006', model: 'PowerEdge R750', manufacturer: 'Dell', category: 'Server', condition_status: 'new', status: 'configured', location: 'Rack A2-U01', specifications: 'Intel Xeon Gold 6338, 64GB RAM, 2x 960GB SSD', created_at: new Date(), delivery_note_number: 'DN-2024-002', created_by: 1 },
      { id: 7, delivery_note_id: 2, serial_number: 'DL001240', asset_tag: 'DC-SRV-007', model: 'PowerEdge R750', manufacturer: 'Dell', category: 'Server', condition_status: 'new', status: 'installed', location: 'Rack A2-U03', specifications: 'Intel Xeon Gold 6338, 64GB RAM, 2x 960GB SSD', created_at: new Date(), delivery_note_number: 'DN-2024-002', created_by: 1 },
      
      // Equipos del albarán 3 (DN-2024-003) - Equipos de red Cisco
      { id: 11, delivery_note_id: 3, serial_number: 'CS445566', asset_tag: 'DC-NET-001', model: 'Catalyst 9300-48P', manufacturer: 'Cisco', category: 'Network', condition_status: 'new', status: 'installed', location: 'Rack C1-U42', specifications: '48-Port Gigabit Switch with PoE+', created_at: new Date(), delivery_note_number: 'DN-2024-003', created_by: 2 },
      { id: 12, delivery_note_id: 3, serial_number: 'CS445567', asset_tag: 'DC-NET-002', model: 'Catalyst 9300-24P', manufacturer: 'Cisco', category: 'Network', condition_status: 'new', status: 'received', location: 'Rack C1-U40', specifications: '24-Port Gigabit Switch with PoE+', created_at: new Date(), delivery_note_number: 'DN-2024-003', created_by: 2 },
      
      // Equipos del albarán 4 (DN-2024-004) - Más equipos de red Cisco
      { id: 13, delivery_note_id: 4, serial_number: 'CS778899', asset_tag: 'DC-NET-003', model: 'ASR 1001-X', manufacturer: 'Cisco', category: 'Network', condition_status: 'new', status: 'configured', location: 'Rack C1-U38', specifications: 'Aggregation Services Router', created_at: new Date(), delivery_note_number: 'DN-2024-004', created_by: 2 },
      { id: 14, delivery_note_id: 4, serial_number: 'CS778900', asset_tag: 'DC-NET-004', model: 'Catalyst 9500-48Y4C', manufacturer: 'Cisco', category: 'Network', condition_status: 'new', status: 'installed', location: 'Rack C1-U36', specifications: '48-Port 25G Switch', created_at: new Date(), delivery_note_number: 'DN-2024-004', created_by: 2 },
      
      // Equipos del albarán 5 (DN-2024-005) - Accesorios
      { id: 16, delivery_note_id: 5, serial_number: 'DL-ACC-001', asset_tag: 'DC-ACC-001', model: 'PowerEdge Rail Kit', manufacturer: 'Dell', category: 'Accessory', condition_status: 'new', status: 'received', location: 'Storage Room A', specifications: 'Sliding rail kit', created_at: new Date(), delivery_note_number: 'DN-2024-005', created_by: 3 }
    ];
    
    if (isDeliveryNoteSpecific) {
      // Para consultas específicas de albarán, filtrar (mock - en realidad SQL lo haría)
      console.log('📊 Mock equipment for delivery note (showing first delivery note):', allEquipment.filter(eq => eq.delivery_note_id === 1).length);
      return allEquipment.filter(eq => eq.delivery_note_id === 1); // Mock para albarán 1
    }
    
    console.log('📊 Mock all equipment:', allEquipment.length);
    return allEquipment;
  }
  
  console.log('📊 Mock data: No matching query pattern found');
  return [];
}

export { sql };