import express from 'express';
import { getCurrentUser } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // Protect all routes

router.get('/me', getCurrentUser);

export default router; 