import express from 'express';
import {
  createPost,
  getFeed,
  toggleLike,
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
  upload.array('images', 3), // Allow up to 3 images per post (changed from 5)
  [
    body('content')
      .optional()
      .trim()
      .isLength({ max: 2000 }).withMessage('Post cannot be more than 2000 characters')
  ],
  createPost
);

// Get user feed
router.get('/feed', getFeed);

// Like/unlike a post
router.patch('/:postId/like', toggleLike);

// Delete a post
router.delete('/:postId', deletePost);

// Get posts for a specific user
router.get('/user/:userId', getUserPosts);

export default router;