const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token and attach user to request
exports.authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// Check if user has required role
exports.requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    
    next();
  };
};

// Check if user can access specific batch (for mentors)
exports.canAccessBatch = async (req, res, next) => {
  try {
    const { batchId } = req.params;
    const user = req.user;

    if (user.role === 'admin') {
      return next(); // Admin has access to all batches
    }

    if (user.role === 'mentor') {
      const batch = await require('../models/Batch').findById(batchId);
      if (!batch) {
        return res.status(404).json({ message: 'Batch not found' });
      }
      
      if (!batch.mentors.includes(user._id)) {
        return res.status(403).json({ message: 'Access denied to this batch' });
      }
      
      return next();
    }

    if (user.role === 'student') {
      const batch = await require('../models/Batch').findById(batchId);
      if (!batch) {
        return res.status(404).json({ message: 'Batch not found' });
      }
      
      if (!batch.students.includes(user._id)) {
        return res.status(403).json({ message: 'Access denied to this batch' });
      }
      
      return next();
    }

    res.status(403).json({ message: 'Insufficient permissions' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}; 