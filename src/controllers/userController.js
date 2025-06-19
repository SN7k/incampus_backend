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

    const searchQuery = q.trim();
    
    // Create a case-insensitive regex pattern for searching
    const regexPattern = new RegExp(searchQuery, 'i');
    
    // Search users by name, universityId, course, batch, or role
    const users = await User.find({
      $or: [
        { name: { $regex: regexPattern } },
        { universityId: { $regex: regexPattern } },
        { course: { $regex: regexPattern } },
        { batch: { $regex: regexPattern } },
        { role: { $regex: regexPattern } },
        { bio: { $regex: regexPattern } }
      ]
    })
    .select('name email avatar role universityId course batch bio')
    .limit(20); // Limit results to prevent performance issues

    // Transform the results to match frontend expectations
    const transformedUsers = users.map(user => {
      const userData = user.toObject();
      userData.id = userData._id.toString();
      delete userData._id;
      return userData;
    });

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