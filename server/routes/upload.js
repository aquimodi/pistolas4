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

// Use memory storage first, then save to disk after we have project_name from req.body
const storage = multer.memoryStorage();

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
    console.log('Project Name Length:', req.body.project_name?.length || 0);
    console.log('Project Name Trimmed:', req.body.project_name?.trim() || '');

    if (!req.file) {
      console.log('❌ No file provided');
      return res.status(400).json({ error: 'No file provided' });
    }

    // Validate project_name
    const projectName = req.body.project_name;
    if (!projectName) {
      console.error('❌ No project_name provided');
      return res.status(400).json({ error: 'project_name is required for file uploads' });
    }

    const trimmedProjectName = projectName.trim();
    if (trimmedProjectName.length < 3) {
      console.error(`❌ project_name too short: "${projectName}" (length: ${trimmedProjectName.length})`);
      return res.status(400).json({ error: 'project_name must be at least 3 characters long' });
    }

    if (trimmedProjectName.length > 100) {
      console.error(`❌ project_name too long: "${projectName}" (length: ${trimmedProjectName.length})`);
      return res.status(400).json({ error: 'project_name must be less than 100 characters' });
    }

    // Sanitize project name for directory
    const sanitizedProjectName = sanitizeProjectName(trimmedProjectName);
    if (!sanitizedProjectName || sanitizedProjectName === 'unknown_project') {
      console.error(`❌ Invalid project_name after sanitization: "${projectName}" -> "${sanitizedProjectName}"`);
      return res.status(400).json({ error: 'project_name contains invalid characters or is empty' });
    }

    console.log('📋 Project file details:', {
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      buffer: req.file.buffer ? 'Present' : 'Missing'
    });

    // Create directory structure
    const uploadDir = path.join('uploads', 'projects', sanitizedProjectName);
    ensureDirectoryExists(uploadDir);

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const ext = path.extname(req.file.originalname);
    const nameWithoutExt = path.basename(req.file.originalname, ext);
    const sanitizedFileName = nameWithoutExt.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueFilename = `project_${timestamp}_${random}_${sanitizedFileName}${ext}`;

    // Save file from buffer to disk
    const filePath = path.join(uploadDir, uniqueFilename);
    fs.writeFileSync(filePath, req.file.buffer);

    // Public path for accessing the file
    const publicPath = `/uploads/projects/${sanitizedProjectName}/${uniqueFilename}`;

    console.log('✅ Project file processed successfully');
    console.log('📂 Project Folder Created:', sanitizedProjectName);
    console.log('📍 Physical path:', filePath);
    console.log('🌐 Public URL:', publicPath);

    // Log the upload for audit purposes
    console.log(`📊 AUDIT: User ${req.user?.username} uploaded project file to "${projectName}" (folder: ${sanitizedProjectName}): ${req.file.originalname} -> ${publicPath}`);

    res.json({
      success: true,
      filePath: publicPath,
      originalName: req.file.originalname,
      size: req.file.size,
      uploadType: 'project',
      projectName: projectName,
      projectFolder: sanitizedProjectName
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

    // Validate project_name
    const projectName = req.body.project_name;
    if (!projectName) {
      console.error('❌ No project_name provided');
      return res.status(400).json({ error: 'project_name is required for file uploads' });
    }

    const trimmedProjectName = projectName.trim();
    if (trimmedProjectName.length < 3) {
      console.error(`❌ project_name too short: "${projectName}"`);
      return res.status(400).json({ error: 'project_name must be at least 3 characters long' });
    }

    // Sanitize project name for directory
    const sanitizedProjectName = sanitizeProjectName(trimmedProjectName);
    if (!sanitizedProjectName || sanitizedProjectName === 'unknown_project') {
      console.error(`❌ Invalid project_name: "${projectName}"`);
      return res.status(400).json({ error: 'project_name contains invalid characters or is empty' });
    }

    console.log('📋 Delivery note file details:', {
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      buffer: req.file.buffer ? 'Present' : 'Missing'
    });

    // Create directory structure
    const uploadDir = path.join('uploads', 'projects', sanitizedProjectName);
    ensureDirectoryExists(uploadDir);

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const ext = path.extname(req.file.originalname);
    const nameWithoutExt = path.basename(req.file.originalname, ext);
    const sanitizedFileName = nameWithoutExt.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueFilename = `delivery_note_${timestamp}_${random}_${sanitizedFileName}${ext}`;

    // Save file from buffer to disk
    const filePath = path.join(uploadDir, uniqueFilename);
    fs.writeFileSync(filePath, req.file.buffer);

    // Public path for accessing the file
    const publicPath = `/uploads/projects/${sanitizedProjectName}/${uniqueFilename}`;

    console.log('✅ Delivery note file processed successfully');
    console.log('📍 Physical path:', filePath);
    console.log('🌐 Public URL:', publicPath);

    // Log the upload for audit purposes
    console.log(`📊 AUDIT: User ${req.user?.username} uploaded delivery note file to "${projectName}": ${req.file.originalname} -> ${publicPath}`);

    res.json({
      success: true,
      filePath: publicPath,
      originalName: req.file.originalname,
      size: req.file.size,
      uploadType: 'delivery_note',
      projectName: projectName
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

    // Validate project_name
    const projectName = req.body.project_name;
    if (!projectName) {
      console.error('❌ No project_name provided');
      return res.status(400).json({ error: 'project_name is required for file uploads' });
    }

    const trimmedProjectName = projectName.trim();
    if (trimmedProjectName.length < 3) {
      console.error(`❌ project_name too short: "${projectName}"`);
      return res.status(400).json({ error: 'project_name must be at least 3 characters long' });
    }

    // Sanitize project name for directory
    const sanitizedProjectName = sanitizeProjectName(trimmedProjectName);
    if (!sanitizedProjectName || sanitizedProjectName === 'unknown_project') {
      console.error(`❌ Invalid project_name: "${projectName}"`);
      return res.status(400).json({ error: 'project_name contains invalid characters or is empty' });
    }

    console.log('📋 Equipment photo details:', {
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      buffer: req.file.buffer ? 'Present' : 'Missing'
    });

    // Create directory structure
    const uploadDir = path.join('uploads', 'projects', sanitizedProjectName);
    ensureDirectoryExists(uploadDir);

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const ext = path.extname(req.file.originalname);
    const nameWithoutExt = path.basename(req.file.originalname, ext);
    const sanitizedFileName = nameWithoutExt.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueFilename = `equipment_${timestamp}_${random}_${sanitizedFileName}${ext}`;

    // Save file from buffer to disk
    const filePath = path.join(uploadDir, uniqueFilename);
    fs.writeFileSync(filePath, req.file.buffer);

    // Public path for accessing the file
    const publicPath = `/uploads/projects/${sanitizedProjectName}/${uniqueFilename}`;

    console.log('✅ Equipment photo processed successfully');
    console.log('📍 Physical path:', filePath);
    console.log('🌐 Public URL:', publicPath);

    // Log the upload for audit purposes
    console.log(`📊 AUDIT: User ${req.user?.username} uploaded equipment photo to "${projectName}": ${req.file.originalname} -> ${publicPath}`);

    res.json({
      success: true,
      filePath: publicPath,
      originalName: req.file.originalname,
      size: req.file.size,
      uploadType: 'equipment',
      projectName: projectName
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
