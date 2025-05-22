import Notification from '../models/Notification.js';

// Get notifications for the logged-in user
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const notifications = await Notification.find({ recipient: userId })
      .sort('-createdAt')
      .limit(50)
      .populate('sender', 'name avatar')
      .populate('post', 'text media');
    res.status(200).json({
      status: 'success',
      data: { notifications }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Mark notifications as read
export const markAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { notificationIds } = req.body; // array of notification IDs
    await Notification.updateMany(
      { recipient: userId, _id: { $in: notificationIds } },
      { $set: { isRead: true } }
    );
    res.status(200).json({
      status: 'success',
      message: 'Notifications marked as read'
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
}; 