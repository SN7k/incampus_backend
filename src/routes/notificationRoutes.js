import express from 'express';
import { 
  getNotifications, 
  markAsRead, 
  markAllAsRead, 
  createNotification,
  deleteNotification 
} from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all notifications for the current user
router.get('/', getNotifications);

// Mark specific notifications as read
router.patch('/mark-as-read', markAsRead);

// Mark all notifications as read
router.patch('/mark-all-as-read', markAllAsRead);

// Create a new notification
router.post('/', createNotification);

// Delete a notification
router.delete('/:notificationId', deleteNotification);

export default router;