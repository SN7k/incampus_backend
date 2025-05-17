const express = require('express');
const { 
  register, 
  login, 
  getMe, 
  logout,
  requestOTP,
  verifyOTPAndRegister
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', register); // Legacy route, kept for backward compatibility
router.post('/request-otp', requestOTP); // Step 1: Request OTP
router.post('/verify-otp', verifyOTPAndRegister); // Step 2: Verify OTP and complete registration
router.post('/login', login);

// Protected routes
router.get('/me', protect, getMe);
router.get('/logout', protect, logout);

module.exports = router;
