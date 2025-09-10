import dotenv from 'dotenv';

dotenv.config();

console.log('🚀 Starting Datacenter Equipment Management API Server...');
console.log('📊 Environment:', process.env.NODE_ENV || 'development');
console.log('🔌 Port:', process.env.PORT || 3001);

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
// import logger from './utils/logger.js';
// import { connectDB } from './config/database.js';
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import orderRoutes from './routes/orders.js';
import deliveryNoteRoutes from './routes/deliveryNotes.js';
import equipmentRoutes from './routes/equipment.js';
import monitoringRoutes from './routes/monitoring.js';
// import { authenticateSession } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0'; // Siempre escuchar en todas las interfaces

// Add process error handlers
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  console.error('❌ Uncaught Exception:', err.message);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
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

// Special rate limiting for login endpoint
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Solo 5 intentos de login por ventana
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
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

app.use(morgan('combined'));
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
// Apply rate limiting only to login route
app.use('/api/auth/login', loginLimiter);

// Ensure auth routes are registered first
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/delivery-notes', deliveryNoteRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/monitoring', monitoringRoutes);

// Add upload routes
import uploadRoutes from './routes/upload.js';
app.use('/api/upload', uploadRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  console.warn(`404 - Route not found: ${req.originalUrl}`);
  console.log(`❌ 404 - Route not found: ${req.originalUrl}`);
  res.status(404).json({ error: 'Route not found' });
});

// Start server
async function startServer() {
  try {
    console.log('=================================');
    console.log('🚀 STARTING DATACENTER API SERVER');
    console.log('=================================');
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📡 Host: ${HOST}`);
    console.log(`🔌 Port: ${PORT}`);
    console.log(`📁 Working Directory: ${process.cwd()}`);
    console.log(`📋 Process ID: ${process.pid}`);
    console.log(`🔧 Node Version: ${process.version}`);
    console.log(`⏰ Start Time: ${new Date().toISOString()}`);
    
    console.log('Attempting database connection...');
    // await connectDB();
    console.log('Database connection skipped for now...');
    
    console.log(`Creating server on ${HOST}:${PORT}...`);
    app.listen(PORT, HOST, () => {
      console.info(`Server running on port ${PORT}`);
      console.log('=================================');
      console.log('✅ SERVER STARTED SUCCESSFULLY!');
      console.log('=================================');
      console.log(`🌐 Local Access: http://localhost:${PORT}`);
      console.log(`🌍 External Access: http://${HOST}:${PORT}`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log(`📊 Database: ${process.env.DB_SERVER || 'localhost'}`);
      console.log('=================================');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    console.error('=================================');
    console.error('❌ SERVER STARTUP FAILED!');
    console.error('=================================');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('=================================');
    process.exit(1);
  }
}

startServer();