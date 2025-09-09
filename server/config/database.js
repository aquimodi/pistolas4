import sql from 'mssql';
import logger from '../utils/logger.js';

// Database configuration
const config = {
  server: process.env.DB_SERVER || 'localhost',
  port: parseInt(process.env.DB_PORT) || 1433,
  database: process.env.DB_DATABASE || 'datacenter_equipment',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'YourStrongPassword123!',
  options: {
    encrypt: false, // Set to true if using Azure
    trustServerCertificate: true,
    enableArithAbort: true,
    requestTimeout: 60000,
    connectionTimeout: 60000,
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
    }
  }
};

let pool = null;
let isConnected = false;
let mockMode = false;

// Mock data for fallback
const mockUsers = [
  { id: 1, username: 'admin', password: 'admin', email: 'admin@datacenter.com', role: 'admin' },
  { id: 2, username: 'manager', password: 'manager', email: 'manager@datacenter.com', role: 'manager' },
  { id: 3, username: 'operator', password: 'operator', email: 'operator@datacenter.com', role: 'operator' },
  { id: 4, username: 'viewer', password: 'viewer', email: 'viewer@datacenter.com', role: 'viewer' }
];

const mockProjects = [
  { id: 1, ritm_code: 'RITM0012345', project_name: 'Expansión Datacenter Fase 1', client: 'Telefónica España', datacenter: 'Madrid DC-1', status: 'active', created_at: new Date() },
  { id: 2, ritm_code: 'RITM0012346', project_name: 'Renovación Servidores 2024', client: 'BBVA', datacenter: 'Barcelona DC-2', status: 'active', created_at: new Date() }
];

export const connectDatabase = async () => {
  try {
    logger.info('🔄 Attempting to connect to SQL Server database...', {
      server: config.server,
      database: config.database,
      user: config.user,
      port: config.port
    });

    if (pool) {
      await pool.close();
    }

    pool = await sql.connect(config);
    
    // Test connection with a simple query
    await pool.request().query('SELECT 1 as test');
    
    isConnected = true;
    mockMode = false;
    logger.info('✅ Successfully connected to SQL Server database');
    
    return pool;
  } catch (error) {
    isConnected = false;
    mockMode = true;
    
    // Detailed error logging
    const errorInfo = {
      message: error.message,
      code: error.code,
      server: config.server,
      database: config.database,
      user: config.user,
      port: config.port
    };

    if (error.code === 'ECONNREFUSED') {
      logger.warn('⚠ SQL Server connection refused - Server may not be running', errorInfo);
      logger.info('💡 Solution: Start SQL Server service or check server address');
    } else if (error.code === 'ENOTFOUND') {
      logger.warn('⚠ SQL Server host not found - Check server name/IP', errorInfo);
    } else if (error.code === 'ELOGIN') {
      logger.warn('⚠ SQL Server login failed - Check credentials', errorInfo);
    } else {
      logger.warn('⚠ Failed to connect to SQL Server database', errorInfo);
    }
    
    logger.info('🔄 Switching to mock mode for API responses');
    throw error;
  }
};

export const executeQuery = async (query, params = []) => {
  if (!mockMode && pool && isConnected) {
    try {
      const request = pool.request();
      
      // Add parameters
      if (params && params.length > 0) {
        params.forEach((param, index) => {
          request.input(`param${index}`, param);
        });
      }
      
      const result = await request.query(query);
      return result.recordset || [];
    } catch (error) {
      logger.error('Database query failed:', { query, error: error.message });
      
      // Fall back to mock mode for this query
      return handleMockQuery(query, params);
    }
  }
  
  // Use mock data
  return handleMockQuery(query, params);
};

const handleMockQuery = (query, params) => {
  const queryLower = query.toLowerCase();
  
  // Reduce logging in mock mode - only log 10% of requests
  if (Math.random() < 0.1) {
    logger.debug('Using mock data for query', { query: query.substring(0, 100) + '...' });
  }
  
  // Mock responses based on query patterns
  if (queryLower.includes('users') && queryLower.includes('select')) {
    if (params && params[0]) {
      // Find user by username
      return mockUsers.filter(u => u.username === params[0]);
    }
    return mockUsers;
  }
  
  if (queryLower.includes('projects') && queryLower.includes('select')) {
    return mockProjects;
  }
  
  if (queryLower.includes('insert') && queryLower.includes('output inserted')) {
    // Return mock inserted record
    return [{ id: Math.floor(Math.random() * 1000), ...Object.fromEntries(params.map((p, i) => [`field${i}`, p])) }];
  }
  
  // Default empty response
  return [];
};

export const closeDatabase = async () => {
  try {
    if (pool) {
      await pool.close();
      pool = null;
      isConnected = false;
      logger.info('Database connection closed');
    }
  } catch (error) {
    logger.error('Error closing database connection:', error);
  }
};

// Export connection status
export const getDatabaseStatus = () => ({
  connected: isConnected,
  mockMode: mockMode,
  server: config.server,
  database: config.database
});

export default { connectDatabase, executeQuery, closeDatabase, getDatabaseStatus };