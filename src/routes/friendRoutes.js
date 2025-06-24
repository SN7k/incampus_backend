import express from 'express';
import {
  sendRequest,
  acceptRequest,
  declineRequest,
  cancelRequest,
  unfriend,
  getFriendsList,
  getPendingRequests,
  getSentRequests,
  getSuggestions,
  getUserFriends
} from '../controllers/friendController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Friend request routes
router.post('/send-request', sendRequest);
router.patch('/accept-request/:requestId', acceptRequest);
router.patch('/decline-request/:requestId', declineRequest);
router.delete('/cancel-request/:requestId', cancelRequest);
router.delete('/unfriend/:friendId', unfriend);
router.get('/friends-list', getFriendsList);
router.get('/user-friends/:userId', getUserFriends);
router.get('/pending-requests', getPendingRequests);
router.get('/sent-requests', getSentRequests);
router.get('/suggestions', getSuggestions);

export default router; 