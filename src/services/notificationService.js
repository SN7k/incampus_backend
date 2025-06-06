import Notification from '../models/Notification.js';

// Create notification
const createNotification = async (data) => {
  try {
    const notification = await Notification.create(data);
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

// Create like notification
export const createLikeNotification = async (postId, senderId, recipientId) => {
  return createNotification({
    type: 'like',
    sender: senderId,
    recipient: recipientId,
    post: postId
  });
};

// Create comment notification
export const createCommentNotification = async (postId, commentId, senderId, recipientId) => {
  return createNotification({
    type: 'comment',
    sender: senderId,
    recipient: recipientId,
    post: postId,
    comment: commentId
  });
};

// Create friend request notification
export const createFriendRequestNotification = async (senderId, recipientId) => {
  return createNotification({
    type: 'friend_request',
    sender: senderId,
    recipient: recipientId
  });
};

// Create friend accepted notification
export const createFriendAcceptedNotification = async (senderId, recipientId) => {
  return createNotification({
    type: 'friend_accepted',
    sender: senderId,
    recipient: recipientId
  });
}; 
