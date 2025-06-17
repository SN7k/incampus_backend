import express from 'express';
import { getProfile, updateProfile, uploadAvatar, uploadCoverPhoto, setupProfile, getMyProfile, getUserProfile } from '../controllers/profileController.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import { body } from 'express-validator';

const router = express.Router();

// Protect all routes
router.use(protect);

// Profile routes
router.get('/', getProfile);
router.patch('/', updateProfile);
router.post('/avatar', upload.single('avatar'), uploadAvatar);
router.post('/cover', upload.single('coverPhoto'), uploadCoverPhoto);
router.get('/me', getMyProfile);
router.get('/:userId', getUserProfile);

// Profile setup route
router.post(
  '/setup',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('role').isIn(['student', 'faculty']).withMessage('Role must be either student or faculty'),
    body('avatar').optional().isObject(),
    body('avatar.url').optional().isString(),
    body('coverPhoto').optional().isObject(),
    body('coverPhoto.url').optional().isString(),
    body('bio').optional().isString()
  ],
  setupProfile
);

export default router;