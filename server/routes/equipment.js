import express from 'express';
const router = express.Router();
import { executeQuery } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

// Get all equipment
router.get('/', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT e.*, dn.delivery_code, o.order_code, p.project_name
      FROM equipment e
      LEFT JOIN delivery_notes dn ON e.delivery_note_id = dn.id
      LEFT JOIN orders o ON dn.order_id = o.id
      LEFT JOIN projects p ON o.project_id = p.id
      ORDER BY e.created_at DESC
    `;
    const equipment = await executeQuery(query);
    res.json(equipment);
  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({ error: 'Failed to fetch equipment' });
  }
});

// Get equipment by delivery note
router.get('/delivery-note/:deliveryNoteId', authenticateToken, async (req, res) => {
  try {
    const { deliveryNoteId } = req.params;
    const query = `
      SELECT e.*, dn.delivery_code, o.order_code, p.project_name
      FROM equipment e
      LEFT JOIN delivery_notes dn ON e.delivery_note_id = dn.id
      LEFT JOIN orders o ON dn.order_id = o.id
      LEFT JOIN projects p ON o.project_id = p.id
      WHERE e.delivery_note_id = @param0
      ORDER BY e.created_at DESC
    `;
    const equipment = await executeQuery(query, [deliveryNoteId]);
    res.json(equipment);
  } catch (error) {
    console.error('Error fetching equipment for delivery note:', error);
    res.status(500).json({ error: 'Failed to fetch equipment for delivery note' });
  }
});

// Get equipment by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT e.*, dn.delivery_code, o.order_code, p.project_name
      FROM equipment e
      LEFT JOIN delivery_notes dn ON e.delivery_note_id = dn.id
      LEFT JOIN orders o ON dn.order_id = o.id
      LEFT JOIN projects p ON o.project_id = p.id
      WHERE e.id = @param0
    `;
    const equipment = await executeQuery(query, [id]);
    
    if (equipment.length === 0) {
      return res.status(404).json({ error: 'Equipment not found' });
    }
    
    res.json(equipment[0]);
  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({ error: 'Failed to fetch equipment' });
  }
});

// Create new equipment
router.post('/', authenticateToken, async (req, res) => {
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
      status 
    } = req.body;
    
    // Validation
    if (!delivery_note_id || !serial_number || !manufacturer || !model) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const query = `
      INSERT INTO equipment (
        delivery_note_id, 
        serial_number, 
        asset_tag,
        manufacturer, 
        model, 
        category, 
        specifications, 
        condition_status,
        location,
        status, 
        created_by,
        created_at
      )
      OUTPUT INSERTED.*
      VALUES (@param0, @param1, @param2, @param3, @param4, @param5, @param6, @param7, @param8, @param9, @param10, GETDATE())
    `;
    
    const result = await executeQuery(query, [
      delivery_note_id,
      serial_number,
      asset_tag,
      manufacturer,
      model,
      category,
      specifications || '',
      condition_status || 'new',
      location,
      status || 'received',
      req.user?.id || 1
    ]);
    
    res.status(201).json(result[0]);
  } catch (error) {
    console.error('Error creating equipment:', error);
    res.status(500).json({ error: 'Failed to create equipment' });
  }
});

// Update equipment
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
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
      status,
      verification_photo_path
    } = req.body;
    
    const query = `
      UPDATE equipment 
      SET delivery_note_id = @param1,
          serial_number = @param2,
          asset_tag = @param3,
          manufacturer = @param4,
          model = @param5,
          category = @param6,
          specifications = @param7,
          condition_status = @param8,
          location = @param9,
          status = @param10,
          verification_photo_path = @param11,
          updated_at = GETDATE()
      OUTPUT INSERTED.*
      WHERE id = @param0
    `;
    
    const result = await executeQuery(query, [
      id,
      delivery_note_id,
      serial_number,
      asset_tag,
      manufacturer,
      model,
      category,
      specifications,
      condition_status,
      location,
      status,
      verification_photo_path
    ]);
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Equipment not found' });
    }
    
    res.json(result[0]);
  } catch (error) {
    console.error('Error updating equipment:', error);
    res.status(500).json({ error: 'Failed to update equipment' });
  }
});

// Delete equipment
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `DELETE FROM equipment WHERE id = @param0`;
    await executeQuery(query, [id]);
    
    res.json({ message: 'Equipment deleted successfully' });
  } catch (error) {
    console.error('Error deleting equipment:', error);
    res.status(500).json({ error: 'Failed to delete equipment' });
  }
});

// Verify equipment by serial number
router.post('/verify', authenticateToken, async (req, res) => {
  try {
    const { serial_number, delivery_note_id, verification_photo_path } = req.body;

    if (!serial_number || !delivery_note_id) {
      return res.status(400).json({ error: 'Serial number and delivery note ID are required for verification.' });
    }

    // Find the equipment by serial number and delivery note ID
    const equipment = await executeQuery(
      'SELECT id, is_verified FROM equipment WHERE serial_number = @param0 AND delivery_note_id = @param1',
      [serial_number, delivery_note_id]
    );

    if (equipment.length === 0) {
      return res.status(404).json({ error: 'Equipment not found in this delivery note.' });
    }

    if (equipment[0].is_verified) {
      return res.status(200).json({ message: 'Equipment already verified.', equipment: equipment[0] });
    }

    // Update is_verified status
    const result = await executeQuery(`
      UPDATE equipment SET is_verified = 1, verification_photo_path = @param1, updated_at = GETDATE() OUTPUT INSERTED.* WHERE id = @param0`,
      [equipment[0].id]
    );

    // Verificar y actualizar estado del albarán después de la verificación
    await checkAndUpdateDeliveryNoteStatus(delivery_note_id);

    res.json({ message: 'Equipment verified successfully.', equipment: result[0] });
  } catch (error) {
    console.error('Error verifying equipment:', error);
    res.status(500).json({ error: 'Failed to verify equipment.' });
  }
});

// Unverify equipment by ID (for "Deshacer" functionality)
router.post('/unverify/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Obtener delivery_note_id antes de desverificar
    const equipmentData = await executeQuery('SELECT delivery_note_id FROM equipment WHERE id = @param0', [id]);
    
    const result = await executeQuery('UPDATE equipment SET is_verified = 0, updated_at = GETDATE() OUTPUT INSERTED.* WHERE id = @param0', [id]);
    
    // Verificar y actualizar estado del albarán después de la desverificación
    if (equipmentData.length > 0) {
      await checkAndUpdateDeliveryNoteStatus(equipmentData[0].delivery_note_id);
    }
    
    res.json({ message: 'Equipment unverified successfully.', equipment: result[0] });
  } catch (error) {
    console.error('Error un-verifying equipment:', error);
    res.status(500).json({ error: 'Failed to un-verify equipment.' });
  }
});

export default router;