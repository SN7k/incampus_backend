import Friend from '../models/Friend.js';
import User from '../models/User.js';
import { createFriendRequestNotification, createFriendAcceptedNotification } from '../services/notificationService.js';
import { getIO } from '../services/socketService.js';
import mongoose from 'mongoose';

// Send friend request
export const sendRequest = async (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user._id;
    
    console.log('sendRequest - senderId:', senderId);
    console.log('sendRequest - receiverId:', receiverId);

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      console.log('sendRequest - receiver not found');
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    console.log('sendRequest - receiver found:', receiver.name);

    // Prevent self-friend request
    if (senderId.toString() === receiverId) {
      console.log('sendRequest - self-friend request attempted');
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
      console.log('sendRequest - existing request found:', existingRequest.status);
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
    console.log('sendRequest - friend request created:', friendRequest._id);
    
    // Notify receiver
    console.log('sendRequest - creating notification for receiver');
    const notification = await createFriendRequestNotification(senderId, receiverId);
    console.log('sendRequest - notification created:', notification ? notification._id : 'failed');
    
    // Emit real-time notification via socket
    try {
      const io = getIO();
      console.log('sendRequest - Emitting socket event to receiver:', receiverId);
      console.log('sendRequest - Socket event data:', {
        fromUser: {
          id: senderId,
          name: req.user.name,
          avatar: req.user.avatar
        }
      });
      
      io.to(receiverId.toString()).emit('friend:request', {
        fromUser: {
          id: senderId,
          name: req.user.name,
          avatar: req.user.avatar
        }
      });
      console.log('sendRequest - Socket event emitted successfully to receiver:', receiverId);
    } catch (socketError) {
      console.error('sendRequest - socket error:', socketError);
      // Don't fail the request if socket fails
    }
    
    // Convert to plain object and ensure id field exists
    const friendRequestData = friendRequest.toObject();
    friendRequestData.id = friendRequestData._id.toString();
    delete friendRequestData._id;

    res.status(201).json({
      status: 'success',
      data: {
        friendRequest: friendRequestData
      }
    });
  } catch (error) {
    console.error('sendRequest - error:', error);
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
    
    // Emit real-time notification via socket
    try {
      const io = getIO();
      io.to(friendRequest.sender.toString()).emit('friend:accept', {
        fromUser: {
          id: userId,
          name: req.user.name,
          avatar: req.user.avatar
        }
      });
      console.log('acceptRequest - socket event emitted to sender:', friendRequest.sender);
    } catch (socketError) {
      console.error('acceptRequest - socket error:', socketError);
      // Don't fail the request if socket fails
    }

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

// Cancel sent friend request
export const cancelRequest = async (req, res) => {
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

    // Check if user is the sender
    if (friendRequest.sender.toString() !== userId.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to cancel this request'
      });
    }

    // Check if request is still pending
    if (friendRequest.status !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot cancel a request that is not pending'
      });
    }

    // Delete the friend request
    await Friend.findByIdAndDelete(requestId);

    res.status(200).json({
      status: 'success',
      message: 'Friend request cancelled successfully'
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
    }).populate('sender receiver', 'name email avatar role');

    const friends = friendships
      .filter(friendship => friendship.sender && friendship.receiver)
      .map(friendship => {
        const friend = friendship.sender._id.toString() === userId.toString()
          ? friendship.receiver
          : friendship.sender;
        return {
          id: friend._id.toString(),
          name: friend.name,
          email: friend.email,
          avatar: friend.avatar,
          role: friend.role
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
    }).populate('sender', 'name email avatar role');

    // Convert to plain objects and ensure id field exists
    const requestsData = pendingRequests.map(request => {
      const requestData = request.toObject();
      requestData.id = requestData._id.toString();
      delete requestData._id;
      // Convert sender _id to id
      if (requestData.sender) {
        requestData.sender.id = requestData.sender._id.toString();
        delete requestData.sender._id;
      }
      return requestData;
    });

    res.status(200).json({
      status: 'success',
      data: {
        pendingRequests: requestsData
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get sent requests
export const getSentRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    const sentRequests = await Friend.find({
      sender: userId,
      status: 'pending'
    }).populate('receiver', 'name email avatar role');

    // Convert to plain objects and ensure id field exists
    const requestsData = sentRequests.map(request => {
      const requestData = request.toObject();
      requestData.id = requestData._id.toString();
      delete requestData._id;
      // Convert receiver _id to id
      if (requestData.receiver) {
        requestData.receiver.id = requestData.receiver._id.toString();
        delete requestData.receiver._id;
      }
      return requestData;
    });

    res.status(200).json({
      status: 'success',
      data: {
        sentRequests: requestsData
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Helper to extract course and batch from universityId
function extractCourseAndBatch(universityId) {
  // Example: BWU/BCA/23/734
  if (!universityId) return { course: '', batch: '' };
  const parts = universityId.split('/');
  return {
    course: parts[1] || '',
    batch: parts[2] ? '20' + parts[2] : '' // '23' -> '2023'
  };
}

// Get friend suggestions
export const getSuggestions = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log('getSuggestions - userId:', userId);

    // Get the current user details for context matching
    const currentUser = await User.findById(userId);
    const { course: myCourse, batch: myBatch } = extractCourseAndBatch(currentUser.universityId);
    const myRole = currentUser.role;
    console.log('getSuggestions - currentUser:', {
      id: currentUser._id,
      universityId: currentUser.universityId,
      course: myCourse,
      batch: myBatch,
      role: myRole
    });

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

    const excludeIds = [...friendIds, ...pendingIds, userId];

    // Fetch all possible candidates (excluding friends, pending, self)
    const candidates = await User.find({ _id: { $nin: excludeIds } })
      .select('name email avatar role universityId');

    // Parse course/batch for each candidate
    const parsedCandidates = candidates.map(u => {
      const { course, batch } = extractCourseAndBatch(u.universityId);
      return { ...u.toObject(), course, batch };
    });

    // 1. Priority: same course or batch or role
    let prioritySuggestions = parsedCandidates.filter(u =>
      (u.course && u.course === myCourse) ||
      (u.batch && u.batch === myBatch) ||
      (u.role && u.role === myRole)
    );

    // 2. If not enough, fill with random users (other courses, faculty, etc)
    const alreadySuggestedIds = new Set(prioritySuggestions.map(u => u._id.toString()));
    let randomSuggestions = parsedCandidates.filter(u => !alreadySuggestedIds.has(u._id.toString()));
    // Shuffle randomSuggestions
    randomSuggestions = randomSuggestions.sort(() => Math.random() - 0.5);
    const SUGGESTION_LIMIT = 10;
    const allSuggestions = [
      ...prioritySuggestions,
      ...randomSuggestions.slice(0, SUGGESTION_LIMIT - prioritySuggestions.length)
    ].slice(0, SUGGESTION_LIMIT);

    // Map to frontend format
    const suggestionsWithRelevance = allSuggestions
      .filter(user => user && (user._id || user.id) && user.name)
      .filter(user => {
        const userObj = user.toObject ? user.toObject() : user;
        return userObj && userObj.name && (userObj._id || userObj.id);
      })
      .map(user => {
        const userObj = user.toObject ? user.toObject() : user;
        // Always set id as a string
        if (userObj._id && typeof userObj._id === 'object' && userObj._id.toString) {
          userObj.id = userObj._id.toString();
        } else if (typeof userObj.id === 'string') {
          userObj.id = userObj.id;
        } else {
          userObj.id = '';
        }
        delete userObj._id;
        if (!userObj.id || typeof userObj.id !== 'string') return null;
        const relevance = [];
        let priority = 0;
        if (userObj.course) {
          relevance.push(userObj.course);
          if (userObj.course === myCourse) {
            priority += 3;
            relevance.push(`Same program as you: ${userObj.course}`);
          }
        }
        if (userObj.batch) {
          if (userObj.batch === myBatch) {
            priority += 2;
            relevance.push(`Same batch as you: ${userObj.batch}`);
          }
        }
        if (userObj.role) {
          relevance.push(userObj.role);
          if (userObj.role === myRole) {
            priority += 1;
            relevance.push(`Same role as you: ${userObj.role}`);
          }
        }
        return {
          user: userObj,
          relevance,
          priority,
          mutualFriends: 0
        };
      })
      .filter(s => s && s.user && s.user.id && s.user.name);
    // Sort by priority (highest first)
    suggestionsWithRelevance.sort((a, b) => b.priority - a.priority);
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