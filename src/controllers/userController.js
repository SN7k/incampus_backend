import User from '../models/User.js';

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

// Update current user profile
export const updateCurrentUser = async (req, res) => {
  try {
    const { name, bio, avatar, coverPhoto } = req.body;

    // Find and update the user
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        ...(name && { name }),
        ...(bio !== undefined && { bio }),
        ...(avatar && { avatar }),
        ...(coverPhoto && { coverPhoto })
      },
      {
        new: true,
        runValidators: true
      }
    ).select('-password -otp -otpExpires');

    if (!updatedUser) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to update user profile'
    });
  }
}; 