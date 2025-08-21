const authService = require('../services/authService');

// Middleware to authenticate user
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const user = await authService.getUserByToken(token);
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

// Middleware to check if user is verified
const requireEmailVerification = async (req, res, next) => {
  if (!req.user.isEmailVerified) {
    return res.status(403).json({ 
      error: 'Email verification required',
      code: 'EMAIL_NOT_VERIFIED'
    });
  }
  next();
};

// Middleware to check if user is active
const requireActiveAccount = async (req, res, next) => {
  if (!req.user.isActive) {
    return res.status(403).json({ 
      error: 'Account is deactivated',
      code: 'ACCOUNT_DEACTIVATED'
    });
  }
  next();
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const user = await authService.getUserByToken(token);
      req.user = user;
      req.token = token;
    }
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

module.exports = {
  authenticate,
  requireEmailVerification,
  requireActiveAccount,
  optionalAuth
}; 