import express from 'express';
import cors from 'cors';
import session from 'express-session';
import rateLimit from 'express-rate-limit';
import { connectDatabase } from './config/database.js';
import logger from './utils/logger.js';

// Import routes
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import orderRoutes from './routes/orders.js';
import deliveryNoteRoutes from './routes/deliveryNotes.js';
import equipmentRoutes from './routes/equipment.js';
import monitoringRoutes from './routes/monitoring.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for proper rate limiting behind nginx
app.set('trust proxy', true);

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://107.3.52.136:5173',
    'http://107.3.52.136:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
};

app.use(cors(corsOptions));

// Rate limiting with proxy support
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  trustProxy: true,
  keyGenerator: (req) => {
    // Get IP from various headers when behind proxy
    return req.ip || 
           req.headers['x-forwarded-for']?.split(',')[0] || 
           req.headers['x-real-ip'] || 
           req.connection.remoteAddress ||
           'unknown';
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'datacenter-equipment-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/delivery-notes', deliveryNoteRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/monitoring', monitoringRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Connect to database (non-blocking)
connectDatabase().catch(err => {
  logger.warn('Database connection failed during startup, continuing in mock mode');
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  logger.info('🚀 Datacenter Equipment Management API Server started');
  logger.info(`🌐 Server running on http://0.0.0.0:${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔧 Process ID: ${process.pid}`);
  logger.info(`📁 Working directory: ${process.cwd()}`);
  logger.info(`🌍 CORS origins: ${corsOptions.origin.join(', ')}`);
  console.log(`✅ Server ready and listening on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully');
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled promise rejection:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});