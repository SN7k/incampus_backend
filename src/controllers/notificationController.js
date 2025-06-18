import Notification from '../models/Notification.js';

// Get notifications for the logged-in user
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 50, page = 1, unreadOnly = false } = req.query;
    
    const query = { recipient: userId };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const notifications = await Notification.find(query)
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .populate('sender', 'name avatar universityId')
      .populate('post', 'text images createdAt');
      
    // Transform MongoDB documents to include id field
    const transformedNotifications = notifications.map(notification => {
      const notificationData = notification.toObject();
      notificationData.id = notificationData._id.toString();
      delete notificationData._id;
      
      // Transform sender _id to id
      if (notificationData.sender) {
        notificationData.sender.id = notificationData.sender._id.toString();
        delete notificationData.sender._id;
      }
      
      // Transform post _id to id if it exists
      if (notificationData.post) {
        notificationData.post.id = notificationData.post._id.toString();
        delete notificationData.post._id;
      }
      
      return notificationData;
    });
      
    const totalCount = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ 
      recipient: userId, 
      isRead: false 
    });
    
    res.status(200).json({
      status: 'success',
      data: { 
        notifications: transformedNotifications,
        pagination: {
          total: totalCount,
          unreadCount,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(totalCount / parseInt(limit))
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Mark specific notifications as read
export const markAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { notificationIds } = req.body; // array of notification IDs
    
    await Notification.updateMany(
      { recipient: userId, _id: { $in: notificationIds } },
      { $set: { isRead: true } }
    );
    
    // Get updated unread count
    const unreadCount = await Notification.countDocuments({ 
      recipient: userId, 
      isRead: false 
    });
    
    res.status(200).json({
      status: 'success',
      message: 'Notifications marked as read',
      data: { unreadCount }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    
    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { $set: { isRead: true } }
    );
    
    res.status(200).json({
      status: 'success',
      message: 'All notifications marked as read',
      data: { unreadCount: 0 }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Create a notification
export const createNotification = async (req, res) => {
  try {
    const { recipient, type, post, comment } = req.body;
    const sender = req.user._id;
    
    // Don't create self-notifications
    if (recipient.toString() === sender.toString()) {
      return res.status(200).json({
        status: 'success',
        message: 'Self-notification skipped',
        data: null
      });
    }
    
    const notification = await Notification.create({
      recipient,
      sender,
      type,
      post,
      comment,
      isRead: false
    });
    
    const populatedNotification = await Notification.findById(notification._id)
      .populate('sender', 'name avatar universityId')
      .populate('post', 'text images createdAt');
    
    // Transform the response to include id fields
    const notificationData = populatedNotification.toObject();
    notificationData.id = notificationData._id.toString();
    delete notificationData._id;
    
    // Transform sender _id to id
    if (notificationData.sender) {
      notificationData.sender.id = notificationData.sender._id.toString();
      delete notificationData.sender._id;
    }
    
    // Transform post _id to id if it exists
    if (notificationData.post) {
      notificationData.post.id = notificationData.post._id.toString();
      delete notificationData.post._id;
    }
    
    res.status(201).json({
      status: 'success',
      data: { notification: notificationData }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Delete a notification
export const deleteNotification = async (req, res) => {
  try {
    const userId = req.user._id;
    const { notificationId } = req.params;
    
    const notification = await Notification.findById(notificationId);
    
    if (!notification) {
      return res.status(404).json({
        status: 'error',
        message: 'Notification not found'
      });
    }
    
    // Only allow deletion if user is the recipient
    if (notification.recipient.toString() !== userId.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this notification'
      });
    }
    
    await notification.deleteOne();
    
    res.status(200).json({
      status: 'success',
      message: 'Notification deleted'
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};