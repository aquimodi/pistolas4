import express from 'express';
const router = express.Router();
import { executeQuery } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

// Get all orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT o.*, p.name as project_name 
      FROM orders o 
      LEFT JOIN projects p ON o.project_id = p.id 
      ORDER BY o.created_at DESC
    `;
    const orders = await executeQuery(query);
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get orders by project
router.get('/project/:projectId', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const query = `
      SELECT o.*, p.name as project_name 
      FROM orders o 
      LEFT JOIN projects p ON o.project_id = p.id 
      WHERE o.project_id = @param0 
      ORDER BY o.created_at DESC
    `;
    const orders = await executeQuery(query, [projectId]);
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders for project:', error);
    res.status(500).json({ error: 'Failed to fetch orders for project' });
  }
});

// Get order by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT o.*, p.name as project_name 
      FROM orders o 
      LEFT JOIN projects p ON o.project_id = p.id 
      WHERE o.id = @param0
    `;
    const orders = await executeQuery(query, [id]);
    
    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(orders[0]);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Create new order
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { project_id, order_code, equipment_count, vendor, status } = req.body;
    
    // Validation
    if (!project_id || !order_code || !equipment_count || !vendor) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const query = `
      INSERT INTO orders (project_id, order_code, equipment_count, vendor, status, created_at)
      OUTPUT INSERTED.*
      VALUES (@param0, @param1, @param2, @param3, @param4, GETDATE())
    `;
    
    const result = await executeQuery(query, [
      project_id, 
      order_code, 
      equipment_count, 
      vendor, 
      status || 'pending'
    ]);
    
    res.status(201).json(result[0]);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Update order
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { project_id, order_code, equipment_count, vendor, status } = req.body;
    
    const query = `
      UPDATE orders 
      SET project_id = @param1, 
          order_code = @param2, 
          equipment_count = @param3, 
          vendor = @param4, 
          status = @param5,
          updated_at = GETDATE()
      OUTPUT INSERTED.*
      WHERE id = @param0
    `;
    
    const result = await executeQuery(query, [
      id, 
      project_id, 
      order_code, 
      equipment_count, 
      vendor, 
      status
    ]);
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(result[0]);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Delete order
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `DELETE FROM orders WHERE id = @param0`;
    await executeQuery(query, [id]);
    
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

export default router;