import express from 'express';
const router = express.Router();
import { executeQuery } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

// Get all delivery notes
router.get('/', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT dn.*, o.order_code, p.project_name
      FROM delivery_notes dn
      LEFT JOIN orders o ON dn.order_id = o.id
      LEFT JOIN projects p ON o.project_id = p.id
      ORDER BY dn.created_at DESC
    `;
    const deliveryNotes = await executeQuery(query);
    res.json(deliveryNotes);
  } catch (error) {
    console.error('Error fetching delivery notes:', error);
    res.status(500).json({ error: 'Failed to fetch delivery notes' });
  }
});

// Get delivery notes by order
router.get('/order/:orderId', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const query = `
      SELECT dn.*, o.order_code, p.project_name
      FROM delivery_notes dn
      LEFT JOIN orders o ON dn.order_id = o.id
      LEFT JOIN projects p ON o.project_id = p.id
      WHERE dn.order_id = @param0
      ORDER BY dn.created_at DESC
    `;
    const deliveryNotes = await executeQuery(query, [orderId]);
    res.json(deliveryNotes);
  } catch (error) {
    console.error('Error fetching delivery notes for order:', error);
    res.status(500).json({ error: 'Failed to fetch delivery notes for order' });
  }
});

// Get delivery note by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT dn.*, o.order_code, p.project_name
      FROM delivery_notes dn
      LEFT JOIN orders o ON dn.order_id = o.id
      LEFT JOIN projects p ON o.project_id = p.id
      WHERE dn.id = @param0
    `;
    const deliveryNotes = await executeQuery(query, [id]);
    
    if (deliveryNotes.length === 0) {
      return res.status(404).json({ error: 'Delivery note not found' });
    }
    
    res.json(deliveryNotes[0]);
  } catch (error) {
    console.error('Error fetching delivery note:', error);
    res.status(500).json({ error: 'Failed to fetch delivery note' });
  }
});

// Create new delivery note
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { 
      order_id, 
      delivery_code, 
      estimated_equipment_count, 
      delivery_date, 
      carrier,
      tracking_number,
      attached_document_path,
      notes 
    } = req.body;
    
    // Validation
    if (!order_id || !delivery_code || estimated_equipment_count === undefined || !delivery_date) {
      return res.status(400).json({ error: 'Order ID, delivery code, estimated equipment count, and delivery date are required' });
    }
    
    const query = `
      INSERT INTO delivery_notes (
        order_id, 
        delivery_code, 
        estimated_equipment_count, 
        delivery_date, 
        carrier,
        tracking_number,
        attached_document_path,
        notes, 
        created_by,
        created_at
      )
      OUTPUT INSERTED.*
      VALUES (@param0, @param1, @param2, @param3, @param4, @param5, @param6, @param7, @param8, GETDATE())
    `;
    
    const result = await executeQuery(query, [
      order_id,
      delivery_code,
      estimated_equipment_count,
      delivery_date,
      carrier,
      tracking_number,
      attached_document_path,
      notes || '',
      req.user?.id || 1
    ]);
    
    res.status(201).json(result[0]);
  } catch (error) {
    console.error('Error creating delivery note:', error);
    res.status(500).json({ error: 'Failed to create delivery note' });
  }
});

// Update delivery note
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      order_id, 
      delivery_code, 
      estimated_equipment_count, 
      delivery_date, 
      carrier,
      tracking_number,
      attached_document_path,
      notes 
    } = req.body;
    
    const query = `
      UPDATE delivery_notes 
      SET order_id = @param1,
          delivery_code = @param2,
          estimated_equipment_count = @param3,
          delivery_date = @param4,
          carrier = @param5,
          tracking_number = @param6,
          attached_document_path = @param7,
          notes = @param8,
          updated_at = GETDATE()
      OUTPUT INSERTED.*
      WHERE id = @param0
    `;
    
    const result = await executeQuery(query, [
      id,
      order_id,
      delivery_code,
      estimated_equipment_count,
      delivery_date,
      carrier,
      tracking_number,
      attached_document_path,
      notes
    ]);
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Delivery note not found' });
    }
    
    res.json(result[0]);
  } catch (error) {
    console.error('Error updating delivery note:', error);
    res.status(500).json({ error: 'Failed to update delivery note' });
  }
});

// Delete delivery note
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `DELETE FROM delivery_notes WHERE id = @param0`;
    await executeQuery(query, [id]);
    
    res.json({ message: 'Delivery note deleted successfully' });
  } catch (error) {
    console.error('Error deleting delivery note:', error);
    res.status(500).json({ error: 'Failed to delete delivery note' });
  }
});

export default router;