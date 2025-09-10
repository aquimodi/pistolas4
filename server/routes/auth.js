import express from 'express';
import { executeQuery } from '../config/database.js';
// import logger from '../utils/logger.js';

const router = express.Router();

// Simple console logging instead of logger for now
const log = {
  info: (msg) => console.log('INFO:', msg),
  warn: (msg) => console.warn('WARN:', msg),
  error: (msg) => console.error('ERROR:', msg)
};

// Login
router.post('/login', async (req, res) => {
  try {
    console.log('🔐 Login attempt received:', { username: req.body.username });
    
    const { username, password } = req.body;

    if (!username || !password) {
      console.log('❌ Missing credentials');
      return res.status(400).json({ error: 'Username and password required' });
    }

    console.log('🔍 Searching for user:', username);
    
    // Get user from database
    const users = await executeQuery(
      'SELECT id, username, email, password, role, is_active FROM users WHERE username = @param0',
      [username]
    );

    console.log('📊 Database query result:', { found: users.length > 0, user: users[0]?.username });
    
    if (users.length === 0) {
      log.warn(`Login attempt with invalid username: ${username} from ${req.ip}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    console.log('👤 User found:', { id: user.id, username: user.username, role: user.role, active: user.is_active });

    if (!user.is_active) {
      log.warn(`Login attempt with inactive account: ${username} from ${req.ip}`);
      return res.status(401).json({ error: 'Account is inactive' });
    }

    // Direct password comparison (PLAIN TEXT)
    const isValidPassword = password === user.password;
    console.log('🔑 Password check:', { valid: isValidPassword });

    if (!isValidPassword) {
      log.warn(`Login attempt with invalid password for user: ${username} from ${req.ip}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('📝 Creating session for user:', username);
    
    // Store user in session
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    console.log('🔄 Updating last login...');
    
    // Update last login
    try {
      await executeQuery(
        'UPDATE users SET last_login = GETDATE() WHERE id = @param0',
        [user.id]
      );
    } catch (updateError) {
      console.warn('Failed to update last login:', updateError.message);
    }

    log.info(`Successful login: ${username} (${user.role}) from ${req.ip}`);
    
    const response = {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    };
    
    console.log('✅ Sending successful login response:', response);

    res.json(response);
  } catch (error) {
    console.error('💥 Login error:', error);
    log.error('Login error: ' + error.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  console.log('🚪 Logout request from', req.ip);
  log.info(`Logout request from ${req.ip}`);
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destroy error:', err);
      log.error('Session destroy error: ' + err.message);
      return res.status(500).json({ error: 'Logout failed' });
    }
    console.log('✅ Session destroyed successfully');
    res.json({ message: 'Logged out successfully' });
  });
});

// Verify session
router.get('/verify', (req, res) => {
  console.log('🔍 Session verification request');
  if (req.session.user) {
    console.log('✅ Valid session found for:', req.session.user.username);
    res.json({ valid: true, user: req.session.user });
  } else {
    console.log('❌ No valid session found');
    res.status(401).json({ error: 'No active session' });
  }
});

export default router;