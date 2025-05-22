import express from 'express';
import { getProfile, updateProfile, uploadAvatar } from '../controllers/profileController.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Profile routes
router.get('/', getProfile);
router.patch('/', updateProfile);
router.post('/avatar', upload.single('avatar'), uploadAvatar);

export default router; 