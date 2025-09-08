import dotenv from 'dotenv';

// Load environment variables FIRST, before any other imports
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import logger from './utils/logger.js';
import { connectDB } from './config/database.js';
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import orderRoutes from './routes/orders.js';
import deliveryNoteRoutes from './routes/deliveryNotes.js';
import equipmentRoutes from './routes/equipment.js';
import monitoringRoutes from './routes/monitoring.js';
import { authenticateSession } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0'; // Siempre escuchar en todas las interfaces

// Add process error handlers
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  console.error('❌ Uncaught Exception:', err.message);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  console.error('❌ Unhandled Rejection:', reason);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});
// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 500, // Aumentar límite
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Excluir rutas de verificación de autenticación del rate limiting agresivo
  skip: (req) => {
    return req.path === '/api/auth/verify' || req.path === '/health';
  }
});

// Middleware
app.use(helmet());
app.use(compression());

// CORS configuration for development and production
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:5173', // Vite dev server
    'http://localhost:3000',
    'http://localhost',
    'http://107.3.52.136',
    'https://107.3.52.136'
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(session({
  secret: process.env.SESSION_SECRET || 'datacenter_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, 
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  }
}));

app.use(limiter);
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  console.log('🏥 Health check accessed');
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Datacenter Equipment Management API', 
    status: 'running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', authenticateSession, projectRoutes);
app.use('/api/orders', authenticateSession, orderRoutes);
app.use('/api/delivery-notes', authenticateSession, deliveryNoteRoutes);
app.use('/api/equipment', authenticateSession, equipmentRoutes);
app.use('/api/monitoring', authenticateSession, monitoringRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  logger.warn(`404 - Route not found: ${req.originalUrl}`);
  console.log(`❌ 404 - Route not found: ${req.originalUrl}`);
  res.status(404).json({ error: 'Route not found' });
});

// Start server
async function startServer() {
  try {
    console.log('🚀 Starting Datacenter Equipment Management API...');
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📡 Host: ${HOST}`);
    console.log(`🔌 Port: ${PORT}`);
    
    await connectDB();
    
    app.listen(PORT, HOST, () => {
      logger.info(`Server running on port ${PORT}`);
      console.log(`🚀 Datacenter Equipment Management API running on ${HOST}:${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Database: ${process.env.DB_SERVER || 'localhost'}`);
      console.log(`🌐 Access via: http://${HOST}:${PORT}`);
      console.log(`🏥 Health check: http://${HOST}:${PORT}/health`);
      console.log(`✅ Server startup completed successfully`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

startServer();