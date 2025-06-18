import Friend from '../models/Friend.js';
import User from '../models/User.js';
import { createFriendRequestNotification, createFriendAcceptedNotification } from '../services/notificationService.js';

// Send friend request
export const sendRequest = async (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user._id;

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Prevent self-friend request
    if (senderId.toString() === receiverId) {
      return res.status(400).json({
        status: 'error',
        message: 'You cannot send friend request to yourself'
      });
    }

    // Check if request already exists
    const existingRequest = await Friend.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId }
      ]
    });

    if (existingRequest) {
      return res.status(400).json({
        status: 'error',
        message: 'Friend request already exists'
      });
    }

    // Create new friend request
    const friendRequest = await Friend.create({
      sender: senderId,
      receiver: receiverId
    });
    // Notify receiver
    await createFriendRequestNotification(senderId, receiverId);

    res.status(201).json({
      status: 'success',
      data: {
        friendRequest
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Accept friend request
export const acceptRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const friendRequest = await Friend.findById(requestId);
    if (!friendRequest) {
      return res.status(404).json({
        status: 'error',
        message: 'Friend request not found'
      });
    }

    // Check if user is the receiver
    if (friendRequest.receiver.toString() !== userId.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to accept this request'
      });
    }

    // Update request status
    friendRequest.status = 'accepted';
    await friendRequest.save();
    // Notify sender
    await createFriendAcceptedNotification(userId, friendRequest.sender);

    res.status(200).json({
      status: 'success',
      data: {
        friendRequest
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Decline friend request
export const declineRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const friendRequest = await Friend.findById(requestId);
    if (!friendRequest) {
      return res.status(404).json({
        status: 'error',
        message: 'Friend request not found'
      });
    }

    // Check if user is the receiver
    if (friendRequest.receiver.toString() !== userId.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to decline this request'
      });
    }

    // Update request status
    friendRequest.status = 'rejected';
    await friendRequest.save();

    res.status(200).json({
      status: 'success',
      data: {
        friendRequest
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Unfriend
export const unfriend = async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user._id;

    const friendship = await Friend.findOne({
      $or: [
        { sender: userId, receiver: friendId },
        { sender: friendId, receiver: userId }
      ],
      status: 'accepted'
    });

    if (!friendship) {
      return res.status(404).json({
        status: 'error',
        message: 'Friendship not found'
      });
    }

    await friendship.deleteOne();

    res.status(200).json({
      status: 'success',
      message: 'Unfriended successfully'
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get friends list
export const getFriendsList = async (req, res) => {
  try {
    const userId = req.user._id;

    const friendships = await Friend.find({
      $or: [
        { sender: userId },
        { receiver: userId }
      ],
      status: 'accepted'
    }).populate('sender receiver', 'name email avatar');

    const friends = friendships.map(friendship => {
      const friend = friendship.sender._id.toString() === userId.toString()
        ? friendship.receiver
        : friendship.sender;
      return {
        _id: friend._id,
        name: friend.name,
        email: friend.email,
        avatar: friend.avatar
      };
    });

    res.status(200).json({
      status: 'success',
      data: {
        friends
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get pending requests
export const getPendingRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    const pendingRequests = await Friend.find({
      receiver: userId,
      status: 'pending'
    }).populate('sender', 'name email avatar');

    res.status(200).json({
      status: 'success',
      data: {
        pendingRequests
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get friend suggestions
export const getSuggestions = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log('getSuggestions - userId:', userId);

    // Get user's friends
    const friendships = await Friend.find({
      $or: [
        { sender: userId },
        { receiver: userId }
      ],
      status: 'accepted'
    });

    // Get IDs of friends and pending requests
    const friendIds = friendships.map(f => 
      f.sender.toString() === userId.toString() ? f.receiver : f.sender
    );

    const pendingRequests = await Friend.find({
      $or: [
        { sender: userId },
        { receiver: userId }
      ],
      status: 'pending'
    });

    const pendingIds = pendingRequests.map(f => 
      f.sender.toString() === userId.toString() ? f.receiver : f.sender
    );

    console.log('getSuggestions - friendIds:', friendIds);
    console.log('getSuggestions - pendingIds:', pendingIds);

    // Get users who are not friends and don't have pending requests
    const suggestions = await User.find({
      _id: { 
        $nin: [...friendIds, ...pendingIds, userId]
      }
    }).select('name email avatar role universityId course batch');

    console.log('getSuggestions - raw suggestions:', suggestions);

    // Add relevance information
    const suggestionsWithRelevance = suggestions.map(user => {
      const relevance = [];
      
      // Add course/batch relevance
      if (user.course || user.batch) {
        relevance.push(user.course || user.batch);
      }

      // Add role relevance
      if (user.role) {
        relevance.push(user.role);
      }

      // Convert MongoDB document to plain object and ensure id field exists
      const userData = user.toObject();
      userData.id = userData._id.toString();
      delete userData._id;

      return {
        ...userData,
        relevance
      };
    });

    console.log('getSuggestions - final suggestions:', suggestionsWithRelevance);

    res.status(200).json({
      status: 'success',
      data: suggestionsWithRelevance
    });
  } catch (error) {
    console.error('getSuggestions - error:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
}; 