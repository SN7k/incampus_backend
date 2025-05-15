const express = require('express');
const { 
  getUsers,
  getUser,
  updateProfile,
  updateAvatar,
  updateCoverPhoto,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

// User routes
router.route('/')
  .get(getUsers);

router.route('/:id')
  .get(getUser);

router.route('/profile')
  .put(updateProfile);

router.route('/avatar')
  .put(updateAvatar);

router.route('/cover')
  .put(updateCoverPhoto);

// Friend request routes
router.route('/:id/friend-request')
  .post(sendFriendRequest);

router.route('/:id/accept-request')
  .post(acceptFriendRequest);

router.route('/:id/reject-request')
  .post(rejectFriendRequest);

router.route('/:id/friend')
  .delete(removeFriend);

module.exports = router;
