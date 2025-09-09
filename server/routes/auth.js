import express from 'express';
import { executeQuery } from '../config/database.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      logger.warn('Login attempt with missing credentials', { ip: req.ip });
      return res.status(400).json({ error: 'Username and password are required' });
    }

    logger.info('Login attempt', { username, ip: req.ip });

    // Query user from database
    const users = await executeQuery(
      'SELECT id, username, email, password, role, is_active FROM users WHERE username = @param0',
      [username]
    );

    if (users.length === 0) {
      logger.warn('Login failed - user not found', { username, ip: req.ip });
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = users[0];

    // Check if user is active
    if (!user.is_active) {
      logger.warn('Login failed - user inactive', { username, ip: req.ip });
      return res.status(401).json({ error: 'Account is disabled' });
    }

    // Direct password comparison (plain text)
    if (password !== user.password) {
      logger.warn('Login failed - invalid password', { username, ip: req.ip });
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Update last login
    try {
      await executeQuery(
        'UPDATE users SET last_login = GETDATE() WHERE id = @param0',
        [user.id]
      );
    } catch (updateError) {
      logger.warn('Failed to update last login', { userId: user.id, error: updateError.message });
    }

    // Create session
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    logger.info('Login successful', { 
      userId: user.id, 
      username: user.username, 
      role: user.role,
      ip: req.ip 
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Login system error' });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  try {
    const userId = req.session?.user?.id;
    const username = req.session?.user?.username;
    
    req.session.destroy((err) => {
      if (err) {
        logger.error('Session destruction error:', err);
        return res.status(500).json({ error: 'Logout failed' });
      }
      
      logger.info('User logged out', { userId, username, ip: req.ip });
      res.clearCookie('connect.sid');
      res.json({ success: true, message: 'Logged out successfully' });
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ error: 'Logout system error' });
  }
});

// Verify session endpoint
router.get('/verify', (req, res) => {
  try {
    if (req.session && req.session.user) {
      logger.debug('Session verification successful', { 
        userId: req.session.user.id,
        username: req.session.user.username 
      });
      res.json({ 
        valid: true, 
        user: req.session.user 
      });
    } else {
      logger.debug('Session verification failed - no valid session', { ip: req.ip });
      res.status(401).json({ error: 'No active session' });
    }
  } catch (error) {
    logger.error('Session verification error:', error);
    res.status(500).json({ error: 'Session verification failed' });
  }
});

export default router;