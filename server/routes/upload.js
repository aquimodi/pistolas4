import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Function to ensure directory exists
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Created directory: ${dirPath}`);
  }
};

// Helper function to sanitize project name for directory use
const sanitizeProjectName = (projectName) => {
  if (!projectName) return 'unknown_project';
  // Replace special characters with underscores, keep spaces as underscores
  return projectName
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_') // Remove invalid filename characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .substring(0, 100); // Limit length to 100 characters
};

// Configure multer for persistent file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Get project name from request body or query
    const projectName = req.body.project_name || req.query.project_name;

    if (!projectName) {
      console.error('❌ No project_name provided in upload request');
      return cb(new Error('project_name is required for file uploads'), null);
    }

    // Sanitize project name for use in directory path
    const sanitizedProjectName = sanitizeProjectName(projectName);

    // All files go into /uploads/projects/[ProjectName]/
    const uploadDir = path.join('uploads', 'projects', sanitizedProjectName);

    // Ensure directory exists
    ensureDirectoryExists(uploadDir);

    console.log(`📁 Upload destination: ${uploadDir}`);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with format: tipo_timestamp_random_nombre_sanitizado.ext
    const uploadType = req.originalUrl.includes('/projects') ? 'project' :
                       req.originalUrl.includes('/equipment') ? 'equipment' :
                       'delivery_note';
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);

    // Sanitize filename
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9._-]/g, '_');

    const uniqueFilename = `${uploadType}_${timestamp}_${random}_${sanitizedName}${ext}`;

    console.log(`📝 Generated filename: ${uniqueFilename}`);
    cb(null, uniqueFilename);
  }
});

const fileFilter = (req, file, cb) => {
  // Allowed file types
  let allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv'
  ];
  
  // Allow images for equipment uploads
  if (req.originalUrl.includes('/equipment')) {
    allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif'
    ];
  }

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const allowedExtensions = req.originalUrl.includes('/equipment') 
      ? 'JPEG, JPG, PNG, WEBP, GIF' 
      : 'PDF, DOC, DOCX, XLS, XLSX, CSV';
    cb(new Error(`Invalid file type. Only ${allowedExtensions} files are allowed.`), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: fileFilter
});

// Upload endpoint for project files
router.post('/projects', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    console.log('📁 Project file upload request received');
    console.log('User:', req.user?.username || 'unknown');
    console.log('Project Name:', req.body.project_name);

    if (!req.file) {
      console.log('❌ No file provided');
      return res.status(400).json({ error: 'No file provided' });
    }

    console.log('📋 Project file details:', {
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      savedAs: req.file.filename,
      physicalPath: req.file.path
    });

    // Extract sanitized project name from the path
    const pathParts = req.file.path.split(path.sep);
    const projectFolder = pathParts[pathParts.length - 2]; // Get parent directory name

    // File is already saved to disk by multer in /uploads/projects/[ProjectName]/
    const publicPath = `/uploads/projects/${projectFolder}/${req.file.filename}`;

    console.log('✅ Project file processed successfully');
    console.log('📍 Physical path:', req.file.path);
    console.log('🌐 Public URL:', publicPath);

    // Log the upload for audit purposes
    console.log(`📊 AUDIT: User ${req.user?.username} uploaded project file to ${req.body.project_name}: ${req.file.originalname} -> ${publicPath}`);

    res.json({
      success: true,
      filePath: publicPath,
      originalName: req.file.originalname,
      size: req.file.size,
      uploadType: 'project',
      projectName: req.body.project_name
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
    console.log('Project Name:', req.body.project_name);

    if (!req.file) {
      console.log('❌ No file provided');
      return res.status(400).json({ error: 'No file provided' });
    }

    console.log('📋 Delivery note file details:', {
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      savedAs: req.file.filename,
      physicalPath: req.file.path
    });

    // Extract sanitized project name from the path
    const pathParts = req.file.path.split(path.sep);
    const projectFolder = pathParts[pathParts.length - 2]; // Get parent directory name

    // File is already saved to disk by multer in /uploads/projects/[ProjectName]/
    const publicPath = `/uploads/projects/${projectFolder}/${req.file.filename}`;

    console.log('✅ Delivery note file processed successfully');
    console.log('📍 Physical path:', req.file.path);
    console.log('🌐 Public URL:', publicPath);

    // Log the upload for audit purposes
    console.log(`📊 AUDIT: User ${req.user?.username} uploaded delivery note file to ${req.body.project_name}: ${req.file.originalname} -> ${publicPath}`);

    res.json({
      success: true,
      filePath: publicPath,
      originalName: req.file.originalname,
      size: req.file.size,
      uploadType: 'delivery_note',
      projectName: req.body.project_name
    });

  } catch (error) {
    console.error('💥 Error uploading delivery note file:', error);
    res.status(500).json({
      error: error.message || 'Failed to upload file',
      uploadType: 'delivery_note'
    });
  }
});

// Upload endpoint for equipment verification photos
router.post('/equipment', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    console.log('📁 Equipment verification photo upload request received');
    console.log('User:', req.user?.username || 'unknown');
    console.log('Project Name:', req.body.project_name);

    if (!req.file) {
      console.log('❌ No file provided');
      return res.status(400).json({ error: 'No file provided' });
    }

    console.log('📋 Equipment photo details:', {
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      savedAs: req.file.filename,
      physicalPath: req.file.path
    });

    // Extract sanitized project name from the path
    const pathParts = req.file.path.split(path.sep);
    const projectFolder = pathParts[pathParts.length - 2]; // Get parent directory name

    // File is already saved to disk by multer in /uploads/projects/[ProjectName]/
    const publicPath = `/uploads/projects/${projectFolder}/${req.file.filename}`;

    console.log('✅ Equipment photo processed successfully');
    console.log('📍 Physical path:', req.file.path);
    console.log('🌐 Public URL:', publicPath);

    // Log the upload for audit purposes
    console.log(`📊 AUDIT: User ${req.user?.username} uploaded equipment photo to ${req.body.project_name}: ${req.file.originalname} -> ${publicPath}`);

    res.json({
      success: true,
      filePath: publicPath,
      originalName: req.file.originalname,
      size: req.file.size,
      uploadType: 'equipment',
      projectName: req.body.project_name
    });

  } catch (error) {
    console.error('💥 Error uploading equipment photo:', error);
    res.status(500).json({
      error: error.message || 'Failed to upload file',
      uploadType: 'equipment'
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