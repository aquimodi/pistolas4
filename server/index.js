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

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
});

// Middleware
app.use(helmet());
app.use(compression());

// Dynamic CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];
logger.info('CORS allowed origins:', allowedOrigins);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list or is a dynamic IP
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    
    // Allow any origin that matches the server's public IP pattern
    const serverIP = process.env.SERVER_IP || '107.3.52.136';
    const allowedPatterns = [
      `http://${serverIP}`,
      `https://${serverIP}`,
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost'
    ];
    
    if (allowedPatterns.some(pattern => origin.startsWith(pattern))) {
      return callback(null, true);
    }
    
    logger.warn('CORS blocked origin:', origin);
    const msg = 'The CORS policy for this application does not allow access from the specified Origin.';
    return callback(new Error(msg), false);
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(session({
  secret: process.env.SESSION_SECRET || 'datacenter_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));
app.use(limiter);
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
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
  res.status(404).json({ error: 'Route not found' });
});

// Start server
async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server running on port ${PORT}`);
      console.log(`🚀 Datacenter Equipment Management API running on 0.0.0.0:${PORT}`);
      console.log(`🌐 Server accessible at http://107.3.52.136:${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();