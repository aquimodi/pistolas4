import express from 'express';
import { executeQuery } from '../config/database.js';
import logger from '../utils/logger.js';
import { authorizeRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const orders = await executeQuery(
      'SELECT o.*, p.project_name FROM orders o LEFT JOIN projects p ON o.project_id = p.id WHERE o.project_id = @param0 ORDER BY o.created_at DESC',
      [projectId]
    );
    
    logger.debug(`Retrieved ${orders.length} orders for project ${projectId}`);
    res.json(orders);
  } catch (error) {
    logger.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.get('/', async (req, res) => {
  try {
    const orders = await executeQuery(
      'SELECT o.*, p.project_name FROM orders o LEFT JOIN projects p ON o.project_id = p.id ORDER BY o.created_at DESC'
    );
    res.json(orders);
  } catch (error) {
    logger.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.post('/', authorizeRole(['admin', 'manager', 'operator']), async (req, res) => {
  try {
    const { 
      project_id, 
      order_code, 
      equipment_count, 
      vendor, 
      description, 
      expected_delivery_date, 
      status = 'pending' 
    } = req.body;

    if (!project_id || !order_code || !equipment_count) {
      return res.status(400).json({ error: 'Project ID, order code, and equipment count are required' });
    }

    const result = await executeQuery(
      'INSERT INTO orders (project_id, order_code, equipment_count, vendor, description, expected_delivery_date, status, created_by, created_at) OUTPUT INSERTED.* VALUES (@param0, @param1, @param2, @param3, @param4, @param5, @param6, @param7, GETDATE())',
      [project_id, order_code, equipment_count, vendor, description, expected_delivery_date, status, req.user.id]
    );

    logger.info(`Order created: ${order_code} by ${req.user.username}`);
    res.status(201).json(result[0]);
  } catch (error) {
    logger.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

router.put('/:id', authorizeRole(['admin', 'manager', 'operator']), async (req, res) => {
  try {
    const { id } = req.params;
    const { order_code, equipment_count, vendor, description, expected_delivery_date, status } = req.body;

    const result = await executeQuery(
      'UPDATE orders SET order_code = @param0, equipment_count = @param1, vendor = @param2, description = @param3, expected_delivery_date = @param4, status = @param5, updated_at = GETDATE() OUTPUT INSERTED.* WHERE id = @param6',
      [order_code, equipment_count, vendor, description, expected_delivery_date, status, id]
    );

    if (result.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    logger.info(`Order updated: ${id} by ${req.user.username}`);
    res.json(result[0]);
  } catch (error) {
    logger.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

export default router;