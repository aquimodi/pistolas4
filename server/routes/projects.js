import express from 'express';
import { executeQuery } from '../config/database.js';
import logger from '../utils/logger.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import { fetchServiceNowData } from '../services/almaService.js';

const router = express.Router();

// Get all projects
router.get('/', authenticateToken, async (req, res) => {
  try {
    const projects = await executeQuery('SELECT * FROM projects ORDER BY created_at DESC');
    logger.debug(`Retrieved ${projects.length} projects for user: ${req.user?.username || 'unknown'}`);
    res.json(projects);
  } catch (error) {
    logger.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get project by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const projects = await executeQuery('SELECT * FROM projects WHERE id = @param0', [id]);
    
    if (projects.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    logger.debug(`Retrieved project ${id} for user: ${req.user?.username || 'unknown'}`);
    res.json(projects[0]);
  } catch (error) {
    logger.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Create project
router.post('/', authenticateToken, authorizeRole(['admin', 'manager']), async (req, res) => {
  try {
    console.log('📋 Project creation request body:', JSON.stringify(req.body, null, 2));

    const {
      ritm_code,
      project_name,
      client,
      datacenter,
      delivery_date,
      teams_folder_url,
      excel_file_path,
      status = 'active'
    } = req.body;

    if (!ritm_code || !project_name || !client || !datacenter) {
      return res.status(400).json({ error: 'RITM code, project name, client, and datacenter are required' });
    }

    // Validate field types
    const fieldValidation = [
      { name: 'ritm_code', value: ritm_code, expectedType: 'string' },
      { name: 'project_name', value: project_name, expectedType: 'string' },
      { name: 'client', value: client, expectedType: 'string' },
      { name: 'datacenter', value: datacenter, expectedType: 'string' },
      { name: 'teams_folder_url', value: teams_folder_url, expectedType: 'string', optional: true },
      { name: 'excel_file_path', value: excel_file_path, expectedType: 'string', optional: true },
      { name: 'status', value: status, expectedType: 'string' }
    ];

    for (const field of fieldValidation) {
      if (field.value !== null && field.value !== undefined) {
        if (typeof field.value !== field.expectedType) {
          console.error(`❌ Field validation failed for ${field.name}:`, {
            expected: field.expectedType,
            actual: typeof field.value,
            value: field.value
          });
          return res.status(400).json({
            error: `Invalid data type for field '${field.name}'. Expected ${field.expectedType}, got ${typeof field.value}`,
            field: field.name,
            expectedType: field.expectedType,
            actualType: typeof field.value
          });
        }
      } else if (!field.optional) {
        console.error(`❌ Required field ${field.name} is null or undefined`);
      }
    }

    console.log('✅ All field validations passed');

    // Prepare parameters with explicit null handling
    const params = [
      ritm_code,
      project_name,
      client,
      datacenter,
      delivery_date || null,
      teams_folder_url || null,
      excel_file_path || null,
      status,
      req.user?.id || 1
    ];

    console.log('📊 Prepared parameters for INSERT:', params.map((p, i) => ({
      index: i,
      type: typeof p,
      value: p
    })));

    const result = await executeQuery(
      'INSERT INTO projects (ritm_code, project_name, client, datacenter, delivery_date, teams_folder_url, excel_file_path, status, created_by, created_at) OUTPUT INSERTED.* VALUES (@param0, @param1, @param2, @param3, @param4, @param5, @param6, @param7, @param8, GETDATE())',
      params
    );

    logger.info(`Project created: ${project_name} by ${req.user?.username || 'unknown'}`);
    res.status(201).json(result[0]);
  } catch (error) {
    logger.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update project
router.put('/:id', authenticateToken, authorizeRole(['admin', 'manager']), async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      ritm_code, 
      project_name, 
      client, 
      datacenter, 
      delivery_date, 
      teams_folder_url, 
      excel_file_path, 
      status 
    } = req.body;

    const result = await executeQuery(
      'UPDATE projects SET ritm_code = @param1, project_name = @param2, client = @param3, datacenter = @param4, delivery_date = @param5, teams_folder_url = @param6, excel_file_path = @param7, status = @param8, updated_at = GETDATE() OUTPUT INSERTED.* WHERE id = @param0',
      [
        id,
        ritm_code,
        project_name,
        client,
        datacenter,
        delivery_date || null,
        teams_folder_url || null,
        excel_file_path || null,
        status
      ]
    );

    if (result.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    logger.info(`Project updated: ${id} by ${req.user?.username || 'unknown'}`);
    res.json(result[0]);
  } catch (error) {
    logger.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project
router.delete('/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await executeQuery('DELETE FROM projects WHERE id = @param0', [id]);
    
    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    logger.info(`Project deleted: ${id} by ${req.user?.username || 'unknown'}`);
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    logger.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Fetch project data from ServiceNow
router.post('/fetch-from-servicenow', authenticateToken, async (req, res) => {
  try {
    const { ritm_code } = req.body;

    if (!ritm_code) {
      return res.status(400).json({ error: 'RITM code is required' });
    }

    // Validate RITM format
    if (!ritm_code.match(/^RITM\d{4,}$/)) {
      return res.status(400).json({ 
        error: 'Invalid RITM format. Must start with "RITM" followed by numbers.' 
      });
    }

    console.log(`🔍 Fetching ServiceNow data for RITM: ${ritm_code} by user: ${req.user?.username}`);

    // Check if RITM already exists in database
    const existingProjects = await executeQuery(
      'SELECT id, ritm_code, project_name FROM projects WHERE ritm_code = @param0',
      [ritm_code]
    );

    if (existingProjects.length > 0) {
      return res.status(409).json({ 
        error: `RITM ${ritm_code} already exists in the system as project: ${existingProjects[0].project_name}`,
        existing_project: existingProjects[0]
      });
    }

    // Fetch data from ServiceNow
    const serviceNowData = await fetchServiceNowData(ritm_code);

    logger.info(`ServiceNow data fetched successfully for RITM: ${ritm_code} by ${req.user?.username}`);

    res.json({
      success: true,
      data: serviceNowData,
      message: 'Project data fetched from ServiceNow successfully'
    });

  } catch (error) {
    console.error('❌ ServiceNow fetch error:', error.message);
    logger.error(`ServiceNow fetch error for user ${req.user?.username}: ${error.message}`);
    
    // Return appropriate error based on error type
    if (error.message.includes('Authentication failed')) {
      return res.status(401).json({ error: error.message });
    }
    if (error.message.includes('Access denied')) {
      return res.status(403).json({ error: error.message });
    }
    if (error.message.includes('No data found')) {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch project data from ServiceNow',
      details: error.message 
    });
  }
});

export default router;