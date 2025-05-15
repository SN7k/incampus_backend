const User = require('../models/User');
const { sendOTPEmail, verifyOTP } = require('../utils/emailService');

// @desc    Request OTP for registration
// @route   POST /api/auth/request-otp
// @access  Public
exports.requestOTP = async (req, res) => {
  try {
    const { name, email, universityId } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ 
      $or: [{ email }, { universityId }] 
    });

    if (userExists) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email or university ID'
      });
    }

    // Send OTP to user's email
    const result = await sendOTPEmail(email, name);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to send verification code. Please try again.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Verification code sent to your email',
      data: { email }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Verify OTP and complete registration
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTPAndRegister = async (req, res) => {
  try {
    const { name, email, universityId, password, otp, role, program, batch } = req.body;

    // Verify the OTP
    const verification = verifyOTP(email, otp);
    
    if (!verification.valid) {
      return res.status(400).json({
        success: false,
        error: verification.message
      });
    }

    // Check if user already exists (double-check)
    const userExists = await User.findOne({ 
      $or: [{ email }, { universityId }] 
    });

    if (userExists) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email or university ID'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      universityId,
      password,
      role: role || 'student',
      program,
      batch,
      isVerified: true
    });

    // Send token response
    sendTokenResponse(user, 201, res);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Register user (legacy method, kept for backward compatibility)
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, universityId, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ 
      $or: [{ email }, { universityId }] 
    });

    if (userExists) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email or university ID'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      universityId,
      password,
      isVerified: false // Mark as unverified since we're bypassing OTP
    });

    // Send token response
    sendTokenResponse(user, 201, res);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an email and password'
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Send token response
    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Log user out / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  res.status(200).json({
    success: true,
    data: {}
  });
};

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  // Use secure cookies in production
  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    success: true,
    token,
    data: user
  });
};
