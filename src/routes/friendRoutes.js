import express from 'express';
import {
  sendRequest,
  acceptRequest,
  declineRequest,
  unfriend,
  getFriendsList,
  getPendingRequests
} from '../controllers/friendController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Friend request routes
router.post('/send-request', sendRequest);
router.patch('/accept-request/:requestId', acceptRequest);
router.patch('/decline-request/:requestId', declineRequest);
router.delete('/unfriend/:friendId', unfriend);
router.get('/friends-list', getFriendsList);
router.get('/pending-requests', getPendingRequests);

export default router; 