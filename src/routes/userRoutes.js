import express from 'express';
import { 
  getCurrentUser, 
  updateCurrentUser, 
  searchUsers,
  sendOTPForEmailChange,
  verifyOTPAndChangeEmail,
  sendOTPForPasswordChange,
  verifyOTPAndChangePassword,
  sendOTPForAccountDeletion,
  verifyOTPAndDeleteAccount
} from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // Protect all routes

router.get('/me', getCurrentUser);
router.patch('/me', updateCurrentUser);
router.get('/search', searchUsers);

// Email change OTP routes
router.post('/send-email-change-otp', sendOTPForEmailChange);
router.post('/verify-email-change-otp', verifyOTPAndChangeEmail);

// Password change OTP routes
router.post('/send-password-change-otp', sendOTPForPasswordChange);
router.post('/verify-password-change-otp', verifyOTPAndChangePassword);

// Account deletion OTP routes
router.post('/send-delete-account-otp', sendOTPForAccountDeletion);
router.post('/verify-delete-account-otp', verifyOTPAndDeleteAccount);

export default router; 