import express from 'express';
import { executeQuery } from '../config/database.js';
import logger from '../utils/logger.js';
import { authorizeRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/delivery-note/:deliveryNoteId', async (req, res) => {
  try {
    const { deliveryNoteId } = req.params;
    let equipment;
    try {
      equipment = await executeQuery(
        'SELECT e.*, dn.delivery_code FROM equipment e LEFT JOIN delivery_notes dn ON e.delivery_note_id = dn.id WHERE e.delivery_note_id = @param0 ORDER BY e.created_at DESC',
        [deliveryNoteId]
      );
    } catch (error) {
      logger.error('Database query failed, returning empty array:', error);
      equipment = [];
    }
    
    logger.debug(`Retrieved ${equipment.length} equipment items for delivery note ${deliveryNoteId}`);
    res.json(equipment);
  } catch (error) {
    logger.error('Error fetching equipment:', error);
    res.status(500).json({ error: 'Failed to fetch equipment' });
  }
});

router.get('/', async (req, res) => {
  try {
    let equipment;
    try {
      equipment = await executeQuery(
        'SELECT e.*, dn.delivery_code, o.order_code, p.project_name FROM equipment e LEFT JOIN delivery_notes dn ON e.delivery_note_id = dn.id LEFT JOIN orders o ON dn.order_id = o.id LEFT JOIN projects p ON o.project_id = p.id ORDER BY e.created_at DESC'
      );
    } catch (error) {
      logger.error('Database query failed, returning empty array:', error);
      equipment = [];
    }
    
    res.json(equipment);
  } catch (error) {
    logger.error('Error fetching equipment:', error);
    res.status(500).json({ error: 'Failed to fetch equipment' });
  }
});

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

    const result = await executeQuery(
      'INSERT INTO equipment (delivery_note_id, serial_number, asset_tag, manufacturer, model, category, specifications, condition_status, location, status, created_by, created_at) OUTPUT INSERTED.* VALUES (@param0, @param1, @param2, @param3, @param4, @param5, @param6, @param7, @param8, @param9, @param10, GETDATE())',
      [delivery_note_id, serial_number, asset_tag, manufacturer, model, category, specifications, condition_status, location, status, req.user.id]
    );

    logger.info(`Equipment created: ${serial_number} by ${req.user.username}`);
    res.status(201).json(result[0]);
  } catch (error) {
    logger.error('Error creating equipment:', error);
    res.status(500).json({ error: 'Failed to create equipment' });
  }
});

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

    const result = await executeQuery(
      'UPDATE equipment SET serial_number = @param0, asset_tag = @param1, manufacturer = @param2, model = @param3, category = @param4, specifications = @param5, condition_status = @param6, location = @param7, status = @param8, updated_at = GETDATE() OUTPUT INSERTED.* WHERE id = @param9',
      [serial_number, asset_tag, manufacturer, model, category, specifications, condition_status, location, status, id]
    );

    if (result.length === 0) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    logger.info(`Equipment updated: ${id} by ${req.user.username}`);
    res.json(result[0]);
  } catch (error) {
    logger.error('Error updating equipment:', error);
    res.status(500).json({ error: 'Failed to update equipment' });
  }
});

export default router;