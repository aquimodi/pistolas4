import express from 'express';
import { executeQuery } from '../config/database.js';
import logger from '../utils/logger.js';
import { authenticate, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all delivery notes
router.get('/', authorizeRole(['admin', 'manager', 'operator']), async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT 
        dn.*,
        o.order_code,
        o.vendor,
        p.project_name,
        p.client,
        COUNT(eq.id) as equipment_count
      FROM delivery_notes dn
      LEFT JOIN orders o ON dn.order_id = o.id
      LEFT JOIN projects p ON o.project_id = p.id
      LEFT JOIN equipment eq ON eq.delivery_note_id = dn.id
      GROUP BY dn.id, dn.order_id, dn.delivery_code, dn.estimated_equipment_count,
               dn.delivery_date, dn.carrier, dn.tracking_number, dn.attached_document_path,
               dn.notes, dn.status, dn.created_at, dn.updated_at, dn.created_by,
               o.order_code, o.vendor, p.project_name, p.client
      ORDER BY dn.created_at DESC
    `);
    
    logger.info(`Retrieved ${result.length} delivery notes`);
    res.json(result);
  } catch (error) {
    logger.error('Error fetching delivery notes:', error);
    res.status(500).json({ error: 'Failed to fetch delivery notes' });
  }
});

// Get delivery notes by order ID
router.get('/order/:orderId', authorizeRole(['admin', 'manager', 'operator']), async (req, res) => {
  try {
    const { orderId } = req.params;
    const result = await executeQuery(`
      SELECT 
        dn.*,
        o.order_code,
        o.vendor,
        p.project_name,
        COUNT(eq.id) as equipment_count
      FROM delivery_notes dn
      LEFT JOIN orders o ON dn.order_id = o.id
      LEFT JOIN projects p ON o.project_id = p.id
      LEFT JOIN equipment eq ON eq.delivery_note_id = dn.id
      WHERE dn.order_id = @param0
      GROUP BY dn.id, dn.order_id, dn.delivery_code, dn.estimated_equipment_count,
               dn.delivery_date, dn.carrier, dn.tracking_number, dn.attached_document_path,
               dn.notes, dn.status, dn.created_at, dn.updated_at, dn.created_by,
               o.order_code, o.vendor, p.project_name
      ORDER BY dn.created_at DESC
    `, [orderId]);
    
    logger.info(`Retrieved ${result.length} delivery notes for order ${orderId}`);
    res.json(result);
  } catch (error) {
    logger.error('Error fetching delivery notes by order:', error);
    res.status(500).json({ error: 'Failed to fetch delivery notes' });
  }
});

// Get delivery note by ID
router.get('/:id', authorizeRole(['admin', 'manager', 'operator']), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await executeQuery(`
      SELECT 
        dn.*,
        o.order_code,
        o.vendor,
        p.project_name,
        p.client
      FROM delivery_notes dn
      LEFT JOIN orders o ON dn.order_id = o.id
      LEFT JOIN projects p ON o.project_id = p.id
      WHERE dn.id = @param0
    `, [id]);
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Delivery note not found' });
    }
    
    logger.info(`Retrieved delivery note ${id}`);
    res.json(result[0]);
  } catch (error) {
    logger.error('Error fetching delivery note by ID:', error);
    res.status(500).json({ error: 'Failed to fetch delivery note' });
  }
});

// Create delivery note
router.post('/', authorizeRole(['admin', 'manager', 'operator']), async (req, res) => {
  try {
    const { order_id, delivery_code, estimated_equipment_count, delivery_date, carrier, tracking_number, attached_document_path, notes, status = 'received' } = req.body;

    if (!order_id || !delivery_code) {
      return res.status(400).json({ error: 'Order ID and delivery code are required' });
    }

    logger.info(`Creating delivery note: ${delivery_code} for order ${order_id} by ${req.session.user ? req.session.user.username : 'unknown'}`);

    const result = await executeQuery(
      'INSERT INTO delivery_notes (order_id, delivery_code, estimated_equipment_count, delivery_date, carrier, tracking_number, attached_document_path, notes, status, created_by, created_at) OUTPUT INSERTED.* VALUES (@param0, @param1, @param2, @param3, @param4, @param5, @param6, @param7, @param8, @param9, GETDATE())',
      [order_id, delivery_code, estimated_equipment_count || 0, delivery_date, carrier, tracking_number, attached_document_path, notes, status, req.session.user ? req.session.user.id : 1]
    );

    logger.info(`Delivery note created successfully: ${delivery_code}`);
    res.status(201).json(result[0]);
  } catch (error) {
    logger.error('Error creating delivery note:', error);
    console.error('Create delivery note error details:', error);
    res.status(500).json({ error: 'Failed to create delivery note' });
  }
});

// Update delivery note
router.put('/:id', authorizeRole(['admin', 'manager', 'operator']), async (req, res) => {
  try {
    const { id } = req.params;
    const { delivery_code, estimated_equipment_count, delivery_date, carrier, tracking_number, attached_document_path, notes, status } = req.body;

    logger.info(`Updating delivery note: ${id} by ${req.session.user ? req.session.user.username : 'unknown'}`);

    const result = await executeQuery(
      'UPDATE delivery_notes SET delivery_code = @param0, estimated_equipment_count = @param1, delivery_date = @param2, carrier = @param3, tracking_number = @param4, attached_document_path = @param5, notes = @param6, status = @param7, updated_at = GETDATE() OUTPUT INSERTED.* WHERE id = @param8',
      [delivery_code, estimated_equipment_count || 0, delivery_date, carrier, tracking_number, attached_document_path, notes, status, id]
    );

    if (result.length === 0) {
      return res.status(404).json({ error: 'Delivery note not found' });
    }

    logger.info(`Delivery note updated successfully: ${id}`);
    res.json(result[0]);
  } catch (error) {
    logger.error('Error updating delivery note:', error);
    console.error('Update delivery note error details:', error);
    res.status(500).json({ error: 'Failed to update delivery note' });
  }
});

export default router;