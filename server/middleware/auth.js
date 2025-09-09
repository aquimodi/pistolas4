import logger from '../utils/logger.js';

export const authenticate = (req, res, next) => {
  // Skip authentication for health check
  if (req.path === '/health' || req.path === '/api/health') {
    return next();
  }

  // Check for valid session
  if (!req.session || !req.session.user) {
    logger.debug(`Authentication failed: no session for ${req.path}`);
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Verify session is valid
  if (!req.session.user.id || !req.session.user.username) {
    logger.warn(`Invalid session data for ${req.path}`);
    return res.status(401).json({ error: 'Invalid session' });
  }

  // Ensure backward compatibility with existing code that uses req.user
  req.user = req.session.user;
  
  // Reducir logs debug para evitar spam
  if (req.path !== '/api/auth/verify') {
    logger.debug(`Authenticated user: ${req.user.username} (${req.user.role})`);
  }
  next();
};

export const authorizeRole = (roles) => {
  return (req, res, next) => {
    const user = req.user || req.session.user;
    if (!user || !roles.includes(user.role)) {
      logger.warn(`Unauthorized role access: ${user ? user.username : 'anonymous'} (${user ? user.role : 'none'}) attempted to access ${req.path}`);
      return res.status(403).json({ error: 'Insufficient permissions' });
    }  
    next();
  };
};