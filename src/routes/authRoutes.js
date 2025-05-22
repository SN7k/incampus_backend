import express from 'express';
import { signup, login, verifyOTP, resendOTP } from '../controllers/authController.js';
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
    body('email').optional().isEmail().withMessage('Valid email required'),
    body('universityId').optional().notEmpty().withMessage('University ID is required'),
    body('password').notEmpty().withMessage('Password is required'),
    body('role').isIn(['student', 'faculty']).withMessage('Role must be either student or faculty')
  ],
  login
);

router.post('/verify-otp', verifyOTP);

router.post('/resend-otp', resendOTP);

export default router; 