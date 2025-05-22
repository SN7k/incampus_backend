import express from 'express';
import {
  createPost,
  getFeed,
  toggleLike,
  addComment,
  getComments,
  deletePost
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
  upload.single('media'),
  [
    body('text')
      .trim()
      .notEmpty().withMessage('Post text is required')
      .isLength({ max: 2000 }).withMessage('Post cannot be more than 2000 characters')
  ],
  createPost
);
router.get('/feed', getFeed);
router.patch('/:postId/like', toggleLike);
router.post('/:postId/comments', addComment);
router.get('/:postId/comments', getComments);
router.delete('/:postId', deletePost);

export default router; 