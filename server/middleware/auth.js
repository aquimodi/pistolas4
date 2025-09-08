import logger from '../utils/logger.js';

export const authenticateSession = (req, res, next) => {
  if (!req.session.user) {
    // Reducir logs para evitar spam en verificaciones normales
    if (req.path !== '/api/auth/verify') {
      logger.warn(`Unauthorized access attempt from ${req.ip} to ${req.path}`);
    }
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Verificar que la sesión tenga datos válidos
  if (!req.session.user.id || !req.session.user.username) {
    if (req.path !== '/api/auth/verify') {
      logger.warn(`Invalid session data from ${req.ip}`);
    }
    return res.status(401).json({ error: 'Invalid session' });
  }

  req.user = req.session.user;
  // Reducir logs debug para evitar spam
  if (req.path !== '/api/auth/verify') {
    logger.debug(`Authenticated user: ${req.user.username} (${req.user.role})`);
  }
  next();
};

export const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      logger.warn(`Unauthorized role access: ${req.user.username} (${req.user.role}) attempted to access ${req.path}`);
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};