const crypto = require('crypto');

/**
 * Generate a numeric OTP
 * @param {number} length - OTP length (default: 6)
 * @returns {{ code: string, expiresAt: Date }}
 */
const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    otp += digits[bytes[i] % 10];
  }

  return {
    code: otp,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
  };
};

/**
 * Verify OTP validity
 * @param {Object} storedOtp - { code, expiresAt }
 * @param {string} inputCode - User-provided OTP
 * @returns {boolean}
 */
const verifyOTP = (storedOtp, inputCode) => {
  if (!storedOtp || !storedOtp.code || !storedOtp.expiresAt) return false;
  if (new Date() > new Date(storedOtp.expiresAt)) return false;
  return storedOtp.code === inputCode;
};

module.exports = { generateOTP, verifyOTP };
