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
    throw error;
  }
}

export async function executeQuery(query, params = []) {
  try {
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

export { sql };