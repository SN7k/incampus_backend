const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;
  
  console.log('Auth middleware called');
  console.log('Headers:', Object.keys(req.headers));
  
  // Check if auth header exists and has the correct format
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
    console.log('Token extracted from Authorization header');
  }
  
  // Check if token exists
  if (!token) {
    console.log('No token found in request');
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }
  
  // Ensure JWT_SECRET is set
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not set in environment variables');
    // Use a default secret in development mode only
    if (process.env.NODE_ENV === 'development') {
      process.env.JWT_SECRET = 'incampus-dev-secret-key-for-jwt';
      console.log('Using default JWT_SECRET for development');
    } else {
      return res.status(500).json({
        success: false,
        error: 'Server configuration error'
      });
    }
  }
  
  try {
    // Verify token
    console.log(`Verifying token with JWT_SECRET (length: ${process.env.JWT_SECRET?.length || 0})`);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token verified successfully:', decoded);
    
    // Add user to request object
    const user = await User.findById(decoded.id);
    
    if (!user) {
      console.log(`User not found for ID: ${decoded.id}`);
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }
    
    console.log(`User authenticated: ${user.name} (${user._id})`);
    req.user = user;
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};
