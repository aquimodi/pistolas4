import express from 'express';
import { executeQuery } from '../config/database.js';
import logger from '../utils/logger.js';
import { authenticate, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all equipment
router.get('/', authorizeRole(['admin', 'manager', 'operator']), async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT 
        eq.*,
        dn.delivery_code,
        o.order_code,
        o.vendor,
        p.project_name,
        p.client
      FROM equipment eq
      LEFT JOIN delivery_notes dn ON eq.delivery_note_id = dn.id
      LEFT JOIN orders o ON dn.order_id = o.id
      LEFT JOIN projects p ON o.project_id = p.id
      ORDER BY eq.created_at DESC
    `);
    
    logger.info(`Retrieved ${result.length} equipment items`);
    res.json(result);
  } catch (error) {
    logger.error('Error fetching equipment:', error);
    res.status(500).json({ error: 'Failed to fetch equipment' });
  }
});

// Get equipment by delivery note ID
router.get('/delivery-note/:deliveryNoteId', authorizeRole(['admin', 'manager', 'operator']), async (req, res) => {
  try {
    const { deliveryNoteId } = req.params;
    const result = await executeQuery(`
      SELECT 
        eq.*,
        dn.delivery_code,
        o.order_code,
        o.vendor,
        p.project_name
      FROM equipment eq
      LEFT JOIN delivery_notes dn ON eq.delivery_note_id = dn.id
      LEFT JOIN orders o ON dn.order_id = o.id
      LEFT JOIN projects p ON o.project_id = p.id
      WHERE eq.delivery_note_id = @param0
      ORDER BY eq.created_at DESC
    `, [deliveryNoteId]);
    
    logger.info(`Retrieved ${result.length} equipment items for delivery note ${deliveryNoteId}`);
    res.json(result);
  } catch (error) {
    logger.error('Error fetching equipment by delivery note:', error);
    res.status(500).json({ error: 'Failed to fetch equipment' });
  }
});

// Get equipment by ID
router.get('/:id', authorizeRole(['admin', 'manager', 'operator']), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await executeQuery(`
      SELECT 
        eq.*,
        dn.delivery_code,
        o.order_code,
        o.vendor,
        p.project_name
      FROM equipment eq
      LEFT JOIN delivery_notes dn ON eq.delivery_note_id = dn.id
      LEFT JOIN orders o ON dn.order_id = o.id
      LEFT JOIN projects p ON o.project_id = p.id
      WHERE eq.id = @param0
    `, [id]);
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Equipment not found' });
    }
    
    logger.info(`Retrieved equipment ${id}`);
    res.json(result[0]);
  } catch (error) {
    logger.error('Error fetching equipment by ID:', error);
    res.status(500).json({ error: 'Failed to fetch equipment' });
  }
});

// Create equipment
router.post('/', authorizeRole(['admin', 'manager', 'operator']), async (req, res) => {
  try {
    const { 
      delivery_note_id, 
      serial_number, 
      asset_tag, 
      manufacturer, 
      model, 
      category, 
      specifications, 
      condition_status, 
      location, 
      status = 'received' 
    } = req.body;

    if (!delivery_note_id || !serial_number || !manufacturer || !model) {
      return res.status(400).json({ error: 'Delivery note ID, serial number, manufacturer, and model are required' });
    }

    logger.info(`Creating equipment: ${serial_number} for delivery note ${delivery_note_id} by ${req.session.user ? req.session.user.username : 'unknown'}`);

    const result = await executeQuery(
      'INSERT INTO equipment (delivery_note_id, serial_number, asset_tag, manufacturer, model, category, specifications, condition_status, location, status, created_by, created_at) OUTPUT INSERTED.* VALUES (@param0, @param1, @param2, @param3, @param4, @param5, @param6, @param7, @param8, @param9, @param10, GETDATE())',
      [delivery_note_id, serial_number, asset_tag, manufacturer, model, category, specifications, condition_status, location, status, req.session.user ? req.session.user.id : 1]
    );

    logger.info(`Equipment created successfully: ${serial_number}`);
    res.status(201).json(result[0]);
  } catch (error) {
    logger.error('Error creating equipment:', error);
    console.error('Create equipment error details:', error);
    res.status(500).json({ error: 'Failed to create equipment' });
  }
});

// Update equipment
router.put('/:id', authorizeRole(['admin', 'manager', 'operator']), async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      serial_number, 
      asset_tag, 
      manufacturer, 
      model, 
      category, 
      specifications, 
      condition_status, 
      location, 
      status 
    } = req.body;

    logger.info(`Updating equipment: ${id} by ${req.session.user ? req.session.user.username : 'unknown'}`);

    const result = await executeQuery(
      'UPDATE equipment SET serial_number = @param0, asset_tag = @param1, manufacturer = @param2, model = @param3, category = @param4, specifications = @param5, condition_status = @param6, location = @param7, status = @param8, updated_at = GETDATE() OUTPUT INSERTED.* WHERE id = @param9',
      [serial_number, asset_tag, manufacturer, model, category, specifications, condition_status, location, status, id]
    );

    if (result.length === 0) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    logger.info(`Equipment updated successfully: ${id}`);
    res.json(result[0]);
  } catch (error) {
    logger.error('Error updating equipment:', error);
    console.error('Update equipment error details:', error);
    res.status(500).json({ error: 'Failed to update equipment' });
  }
});

export default router;