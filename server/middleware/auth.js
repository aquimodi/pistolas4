import logger from '../utils/logger.js';

export const authenticate = (req, res, next) => {
  try {
    // Check if user has an active session
    if (req.session && req.session.user) {
      req.user = req.session.user;
      logger.debug('User authenticated via session', { userId: req.user.id, username: req.user.username });
      return next();
    }

    logger.warn('Authentication failed - No valid session', { 
      sessionExists: !!req.session,
      ip: req.ip 
    });
    
    return res.status(401).json({ error: 'Authentication required' });
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    return res.status(500).json({ error: 'Authentication system error' });
  }
};

export const authorizeRole = (allowedRoles = []) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        logger.warn('Authorization failed - User not authenticated');
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (allowedRoles.length === 0) {
        return next(); // No role restriction
      }

      if (allowedRoles.includes(req.user.role)) {
        logger.debug('User authorized for role', { 
          userId: req.user.id, 
          userRole: req.user.role, 
          allowedRoles 
        });
        return next();
      }

      logger.warn('Authorization failed - Insufficient role', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: allowedRoles
      });
      
      return res.status(403).json({ error: 'Insufficient permissions' });
    } catch (error) {
      logger.error('Authorization middleware error:', error);
      return res.status(500).json({ error: 'Authorization system error' });
    }
  };
};

export default { authenticate, authorizeRole };