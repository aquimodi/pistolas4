import logger from '../utils/logger.js';

export const authenticateSession = (req, res, next) => {
  if (!req.session.user) {
    logger.warn(`Unauthorized access attempt from ${req.ip}`);
    return res.status(401).json({ error: 'Authentication required' });
  }

  req.user = req.session.user;
  logger.debug(`Authenticated user: ${req.user.username} (${req.user.role})`);
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