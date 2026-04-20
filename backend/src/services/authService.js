const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { generateTokenPair, verifyRefreshToken } = require('../utils/generateToken');
const { generateOTP, verifyOTP } = require('../utils/generateOTP');
const { eventEmitter, EVENTS } = require('../events/eventEmitter');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');
const env = require('../config/env');
const logger = require('../config/logger');

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

class AuthService {
  /**
   * Register a new user
   */
  async register({ firstName, lastName, email, password, phone }) {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.isVerified) {
        throw ApiError.conflict('Email already registered');
      }
      // User exists but not verified — update and resend OTP
      const otp = generateOTP();
      existingUser.firstName = firstName;
      existingUser.lastName = lastName;
      existingUser.password = password;
      existingUser.otp = otp;
      if (phone) existingUser.phone = phone;
      await existingUser.save();

      eventEmitter.emit(EVENTS.USER_REGISTERED, { user: existingUser, otp: otp.code });
      return { message: 'OTP sent to your email for verification' };
    }

    // Check phone uniqueness
    if (phone) {
      const phoneExists = await User.findOne({ phone });
      if (phoneExists) throw ApiError.conflict('Phone number already registered');
    }

    // Create user
    const otp = generateOTP();
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      otp,
    });

    // Emit event to send OTP email
    eventEmitter.emit(EVENTS.USER_REGISTERED, { user, otp: otp.code });

    return { message: 'OTP sent to your email for verification' };
  }

  /**
   * Verify OTP and activate account
   */
  async verifyOTP({ email, otp }) {
    const user = await User.findOne({ email }).select('+otp.code +otp.expiresAt +otp.attempts');
    if (!user) throw ApiError.notFound('User not found');
    if (user.isVerified) throw ApiError.badRequest('Account already verified');

    // Check OTP attempts
    if (user.otp.attempts >= 5) {
      throw ApiError.tooManyRequests('Too many failed OTP attempts. Please request a new OTP.');
    }

    // Verify OTP
    if (!verifyOTP(user.otp, otp)) {
      user.otp.attempts = (user.otp.attempts || 0) + 1;
      await user.save();
      throw ApiError.badRequest('Invalid or expired OTP');
    }

    // Activate user
    user.isVerified = true;
    user.otp = undefined;
    await user.save();

    // Generate tokens
    const tokens = generateTokenPair(user);

    // Save refresh token
    await User.findByIdAndUpdate(user._id, {
      $push: {
        refreshTokens: {
          token: tokens.refreshToken,
          device: 'web',
        },
      },
    });

    eventEmitter.emit(EVENTS.USER_VERIFIED, { user });

    return {
      user,
      ...tokens,
    };
  }

  /**
   * Resend OTP
   */
  async resendOTP({ email }) {
    const user = await User.findOne({ email }).select('+otp.lastSentAt');
    if (!user) throw ApiError.notFound('User not found');
    if (user.isVerified) throw ApiError.badRequest('Account already verified');

    // Rate limit: 1 OTP per minute
    if (user.otp?.lastSentAt && Date.now() - new Date(user.otp.lastSentAt).getTime() < 60000) {
      throw ApiError.tooManyRequests('Please wait at least 1 minute before requesting a new OTP');
    }

    const otp = generateOTP();
    user.otp = { ...otp, attempts: 0, lastSentAt: new Date() };
    await user.save();

    eventEmitter.emit(EVENTS.USER_REGISTERED, { user, otp: otp.code });

    return { message: 'OTP resent to your email' };
  }

  /**
   * Login with email and password
   */
  async login({ email, password, device = 'web' }) {
    const user = await User.findOne({ email })
      .select('+password +loginAttempts +lockUntil');

    if (!user) throw ApiError.unauthorized('Invalid email or password');

    // Check lock
    if (user.isLocked()) {
      throw ApiError.tooManyRequests('Account locked due to too many failed attempts. Try again later.');
    }

    if (!user.isVerified) {
      throw ApiError.forbidden('Please verify your email first');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('Your account has been deactivated');
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incrementLoginAttempts();
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();

    // Generate tokens
    const tokens = generateTokenPair(user);

    // Save refresh token (max 5 devices)
    const userWithTokens = await User.findById(user._id).select('+refreshTokens');
    if (userWithTokens.refreshTokens && userWithTokens.refreshTokens.length >= 5) {
      // Remove oldest token
      userWithTokens.refreshTokens.shift();
    }
    userWithTokens.refreshTokens = userWithTokens.refreshTokens || [];
    userWithTokens.refreshTokens.push({ token: tokens.refreshToken, device });
    await userWithTokens.save();

    eventEmitter.emit(EVENTS.USER_LOGIN, { user });

    return {
      user,
      ...tokens,
    };
  }

  /**
   * Google OAuth login/register
   */
  async googleAuth({ idToken, device = 'web' }) {
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (error) {
      throw ApiError.unauthorized('Invalid Google token');
    }

    const { sub: googleId, email, given_name, family_name, picture } = payload;

    // Find existing user
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      // Link Google account if not already linked
      if (!user.googleId) {
        user.googleId = googleId;
        if (!user.avatar.url && picture) {
          user.avatar = { url: picture, publicId: '' };
        }
        await user.save();
      }

      if (!user.isActive) {
        throw ApiError.forbidden('Your account has been deactivated');
      }
    } else {
      // Create new user
      user = await User.create({
        firstName: given_name || 'User',
        lastName: family_name || '',
        email,
        googleId,
        isVerified: true,
        avatar: { url: picture || '', publicId: '' },
      });
    }

    if (!user.isVerified) {
      user.isVerified = true;
      await user.save();
    }

    // Generate tokens
    const tokens = generateTokenPair(user);

    await User.findByIdAndUpdate(user._id, {
      $push: {
        refreshTokens: { token: tokens.refreshToken, device },
      },
      lastLogin: new Date(),
    });

    return { user, ...tokens };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    if (!refreshToken) throw ApiError.unauthorized('Refresh token required');

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    // Find user and verify token exists in stored tokens
    const user = await User.findById(decoded.id).select('+refreshTokens');
    if (!user) throw ApiError.unauthorized('User not found');

    const tokenIndex = user.refreshTokens?.findIndex(
      (rt) => rt.token === refreshToken
    );

    if (tokenIndex === -1 || tokenIndex === undefined) {
      // Token not found — potential token reuse (compromised)
      // Revoke all tokens for security
      user.refreshTokens = [];
      await user.save();
      throw ApiError.unauthorized('Refresh token revoked. Please login again.');
    }

    // Token rotation: remove old, add new
    const tokens = generateTokenPair(user);
    user.refreshTokens.splice(tokenIndex, 1);
    user.refreshTokens.push({
      token: tokens.refreshToken,
      device: user.refreshTokens[tokenIndex]?.device || 'web',
    });
    await user.save();

    return tokens;
  }

  /**
   * Logout — invalidate refresh token
   */
  async logout(userId, refreshToken) {
    await User.findByIdAndUpdate(userId, {
      $pull: { refreshTokens: { token: refreshToken } },
    });
    return { message: 'Logged out successfully' };
  }

  /**
   * Forgot password — send reset link
   */
  async forgotPassword({ email }) {
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists (security)
      return { message: 'If the email is registered, you will receive a password reset link' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${env.CLIENT_URL}/reset-password/${resetToken}`;

    try {
      const { passwordResetTemplate } = require('../utils/emailTemplates');
      await require('../config/nodemailer').sendEmail({
        to: user.email,
        subject: 'Password Reset Request',
        html: passwordResetTemplate(user.firstName, resetUrl),
      });
    } catch (error) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      logger.error('Password reset email failed:', error);
    }

    return { message: 'If the email is registered, you will receive a password reset link' };
  }

  /**
   * Reset password with token
   */
  async resetPassword(token, { password }) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) throw ApiError.badRequest('Invalid or expired reset token');

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshTokens = []; // Invalidate all sessions
    await user.save();

    return { message: 'Password reset successfully. Please login with your new password.' };
  }

  /**
   * Change password (while logged in)
   */
  async changePassword(userId, { currentPassword, newPassword }) {
    const user = await User.findById(userId).select('+password +refreshTokens');
    if (!user) throw ApiError.notFound('User not found');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) throw ApiError.unauthorized('Current password is incorrect');

    user.password = newPassword;
    user.refreshTokens = []; // P0-4: Revoke ALL sessions on password change
    await user.save();

    return { message: 'Password changed successfully. Please login again.' };
  }
}

module.exports = new AuthService();
