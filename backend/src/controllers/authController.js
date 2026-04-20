const authService = require('../services/authService');
const asyncHandler = require('../middlewares/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const env = require('../config/env');

// Cookie options for refresh token
const refreshCookieOptions = {
  httpOnly: true,
  secure: env.isProd(),
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

/**
 * @desc    Register new user
 * @route   POST /api/v1/auth/register
 */
const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  new ApiResponse(200, result.message).send(res);
});

/**
 * @desc    Verify OTP
 * @route   POST /api/v1/auth/verify-otp
 */
const verifyOTP = asyncHandler(async (req, res) => {
  const result = await authService.verifyOTP(req.body);

  // Set refresh token in httpOnly cookie
  res.cookie('refreshToken', result.refreshToken, refreshCookieOptions);

  new ApiResponse(200, 'Account verified successfully', {
    user: result.user,
    accessToken: result.accessToken,
  }).send(res);
});

/**
 * @desc    Resend OTP
 * @route   POST /api/v1/auth/resend-otp
 */
const resendOTP = asyncHandler(async (req, res) => {
  const result = await authService.resendOTP(req.body);
  new ApiResponse(200, result.message).send(res);
});

/**
 * @desc    Login
 * @route   POST /api/v1/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const device = req.headers['user-agent'] || 'web';
  const result = await authService.login({ email, password, device });

  res.cookie('refreshToken', result.refreshToken, refreshCookieOptions);

  new ApiResponse(200, 'Login successful', {
    user: result.user,
    accessToken: result.accessToken,
  }).send(res);
});

/**
 * @desc    Google OAuth login
 * @route   POST /api/v1/auth/google
 */
const googleAuth = asyncHandler(async (req, res) => {
  const { idToken } = req.body;
  const device = req.headers['user-agent'] || 'web';
  const result = await authService.googleAuth({ idToken, device });

  res.cookie('refreshToken', result.refreshToken, refreshCookieOptions);

  new ApiResponse(200, 'Google login successful', {
    user: result.user,
    accessToken: result.accessToken,
  }).send(res);
});

/**
 * @desc    Refresh access token
 * @route   POST /api/v1/auth/refresh-token
 */
const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken || req.body.refreshToken;
  const tokens = await authService.refreshToken(token);

  res.cookie('refreshToken', tokens.refreshToken, refreshCookieOptions);

  new ApiResponse(200, 'Token refreshed', {
    accessToken: tokens.accessToken,
  }).send(res);
});

/**
 * @desc    Logout
 * @route   POST /api/v1/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken || req.body.refreshToken;
  await authService.logout(req.user._id, token);

  res.clearCookie('refreshToken', { path: '/' });
  new ApiResponse(200, 'Logged out successfully').send(res);
});

/**
 * @desc    Forgot password
 * @route   POST /api/v1/auth/forgot-password
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body);
  new ApiResponse(200, result.message).send(res);
});

/**
 * @desc    Reset password
 * @route   POST /api/v1/auth/reset-password/:token
 */
const resetPassword = asyncHandler(async (req, res) => {
  const result = await authService.resetPassword(req.params.token, req.body);
  new ApiResponse(200, result.message).send(res);
});

/**
 * @desc    Change password
 * @route   PATCH /api/v1/auth/change-password
 */
const changePassword = asyncHandler(async (req, res) => {
  const result = await authService.changePassword(req.user._id, req.body);
  new ApiResponse(200, result.message).send(res);
});

module.exports = {
  register,
  verifyOTP,
  resendOTP,
  login,
  googleAuth,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
};
