const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// Verify JWT token and attach user to request
async function authenticate(req, res, next) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const result = await pool.query(
      'SELECT id, name, email, land, is_active FROM employees WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(401).json({ message: 'User account is inactive' });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(500).json({ message: 'Authentication error' });
  }
}

// Check if user is HR (for demo purposes, we'll use a simple check)
// In production, you'd have a separate roles table
async function requireHR(req, res, next) {
  try {
    // For PoC: check if email contains 'hr' or user has specific flag
    // You can extend this with a proper roles system
    const result = await pool.query(
      `SELECT email FROM employees WHERE id = $1 AND (email LIKE '%hr%' OR email LIKE '%admin%')`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ message: 'Access denied. HR role required.' });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: 'Authorization error' });
  }
}

module.exports = {
  authenticate,
  requireHR
};