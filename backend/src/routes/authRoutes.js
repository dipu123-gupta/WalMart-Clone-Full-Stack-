const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/authMiddleware');
const { authLimiter, otpLimiter } = require('../middlewares/rateLimiter');
const {
  registerValidation,
  loginValidation,
  verifyOtpValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
  googleAuthValidation,
  resendOtpValidation,
} = require('../validations/authValidation');

// Public routes
router.post('/register', authLimiter, registerValidation, authController.register);
router.post('/verify-otp', verifyOtpValidation, authController.verifyOTP);
router.post('/resend-otp', otpLimiter, resendOtpValidation, authController.resendOTP);
router.post('/login', authLimiter, loginValidation, authController.login);
router.post('/google', googleAuthValidation, authController.googleAuth);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authLimiter, forgotPasswordValidation, authController.forgotPassword);
router.post('/reset-password/:token', resetPasswordValidation, authController.resetPassword);

// Protected routes
router.post('/logout', authenticate, authController.logout);
router.patch('/change-password', authenticate, changePasswordValidation, authController.changePassword);

module.exports = router;
