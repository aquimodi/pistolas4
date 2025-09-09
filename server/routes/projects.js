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
    const { name, description, status = 'active' } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const result = await executeQuery(
      'INSERT INTO projects (name, description, status, created_by, created_at) OUTPUT INSERTED.* VALUES (@param0, @param1, @param2, @param3, GETDATE())',
      [name, description, status, req.user.id]
    );

    logger.info(`Project created: ${name} by ${req.user.username}`);
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
    const { name, description, status } = req.body;

    const result = await executeQuery(
      'UPDATE projects SET name = @param0, description = @param1, status = @param2, updated_at = GETDATE() OUTPUT INSERTED.* WHERE id = @param3',
      [name, description, status, id]
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