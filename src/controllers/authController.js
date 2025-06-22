import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { validationResult } from 'express-validator';
import { sendOTPEmail } from '../services/emailService.js';

// Generate JWT token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// Create and send token
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  
  // Remove password from output
  user.password = undefined;
  
  // Map user data to frontend format
  const userData = {
    id: user._id,
    email: user.email,
    name: user.name,
    universityId: user.universityId,
    role: user.role,
    avatar: user.avatar || { url: '' },
    bio: user.bio,
    coverPhoto: user.coverPhoto || { url: '' },
    isVerified: user.isVerified
  };
  
  res.status(statusCode).json({
    status: 'success',
    data: {
      token,
      user: userData
    }
  });
};

// Signup
export const signup = async (req, res) => {
  // Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }
  try {
    const { email, password, collegeId, name, role } = req.body;

    // Debug logging
    console.log('Signup request data:', {
      email,
      collegeId,
      name,
      role,
      hasPassword: !!password
    });

    // Additional validation for collegeId
    if (!collegeId || collegeId.trim() === '') {
      return res.status(400).json({
        status: 'error',
        message: 'College ID is required and cannot be empty'
      });
    }

    // Check if user already exists by email
    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      return res.status(400).json({
        status: 'error',
        message: 'User with this email already exists'
      });
    }

    // Check if user already exists by universityId
    const existingUserById = await User.findOne({ universityId: collegeId });
    if (existingUserById) {
      return res.status(400).json({
        status: 'error',
        message: 'User with this University ID already exists'
      });
    }

    // Create new user
    const userData = {
      email,
      password,
      universityId: collegeId,
      name,
      role,
      isVerified: true
    };
    
    console.log('Creating user with data:', userData);
    
    const user = await User.create(userData);

    // Generate OTP
    const otp = user.generateOTP();
    await user.save();

    // Try to send OTP via email, but don't fail if email service is not configured
    try {
      await sendOTPEmail(email, otp);
      console.log('OTP sent successfully to:', email);
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      // Log the OTP for development purposes
      console.log('Development OTP:', otp);
      
      // Don't fail the signup - just log the OTP
      console.log('User created successfully. OTP for verification:', otp);
    }

    // Return success response with user data and token
    const token = signToken(user._id);
    
    res.status(201).json({
      status: 'success',
      message: 'User created successfully.',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          universityId: user.universityId,
          role: user.role,
          avatar: user.avatar || { url: '' },
          bio: user.bio,
          coverPhoto: user.coverPhoto || { url: '' },
          isVerified: user.isVerified
        }
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    
    // Handle specific MongoDB duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const value = error.keyValue[field];
      
      if (field === 'email') {
        return res.status(400).json({
          status: 'error',
          message: 'User with this email already exists'
        });
      } else if (field === 'universityId') {
        return res.status(400).json({
          status: 'error',
          message: 'User with this University ID already exists'
        });
      } else {
        return res.status(400).json({
          status: 'error',
          message: `Duplicate ${field} value: ${value}`
        });
      }
    }
    
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Login
export const login = async (req, res) => {
  // Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }
  try {
    const { email, universityId, password, role } = req.body;

    // Check if either email or universityId exists
    if (!email && !universityId) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide either email or university ID'
      });
    }

    // Check if password exists
    if (!password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide password'
      });
    }

    // Find user by email or universityId
    const user = await User.findOne({
      $or: [
        { email: email },
        { universityId: universityId }
      ]
    }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({
        status: 'error',
        message: 'Incorrect credentials'
      });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(401).json({
        status: 'error',
        message: 'Please verify your email first'
      });
    }

    // Check if user role matches
    if (user.role !== role) {
      return res.status(401).json({
        status: 'error',
        message: `Invalid role. Please login as ${user.role}`
      });
    }

    // If everything ok, send token to client
    createSendToken(user, 200, res);
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Verify OTP
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    console.log('Verifying OTP for:', { email, otp });

    if (!email || !otp) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and OTP are required'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    console.log('Found user:', {
      email: user.email,
      isVerified: user.isVerified,
      hasOTP: !!user.otp,
      otpExpiresAt: user.otp?.expiresAt
    });

    if (!user.otp || !user.otp.code) {
      console.log('No OTP found for user:', email);
      return res.status(400).json({
        status: 'error',
        message: 'No OTP found. Please request a new OTP'
      });
    }

    if (Date.now() > user.otp.expiresAt) {
      console.log('OTP expired for user:', email);
      return res.status(400).json({
        status: 'error',
        message: 'OTP has expired. Please request a new OTP'
      });
    }

    const isValid = user.verifyOTP(otp);
    console.log('OTP verification result:', {
      email,
      providedOTP: otp,
      storedOTP: user.otp.code,
      isValid
    });

    if (!isValid) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid OTP'
      });
    }

    user.isVerified = true;
    user.otp = undefined;
    await user.save();

    console.log('User verified successfully:', email);
    createSendToken(user, 200, res);
  } catch (error) {
    console.error('Error in verifyOTP:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while verifying OTP'
    });
  }
};

// Resend OTP
export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: 'error',
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        status: 'error',
        message: 'User is already verified'
      });
    }

    // Generate new OTP
    const otp = user.generateOTP();
    await user.save();

    // Send new OTP via email
    try {
      await sendOTPEmail(email, otp);
      res.status(200).json({
        status: 'success',
        message: 'New OTP sent successfully. Please check your email.'
      });
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to send OTP email. Please try again.'
      });
    }
  } catch (error) {
    console.error('Error in resendOTP:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while resending OTP'
    });
  }
};

// Send OTP for forgot password
export const forgotPassword = async (req, res) => {
  try {
    const { email, universityId, role } = req.body;
    // Find user by email or universityId and role
    const user = await User.findOne({
      $or: [
        { email: email },
        { universityId: universityId }
      ],
      role
    });
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
    // Generate OTP
    const otp = user.generateOTP();
    await user.save();
    // Send OTP to user's email
    await sendOTPEmail(user.email, otp);
    res.status(200).json({ status: 'success', message: 'OTP sent to your email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to send OTP' });
  }
};

// Reset password with OTP
export const resetPassword = async (req, res) => {
  try {
    const { email, universityId, otp, newPassword, role } = req.body;
    const user = await User.findOne({
      $or: [
        { email: email },
        { universityId: universityId }
      ],
      role
    });
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
    // Verify OTP
    if (!user.verifyOTP(otp)) {
      return res.status(400).json({ status: 'error', message: 'Invalid or expired OTP' });
    }
    user.password = newPassword;
    user.otp = undefined;
    await user.save();
    res.status(200).json({ status: 'success', message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to reset password' });
  }
}; 