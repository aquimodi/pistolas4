import express from 'express';
import logger from '../utils/logger.js';
import { authorizeRole } from '../middleware/auth.js';
import fs from 'fs/promises';
import path from 'path';

const router = express.Router();

// Get system status
router.get('/status', async (req, res) => {
  try {
    const status = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version,
      environment: process.env.NODE_ENV || 'development',
      database: 'connected' // This would check actual DB connection in production
    };
    
    res.json(status);
  } catch (error) {
    logger.error('Error getting system status:', error);
    res.status(500).json({ error: 'Failed to get system status' });
  }
});

// Get API call logs
router.get('/logs', authorizeRole(['admin']), async (req, res) => {
  try {
    const { limit = 100, level = 'all' } = req.query;
    
    // In a real implementation, you'd read from actual log files
    const logs = [
      { timestamp: new Date().toISOString(), level: 'info', message: 'User login successful: admin', ip: '192.168.1.100' },
      { timestamp: new Date().toISOString(), level: 'warn', message: 'Failed login attempt', ip: '192.168.1.101' },
      { timestamp: new Date().toISOString(), level: 'info', message: 'Equipment created: DL001234', ip: '192.168.1.100' },
      { timestamp: new Date().toISOString(), level: 'error', message: 'Database connection timeout', ip: '192.168.1.102' }
    ];
    
    res.json(logs.slice(0, parseInt(limit)));
  } catch (error) {
    logger.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// Get performance metrics
router.get('/metrics', authorizeRole(['admin', 'manager']), async (req, res) => {
  try {
    const metrics = {
      requests_per_minute: Math.floor(Math.random() * 50) + 10,
      average_response_time: Math.floor(Math.random() * 200) + 50,
      error_rate: Math.random() * 2,
      active_users: Math.floor(Math.random() * 20) + 5,
      database_connections: Math.floor(Math.random() * 8) + 2,
      memory_usage: process.memoryUsage().heapUsed / 1024 / 1024
    };
    
    res.json(metrics);
  } catch (error) {
    logger.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

export default router;