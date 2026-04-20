const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const validateOptions = { default: false };

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS, 
  max: env.RATE_LIMIT_MAX,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: validateOptions,
});

// Strict limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts
  message: {
    success: false,
    message: 'Too many login attempts, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: validateOptions,
});

// OTP rate limiter
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3, // 3 OTP requests
  message: {
    success: false,
    message: 'Too many OTP requests, please try again after 10 minutes',
  },
  validate: validateOptions,
});

// Payment rate limiter
const paymentLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many payment attempts, please try again later',
  },
  validate: validateOptions,
});

module.exports = { apiLimiter, authLimiter, otpLimiter, paymentLimiter };
