const User = require('../models/User');
const { formatSuccessResponse, formatErrorResponse, sendResponse } = require('../utils/responseFormatter');

// Enable verbose logging in production mode
console.log('UserController initialized in production mode');

// @desc    Get all users
// @route   GET /api/users
// @access  Private
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-__v');

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

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

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    console.log('Profile update request received for user:', req.user.id);
    console.log('Request body:', req.body);
    
    // Extract all possible fields from request body
    const fieldsToUpdate = {};
    
    // Basic profile fields
    if (req.body.name) fieldsToUpdate.name = req.body.name;
    if (req.body.bio) fieldsToUpdate.bio = req.body.bio;
    if (req.body.program) fieldsToUpdate.program = req.body.program;
    if (req.body.batch) fieldsToUpdate.batch = req.body.batch;
    if (req.body.avatar) fieldsToUpdate.avatar = req.body.avatar;
    if (req.body.avatarUrl) fieldsToUpdate.avatar = req.body.avatarUrl;
    
    console.log('Fields to update:', fieldsToUpdate);
    
    // Find and update the user
    const user = await User.findByIdAndUpdate(
      req.user.id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    );
    
    if (!user) {
      console.error('User not found with id:', req.user.id);
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    console.log('User profile updated successfully:', user._id);
    
    // Return response with consistent format (both data and user fields)
    res.status(200).json({
      success: true,
      data: user,
      user: user
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update user avatar
// @route   PUT /api/users/avatar
// @access  Private
exports.updateAvatar = async (req, res) => {
  try {
    console.log('Avatar update request received for user:', req.user.id);
    console.log('Avatar URL:', req.body.avatar ? 'Provided' : 'Not provided');
    
    if (!req.body.avatar) {
      console.error('Avatar URL not provided');
      return sendResponse(res, formatErrorResponse('Please provide an avatar URL'));
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: req.body.avatar },
      {
        new: true,
        runValidators: true
      }
    );
    
    if (!user) {
      console.error('User not found with id:', req.user.id);
      return sendResponse(res, formatErrorResponse('User not found', 404));
    }

    console.log('User avatar updated successfully:', user._id);
    sendResponse(res, formatSuccessResponse(user, 200, 'Avatar updated successfully'));
  } catch (error) {
    console.error('Error updating avatar:', error);
    sendResponse(res, formatErrorResponse(error.message));
  }
};

// @desc    Update user cover photo
// @route   PUT /api/users/cover
// @access  Private
exports.updateCoverPhoto = async (req, res) => {
  try {
    console.log('Cover photo update request received for user:', req.user.id);
    console.log('Cover photo URL:', req.body.coverPhoto ? 'Provided' : 'Not provided');
    
    if (!req.body.coverPhoto) {
      console.error('Cover photo URL not provided');
      return sendResponse(res, formatErrorResponse('Please provide a cover photo URL'));
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { coverPhoto: req.body.coverPhoto },
      {
        new: true,
        runValidators: true
      }
    );
    
    if (!user) {
      console.error('User not found with id:', req.user.id);
      return sendResponse(res, formatErrorResponse('User not found', 404));
    }

    console.log('User cover photo updated successfully:', user._id);
    sendResponse(res, formatSuccessResponse(user, 200, 'Cover photo updated successfully'));
  } catch (error) {
    console.error('Error updating cover photo:', error);
    sendResponse(res, formatErrorResponse(error.message));
  }
};

// @desc    Send friend request
// @route   POST /api/users/:id/friend-request
// @access  Private
exports.sendFriendRequest = async (req, res) => {
  try {
    // Check if user exists
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if user is trying to send request to themselves
    if (req.params.id === req.user.id.toString()) {
      return res.status(400).json({
        success: false,
        error: 'You cannot send a friend request to yourself'
      });
    }

    // Check if already friends
    if (user.friends.includes(req.user.id)) {
      return res.status(400).json({
        success: false,
        error: 'You are already friends with this user'
      });
    }

    // Check if friend request already sent
    if (user.friendRequests.includes(req.user.id)) {
      return res.status(400).json({
        success: false,
        error: 'Friend request already sent'
      });
    }

    // Add to friend requests
    user.friendRequests.push(req.user.id);
    await user.save();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Accept friend request
// @route   POST /api/users/:id/accept-request
// @access  Private
exports.acceptFriendRequest = async (req, res) => {
  try {
    // Check if user exists
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if friend request exists
    const currentUser = await User.findById(req.user.id);
    
    if (!currentUser.friendRequests.includes(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'No friend request from this user'
      });
    }

    // Add to friends for both users
    currentUser.friends.push(req.params.id);
    user.friends.push(req.user.id);

    // Remove from friend requests
    currentUser.friendRequests = currentUser.friendRequests.filter(
      id => id.toString() !== req.params.id
    );

    await Promise.all([currentUser.save(), user.save()]);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Reject friend request
// @route   POST /api/users/:id/reject-request
// @access  Private
exports.rejectFriendRequest = async (req, res) => {
  try {
    // Check if friend request exists
    const currentUser = await User.findById(req.user.id);
    
    if (!currentUser.friendRequests.includes(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'No friend request from this user'
      });
    }

    // Remove from friend requests
    currentUser.friendRequests = currentUser.friendRequests.filter(
      id => id.toString() !== req.params.id
    );

    await currentUser.save();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Remove friend
// @route   DELETE /api/users/:id/friend
// @access  Private
exports.removeFriend = async (req, res) => {
  try {
    // Check if user exists
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if they are friends
    const currentUser = await User.findById(req.user.id);
    
    if (!currentUser.friends.includes(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'You are not friends with this user'
      });
    }

    // Remove from friends for both users
    currentUser.friends = currentUser.friends.filter(
      id => id.toString() !== req.params.id
    );
    
    user.friends = user.friends.filter(
      id => id.toString() !== req.user.id.toString()
    );

    await Promise.all([currentUser.save(), user.save()]);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};
