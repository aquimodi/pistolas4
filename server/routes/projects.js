import express from 'express';
import { executeQuery } from '../config/database.js';
import logger from '../utils/logger.js';
import { authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// Get all projects
router.get('/', async (req, res) => {
  try {
    const projects = await executeQuery('SELECT * FROM projects ORDER BY created_at DESC');
    logger.debug(`Retrieved ${projects.length} projects for user: ${req.user.username}`);
    res.json(projects);
  } catch (error) {
    logger.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get project by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const projects = await executeQuery('SELECT * FROM projects WHERE id = @param0', [id]);
    
    if (projects.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    logger.debug(`Retrieved project ${id} for user: ${req.user.username}`);
    res.json(projects[0]);
  } catch (error) {
    logger.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Create project
router.post('/', authorizeRole(['admin', 'manager']), async (req, res) => {
  try {
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

    const result = await executeQuery(
      'INSERT INTO projects (ritm_code, project_name, client, datacenter, delivery_date, teams_folder_url, excel_file_path, status, created_by, created_at) OUTPUT INSERTED.* VALUES (@param0, @param1, @param2, @param3, @param4, @param5, @param6, @param7, @param8, GETDATE())',
      [ritm_code, project_name, client, datacenter, delivery_date, teams_folder_url, excel_file_path, status, req.user.id]
    );

    logger.info(`Project created: ${project_name} by ${req.user.username}`);
    res.status(201).json(result[0]);
  } catch (error) {
    logger.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update project
router.put('/:id', authorizeRole(['admin', 'manager']), async (req, res) => {
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
      [id, ritm_code, project_name, client, datacenter, delivery_date, teams_folder_url, excel_file_path, status]
    );

    if (result.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    logger.info(`Project updated: ${id} by ${req.user.username}`);
    res.json(result[0]);
  } catch (error) {
    logger.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project
router.delete('/:id', authorizeRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await executeQuery('DELETE FROM projects WHERE id = @param0', [id]);
    
    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    logger.info(`Project deleted: ${id} by ${req.user.username}`);
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    logger.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router;