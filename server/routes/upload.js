import express from 'express';
import multer from 'multer';
import path from 'path';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Store files in memory for processing

const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX, and CSV files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: fileFilter
});

// Helper function to sanitize filename
const sanitizeFilename = (filename) => {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
};

// Helper function to generate unique filename
const generateUniqueFilename = (originalName, uploadType) => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  const ext = path.extname(originalName);
  const name = path.basename(originalName, ext);
  const sanitizedName = sanitizeFilename(name);
  
  return `${uploadType}_${timestamp}_${random}_${sanitizedName}${ext}`;
};

// Upload endpoint for project files
router.post('/projects', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    console.log('📁 Project file upload request received');
    console.log('User:', req.user?.username || 'unknown');
    
    if (!req.file) {
      console.log('❌ No file provided');
      return res.status(400).json({ error: 'No file provided' });
    }

    console.log('📋 File details:', {
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // Generate unique filename
    const uniqueFilename = generateUniqueFilename(req.file.originalname, 'project');
    
    // In a real implementation, you would save the file to disk or cloud storage
    // For now, we'll simulate the file path where it would be stored
    const filePath = `/uploads/projects/${uniqueFilename}`;
    
    console.log('✅ Project file processed successfully');
    console.log('Simulated file path:', filePath);
    
    // Log the upload for audit purposes
    console.log(`📊 AUDIT: User ${req.user?.username} uploaded project file: ${req.file.originalname} -> ${filePath}`);

    res.json({
      success: true,
      filePath: filePath,
      originalName: req.file.originalname,
      size: req.file.size,
      uploadType: 'project'
    });

  } catch (error) {
    console.error('💥 Error uploading project file:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to upload file',
      uploadType: 'project'
    });
  }
});

// Upload endpoint for delivery note files
router.post('/delivery_notes', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    console.log('📁 Delivery note file upload request received');
    console.log('User:', req.user?.username || 'unknown');
    
    if (!req.file) {
      console.log('❌ No file provided');
      return res.status(400).json({ error: 'No file provided' });
    }

    console.log('📋 File details:', {
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // Generate unique filename
    const uniqueFilename = generateUniqueFilename(req.file.originalname, 'delivery_note');
    
    // In a real implementation, you would save the file to disk or cloud storage
    // For now, we'll simulate the file path where it would be stored
    const filePath = `/uploads/delivery_notes/${uniqueFilename}`;
    
    console.log('✅ Delivery note file processed successfully');
    console.log('Simulated file path:', filePath);
    
    // Log the upload for audit purposes
    console.log(`📊 AUDIT: User ${req.user?.username} uploaded delivery note file: ${req.file.originalname} -> ${filePath}`);

    res.json({
      success: true,
      filePath: filePath,
      originalName: req.file.originalname,
      size: req.file.size,
      uploadType: 'delivery_note'
    });

  } catch (error) {
    console.error('💥 Error uploading delivery note file:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to upload file',
      uploadType: 'delivery_note'
    });
  }
});

// Health check endpoint for upload service
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Upload Service',
    timestamp: new Date().toISOString(),
    supportedTypes: ['PDF', 'DOC', 'DOCX', 'XLS', 'XLSX', 'CSV'],
    maxFileSize: '10MB'
  });
});

// Error handling middleware for multer errors
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    console.error('🚫 Multer error:', error);
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'File too large. Maximum file size is 10MB.' 
      });
    }
    return res.status(400).json({ 
      error: 'File upload error: ' + error.message 
    });
  }
  
  if (error.message.includes('Invalid file type')) {
    console.error('🚫 File type error:', error.message);
    return res.status(400).json({ 
      error: error.message 
    });
  }
  
  console.error('💥 Upload route error:', error);
  res.status(500).json({ 
    error: 'Upload service error' 
  });
});

export default router;