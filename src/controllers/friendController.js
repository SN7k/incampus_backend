const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');
const asyncHandler = require('express-async-handler');

// @desc    Get all friends, friend requests, and suggestions
// @route   GET /api/friends
// @access  Private
exports.getFriends = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's friends (accepted friend requests)
    const friendships = await FriendRequest.find({
      $or: [
        { sender: userId, status: 'accepted' },
        { recipient: userId, status: 'accepted' }
      ]
    }).populate('sender recipient', 'name email avatar universityId role program batch');
    
    // Get friend requests sent to the user
    const friendRequests = await FriendRequest.find({
      recipient: userId,
      status: 'pending'
    }).populate('sender', 'name email avatar universityId role program batch');
    
    // Get pending requests sent by the user
    const pendingRequests = await FriendRequest.find({
      sender: userId,
      status: 'pending'
    }).populate('recipient', 'name email avatar universityId role program batch');
    
    // Extract friend user objects
    const friends = friendships.map(friendship => {
      // If user is the sender, return the recipient as friend
      if (friendship.sender._id.toString() === userId) {
        return friendship.recipient;
      }
      // If user is the recipient, return the sender as friend
      return friendship.sender;
    });
    
    // Get friend requests as user objects
    const friendRequestUsers = friendRequests.map(request => request.sender);
    
    // Get pending requests as user objects
    const pendingRequestUsers = pendingRequests.map(request => request.recipient);
    
    // Get suggested friends (users who are not friends and have no pending requests)
    const allUserIds = [
      userId,
      ...friends.map(f => f._id.toString()),
      ...friendRequestUsers.map(f => f._id.toString()),
      ...pendingRequestUsers.map(f => f._id.toString())
    ];
    
    // Find users not in the above list
    const suggestedFriends = await User.find({
      _id: { $nin: allUserIds }
    })
    .select('name email avatar universityId role program batch')
    .limit(8);
    
    res.status(200).json({
      success: true,
      friends,
      friendRequests: friendRequestUsers,
      pendingRequests: pendingRequestUsers,
      suggestedFriends
    });
  } catch (error) {
    console.error('Error getting friends:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Send friend request
// @route   POST /api/friends/request/:userId
// @access  Private
exports.sendFriendRequest = asyncHandler(async (req, res) => {
  try {
    const senderId = req.user.id;
    const recipientId = req.params.userId;
    
    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Check if friend request already exists
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: senderId, recipient: recipientId },
        { sender: recipientId, recipient: senderId }
      ]
    });
    
    if (existingRequest) {
      return res.status(400).json({
        success: false,
        error: 'Friend request already exists'
      });
    }
    
    // Create new friend request
    const friendRequest = new FriendRequest({
      sender: senderId,
      recipient: recipientId,
      status: 'pending'
    });
    
    await friendRequest.save();
    
    res.status(201).json({
      success: true,
      data: friendRequest,
      targetUser: {
        name: recipient.name,
        avatar: recipient.avatar
      }
    });
  } catch (error) {
    console.error('Error sending friend request:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Accept friend request
// @route   POST /api/friends/accept/:userId
// @access  Private
exports.acceptFriendRequest = asyncHandler(async (req, res) => {
  try {
    const recipientId = req.user.id;
    const senderId = req.params.userId;
    
    // Find the friend request
    const friendRequest = await FriendRequest.findOne({
      sender: senderId,
      recipient: recipientId,
      status: 'pending'
    });
    
    if (!friendRequest) {
      return res.status(404).json({
        success: false,
        error: 'Friend request not found'
      });
    }
    
    // Update friend request status
    friendRequest.status = 'accepted';
    await friendRequest.save();
    
    res.status(200).json({
      success: true,
      data: friendRequest
    });
  } catch (error) {
    console.error('Error accepting friend request:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Reject friend request
// @route   POST /api/friends/reject/:userId
// @access  Private
exports.rejectFriendRequest = asyncHandler(async (req, res) => {
  try {
    const recipientId = req.user.id;
    const senderId = req.params.userId;
    
    // Find the friend request
    const friendRequest = await FriendRequest.findOne({
      sender: senderId,
      recipient: recipientId,
      status: 'pending'
    });
    
    if (!friendRequest) {
      return res.status(404).json({
        success: false,
        error: 'Friend request not found'
      });
    }
    
    // Delete the friend request
    await friendRequest.remove();
    
    res.status(200).json({
      success: true,
      message: 'Friend request rejected'
    });
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Remove friend
// @route   DELETE /api/friends/:userId
// @access  Private
exports.removeFriend = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const friendId = req.params.userId;
    
    // Find and delete the friend request
    const result = await FriendRequest.deleteOne({
      $or: [
        { sender: userId, recipient: friendId, status: 'accepted' },
        { sender: friendId, recipient: userId, status: 'accepted' }
      ]
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Friendship not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Friend removed successfully'
    });
  } catch (error) {
    console.error('Error removing friend:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Search users
// @route   GET /api/users/search
// @access  Private
exports.searchUsers = asyncHandler(async (req, res) => {
  try {
    const { q } = req.query;
    const userId = req.user.id;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }
    
    // Search for users by name, email, or universityId
    const users = await User.find({
      $and: [
        { _id: { $ne: userId } }, // Exclude current user
        {
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } },
            { universityId: { $regex: q, $options: 'i' } }
          ]
        }
      ]
    })
    .select('name email avatar universityId role program batch')
    .limit(10);
    
    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});
