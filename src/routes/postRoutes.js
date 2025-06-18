import express from 'express';
import {
  createPost,
  getFeed,
  toggleLike,
  addComment,
  getComments,
  deletePost,
  getUserPosts
} from '../controllers/postController.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import { body } from 'express-validator';

const router = express.Router();

// Protect all routes
router.use(protect);

// Post routes
router.post(
  '/',
  upload.array('images', 5), // Allow up to 5 images per post
  [
    body('content')
      .trim()
      .notEmpty().withMessage('Post content is required')
      .isLength({ max: 2000 }).withMessage('Post cannot be more than 2000 characters')
  ],
  createPost
);

// Get user feed
router.get('/feed', getFeed);

// Like/unlike a post
router.patch('/:postId/like', toggleLike);

// Comment on a post
router.post('/:postId/comments', 
  [
    body('text')
      .trim()
      .notEmpty().withMessage('Comment text is required')
      .isLength({ max: 500 }).withMessage('Comment cannot be more than 500 characters')
  ],
  addComment
);

// Get post comments
router.get('/:postId/comments', getComments);

// Delete a post
router.delete('/:postId', deletePost);

// Get posts for a specific user
router.get('/user/:userId', getUserPosts);

export default router;