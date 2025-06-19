import express from 'express';
import { getCurrentUser, updateCurrentUser, searchUsers } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // Protect all routes

router.get('/me', getCurrentUser);
router.patch('/me', updateCurrentUser);
router.get('/search', searchUsers);

export default router; 