import express from 'express';
import { executeQuery } from '../config/database.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Get user from database
    const users = await executeQuery(
      'SELECT id, username, email, password_hash, role, is_active FROM users WHERE username = @param0',
      [username]
    );

    if (users.length === 0) {
      logger.warn(`Login attempt with invalid username: ${username} from ${req.ip}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    if (!user.is_active) {
      logger.warn(`Login attempt with inactive account: ${username} from ${req.ip}`);
      return res.status(401).json({ error: 'Account is inactive' });
    }

    // Simple password comparison (in production, implement proper hashing)
    const isValidPassword = password === 'admin' || password === 'operator';

    if (!isValidPassword) {
      logger.warn(`Login attempt with invalid password for user: ${username} from ${req.ip}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Store user in session
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    // Update last login
    await executeQuery(
      'UPDATE users SET last_login = GETDATE() WHERE id = @param0',
      [user.id]
    );

    logger.info(`Successful login: ${username} (${user.role}) from ${req.ip}`);

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  logger.info(`Logout request from ${req.ip}`);
  req.session.destroy((err) => {
    if (err) {
      logger.error('Session destroy error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

// Verify session
router.get('/verify', (req, res) => {
  if (req.session.user) {
    res.json({ valid: true, user: req.session.user });
  } else {
    res.status(401).json({ error: 'No active session' });
  }
});

export default router;