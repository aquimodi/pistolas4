import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'datacenter-equipment-secret-key';

// Mock users for authentication fallback
const mockUsers = [
  { id: 1, username: 'admin', password: 'admin', role: 'admin' },
  { id: 2, username: 'manager', password: 'manager', role: 'manager' },
  { id: 3, username: 'operator', password: 'operator', role: 'operator' },
  { id: 4, username: 'viewer', password: 'viewer', role: 'viewer' }
];

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // Check for session-based auth first
  if (req.session && req.session.user) {
    req.user = req.session.user;
    return next();
  }

  // Check for JWT token
  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        console.log('JWT verification failed:', err.message);
        return res.status(401).json({ error: 'Invalid token' });
      }
      req.user = user;
      next();
    });
  } else {
    console.log('No token provided and no session found');
    res.status(401).json({ error: 'Access token required' });
  }
}

function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

async function validateUser(username, password) {
  try {
    // Try to find user in mock users (fallback)
    const user = mockUsers.find(u => u.username === username && u.password === password);
    
    if (user) {
      console.log('✅ User authenticated with fallback system:', username);
      return { id: user.id, username: user.username, role: user.role };
    }
    
    console.log('❌ Authentication failed for user:', username);
    return null;
  } catch (error) {
    console.error('Error validating user:', error.message);
    return null;
  }
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (Array.isArray(roles)) {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
    } else {
      if (req.user.role !== roles) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
    }

    next();
  };
}

// Alias for backward compatibility
const authorizeRole = requireRole;

export {
  authenticateToken,
  generateToken,
  validateUser,
  requireRole,
  authorizeRole
};