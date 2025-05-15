const express = require('express');
const { 
  getPosts,
  getFeed,
  getPost,
  createPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  getUserPosts
} = require('../controllers/postController');
const { getComments, addComment } = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

// Post routes
router.route('/')
  .get(getPosts)
  .post(createPost);

router.route('/feed')
  .get(getFeed);

router.route('/:id')
  .get(getPost)
  .put(updatePost)
  .delete(deletePost);

router.route('/:id/like')
  .put(likePost);

router.route('/:id/unlike')
  .put(unlikePost);

router.route('/user/:userId')
  .get(getUserPosts);

// Comment routes for posts
router.route('/:postId/comments')
  .get(getComments)
  .post(addComment);

module.exports = router;
