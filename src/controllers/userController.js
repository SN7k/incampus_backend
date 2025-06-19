import User from '../models/User.js';
import { sendOTPEmail } from '../services/emailService.js';

// Get current user profile
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -otp -otpExpires'); // Exclude sensitive fields

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Search users
export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim() === '') {
      return res.status(400).json({
        status: 'error',
        message: 'Search query is required'
      });
    }

    const searchQuery = new RegExp(q, 'i');
    
    const users = await User.find({
      $or: [
        { name: searchQuery },
        { universityId: searchQuery },
        { course: searchQuery },
        { batch: searchQuery },
        { role: searchQuery },
        { bio: searchQuery }
      ]
    })
    .select('name universityId course batch role bio avatar')
    .limit(20);

    // Transform the results to include 'id' instead of '_id'
    const transformedUsers = users.map(user => ({
      id: user._id,
      name: user.name,
      universityId: user.universityId,
      course: user.course,
      batch: user.batch,
      role: user.role,
      bio: user.bio,
      avatar: user.avatar
    }));

    res.status(200).json({
      status: 'success',
      data: {
        users: transformedUsers
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while searching users'
    });
  }
};

// Update current user profile
export const updateCurrentUser = async (req, res) => {
  try {
    const { name, bio, course, batch } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Update allowed fields
    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (course) user.course = course;
    if (batch) user.batch = batch;

    await user.save();

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          universityId: user.universityId,
          role: user.role,
          bio: user.bio,
          course: user.course,
          batch: user.batch,
          avatar: user.avatar,
          coverPhoto: user.coverPhoto
        }
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Send OTP for email change
export const sendOTPForEmailChange = async (req, res) => {
  try {
    const { newEmail } = req.body;
    const userId = req.user._id;

    if (!newEmail) {
      return res.status(400).json({
        status: 'error',
        message: 'New email is required'
      });
    }

    // Validate email format
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(newEmail)) {
      return res.status(400).json({
        status: 'error',
        message: 'Please enter a valid email address'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Check if new email is already in use
    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser && existingUser._id.toString() !== userId.toString()) {
      return res.status(400).json({
        status: 'error',
        message: 'This email is already in use by another account'
      });
    }

    // Check if email is the same as current
    if (user.email === newEmail) {
      return res.status(400).json({
        status: 'error',
        message: 'The new email is the same as your current email'
      });
    }

    // Generate OTP
    const otp = user.generateOTP();
    await user.save();

    // Send OTP to current email
    try {
      await sendOTPEmail(user.email, otp);
      res.status(200).json({
        status: 'success',
        message: 'OTP sent successfully to your current email address'
      });
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to send OTP. Please try again.'
      });
    }
  } catch (error) {
    console.error('Send OTP for email change error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while sending OTP'
    });
  }
};

// Verify OTP and change email
export const verifyOTPAndChangeEmail = async (req, res) => {
  try {
    const { otp, newEmail } = req.body;
    const userId = req.user._id;

    if (!otp || !newEmail) {
      return res.status(400).json({
        status: 'error',
        message: 'OTP and new email are required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Verify OTP
    const isValid = user.verifyOTP(otp);
    if (!isValid) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired OTP'
      });
    }

    // Update email
    user.email = newEmail;
    user.otp = undefined; // Clear OTP after successful verification
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Email updated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          universityId: user.universityId,
          role: user.role,
          bio: user.bio,
          course: user.course,
          batch: user.batch,
          avatar: user.avatar,
          coverPhoto: user.coverPhoto
        }
      }
    });
  } catch (error) {
    console.error('Verify OTP and change email error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while updating email'
    });
  }
};

// Send OTP for password change
export const sendOTPForPasswordChange = async (req, res) => {
  try {
    const { currentPassword } = req.body;
    const userId = req.user._id;

    if (!currentPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Current password is required'
      });
    }

    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Verify current password
    const isPasswordCorrect = await user.correctPassword(currentPassword, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({
        status: 'error',
        message: 'Current password is incorrect'
      });
    }

    // Generate OTP
    const otp = user.generateOTP();
    await user.save();

    // Send OTP to user's email
    try {
      await sendOTPEmail(user.email, otp);
      res.status(200).json({
        status: 'success',
        message: 'OTP sent successfully to your email address'
      });
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to send OTP. Please try again.'
      });
    }
  } catch (error) {
    console.error('Send OTP for password change error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while sending OTP'
    });
  }
};

// Verify OTP and change password
export const verifyOTPAndChangePassword = async (req, res) => {
  try {
    const { otp, newPassword } = req.body;
    const userId = req.user._id;

    if (!otp || !newPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'OTP and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 8 characters long'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Verify OTP
    const isValid = user.verifyOTP(otp);
    if (!isValid) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired OTP'
      });
    }

    // Update password
    user.password = newPassword;
    user.otp = undefined; // Clear OTP after successful verification
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Verify OTP and change password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while updating password'
    });
  }
};

// Send OTP for account deletion
export const sendOTPForAccountDeletion = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Generate OTP
    const otp = user.generateOTP();
    await user.save();

    // Send OTP to user's email
    try {
      await sendOTPEmail(user.email, otp);
      res.status(200).json({
        status: 'success',
        message: 'OTP sent successfully to your email address'
      });
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to send OTP. Please try again.'
      });
    }
  } catch (error) {
    console.error('Send OTP for account deletion error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while sending OTP'
    });
  }
};

// Verify OTP and delete account
export const verifyOTPAndDeleteAccount = async (req, res) => {
  try {
    const { otp } = req.body;
    const userId = req.user._id;

    if (!otp) {
      return res.status(400).json({
        status: 'error',
        message: 'OTP is required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Verify OTP
    const isValid = user.verifyOTP(otp);
    if (!isValid) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired OTP'
      });
    }

    // Delete user account and related data
    // Delete posts
    const Post = (await import('../models/Post.js')).default;
    await Post.deleteMany({ author: userId });
    // Delete notifications (sent or received)
    const Notification = (await import('../models/Notification.js')).default;
    await Notification.deleteMany({ $or: [ { recipient: userId }, { sender: userId } ] });
    // Optionally: delete other related data (e.g., comments, friends)
    // Delete user account
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      status: 'success',
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Verify OTP and delete account error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while deleting account'
    });
  }
}; 