import express from 'express';
import { signup, login, verifyOTP } from '../controllers/authController.js';
import { body } from 'express-validator';

const router = express.Router();

router.post(
  '/signup',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('collegeId').notEmpty().withMessage('College ID is required')
  ],
  signup
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  login
);

router.post('/verify-otp', verifyOTP);

export default router; 