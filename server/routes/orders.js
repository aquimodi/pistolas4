import express from 'express';
import { executeQuery } from '../config/database.js';
import logger from '../utils/logger.js';
import { authenticate, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all orders
router.get('/', authorizeRole(['admin', 'manager', 'operator']), async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT 
        o.*, 
        p.project_name, 
        p.client,
        p.ritm_code,
        COUNT(dn.id) as delivery_notes_count
      FROM orders o
      LEFT JOIN projects p ON o.project_id = p.id
      LEFT JOIN delivery_notes dn ON dn.order_id = o.id
      GROUP BY o.id, o.project_id, o.order_code, o.equipment_count, o.vendor, 
               o.description, o.expected_delivery_date, o.status, o.created_at, o.updated_at, o.created_by,
               p.project_name, p.client, p.ritm_code
      ORDER BY o.created_at DESC
    `);
    
    logger.info(`Retrieved ${result.length} orders`);
    res.json(result);
  } catch (error) {
    logger.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get orders by project ID
router.get('/project/:projectId', authorizeRole(['admin', 'manager', 'operator']), async (req, res) => {
  try {
    const { projectId } = req.params;
    const result = await executeQuery(`
      SELECT 
        o.*, 
        p.project_name, 
        p.client,
        COUNT(dn.id) as delivery_notes_count
      FROM orders o
      LEFT JOIN projects p ON o.project_id = p.id
      LEFT JOIN delivery_notes dn ON dn.order_id = o.id
      WHERE o.project_id = @param0
      GROUP BY o.id, o.project_id, o.order_code, o.equipment_count, o.vendor, 
               o.description, o.expected_delivery_date, o.status, o.created_at, o.updated_at, o.created_by,
               p.project_name, p.client
      ORDER BY o.created_at DESC
    `, [projectId]);
    
    logger.info(`Retrieved ${result.length} orders for project ${projectId}`);
    res.json(result);
  } catch (error) {
    logger.error('Error fetching orders by project:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get order by ID
router.get('/:id', authorizeRole(['admin', 'manager', 'operator']), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await executeQuery(`
      SELECT 
        o.*, 
        p.project_name, 
        p.client,
        p.ritm_code
      FROM orders o
      LEFT JOIN projects p ON o.project_id = p.id
      WHERE o.id = @param0
    `, [id]);
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    logger.info(`Retrieved order ${id}`);
    res.json(result[0]);
  } catch (error) {
    logger.error('Error fetching order by ID:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Create order
router.post('/', authorizeRole(['admin', 'manager', 'operator']), async (req, res) => {
  try {
    const { project_id, order_code, equipment_count, vendor, description, expected_delivery_date, status = 'pending' } = req.body;

    if (!project_id || !order_code) {
      return res.status(400).json({ error: 'Project ID and order code are required' });
    }

    logger.info(`Creating order: ${order_code} for project ${project_id} by ${req.session.user ? req.session.user.username : 'unknown'}`);

    const result = await executeQuery(
      'INSERT INTO orders (project_id, order_code, equipment_count, vendor, description, expected_delivery_date, status, created_by, created_at) OUTPUT INSERTED.* VALUES (@param0, @param1, @param2, @param3, @param4, @param5, @param6, @param7, GETDATE())',
      [project_id, order_code, equipment_count || 0, vendor, description, expected_delivery_date, status, req.session.user ? req.session.user.id : 1]
    );

    logger.info(`Order created successfully: ${order_code}`);
    res.status(201).json(result[0]);
  } catch (error) {
    logger.error('Error creating order:', error);
    console.error('Create order error details:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Update order
router.put('/:id', authorizeRole(['admin', 'manager', 'operator']), async (req, res) => {
  try {
    const { id } = req.params;
    const { order_code, equipment_count, vendor, description, expected_delivery_date, status } = req.body;

    logger.info(`Updating order: ${id} by ${req.session.user ? req.session.user.username : 'unknown'}`);

    const result = await executeQuery(
      'UPDATE orders SET order_code = @param0, equipment_count = @param1, vendor = @param2, description = @param3, expected_delivery_date = @param4, status = @param5, updated_at = GETDATE() OUTPUT INSERTED.* WHERE id = @param6',
      [order_code, equipment_count || 0, vendor, description, expected_delivery_date, status, id]
    );

    if (result.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    logger.info(`Order updated successfully: ${id}`);
    res.json(result[0]);
  } catch (error) {
    logger.error('Error updating order:', error);
    console.error('Update order error details:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

export default router;