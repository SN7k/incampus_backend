const express = require('express');
const { 
  updateComment,
  deleteComment,
  likeComment,
  unlikeComment
} = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

// Comment routes
router.route('/:id')
  .put(updateComment)
  .delete(deleteComment);

router.route('/:id/like')
  .put(likeComment);

router.route('/:id/unlike')
  .put(unlikeComment);

module.exports = router;
