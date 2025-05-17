const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getFriends,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  searchUsers
} = require('../controllers/friendController');

// Friend routes
router.get('/', protect, getFriends);
router.post('/request/:userId', protect, sendFriendRequest);
router.post('/accept/:userId', protect, acceptFriendRequest);
router.post('/reject/:userId', protect, rejectFriendRequest);
router.delete('/:userId', protect, removeFriend);

// Search users route
router.get('/search', protect, searchUsers);

module.exports = router;
