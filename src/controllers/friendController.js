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