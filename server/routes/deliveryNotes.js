import express from 'express';
import { executeQuery } from '../config/database.js';
import logger from '../utils/logger.js';
import { authorizeRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const deliveryNotes = await executeQuery(
      'SELECT dn.*, o.order_code FROM delivery_notes dn LEFT JOIN orders o ON dn.order_id = o.id WHERE dn.order_id = @param0 ORDER BY dn.created_at DESC',
      [orderId]
    );
    
    logger.debug(`Retrieved ${deliveryNotes.length} delivery notes for order ${orderId}`);
    res.json(deliveryNotes);
  } catch (error) {
    logger.error('Error fetching delivery notes:', error);
    res.status(500).json({ error: 'Failed to fetch delivery notes' });
  }
});

router.post('/', authorizeRole(['admin', 'manager', 'operator']), async (req, res) => {
  try {
    const { 
      order_id, 
      delivery_code, 
      estimated_equipment_count, 
      delivery_date, 
      carrier, 
      tracking_number, 
      attached_document_path, 
      notes, 
      status = 'received' 
    } = req.body;

    if (!order_id || !delivery_code || !estimated_equipment_count) {
      return res.status(400).json({ error: 'Order ID, delivery code, and estimated equipment count are required' });
    }

    const result = await executeQuery(
      'INSERT INTO delivery_notes (order_id, delivery_code, estimated_equipment_count, delivery_date, carrier, tracking_number, attached_document_path, notes, status, created_by, created_at) OUTPUT INSERTED.* VALUES (@param0, @param1, @param2, @param3, @param4, @param5, @param6, @param7, @param8, @param9, GETDATE())',
      [order_id, delivery_code, estimated_equipment_count, delivery_date, carrier, tracking_number, attached_document_path, notes, status, req.user.id]
    );

    logger.info(`Delivery note created: ${delivery_code} by ${req.user.username}`);
    res.status(201).json(result[0]);
  } catch (error) {
    logger.error('Error creating delivery note:', error);
    res.status(500).json({ error: 'Failed to create delivery note' });
  }
});

router.put('/:id', authorizeRole(['admin', 'manager', 'operator']), async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      delivery_code, 
      estimated_equipment_count, 
      delivery_date, 
      carrier, 
      tracking_number, 
      attached_document_path, 
      notes, 
      status 
    } = req.body;

    const result = await executeQuery(
      'UPDATE delivery_notes SET delivery_code = @param0, estimated_equipment_count = @param1, delivery_date = @param2, carrier = @param3, tracking_number = @param4, attached_document_path = @param5, notes = @param6, status = @param7, updated_at = GETDATE() OUTPUT INSERTED.* WHERE id = @param8',
      [delivery_code, estimated_equipment_count, delivery_date, carrier, tracking_number, attached_document_path, notes, status, id]
    );

    if (result.length === 0) {
      return res.status(404).json({ error: 'Delivery note not found' });
    }

    logger.info(`Delivery note updated: ${id} by ${req.user.username}`);
    res.json(result[0]);
  } catch (error) {
    logger.error('Error updating delivery note:', error);
    res.status(500).json({ error: 'Failed to update delivery note' });
  }
});

export default router;