const crypto = require('crypto');

/**
 * Generate a unique order number
 * Format: WM-YYYYMMDD-XXXXXX
 * @returns {string}
 */
const generateOrderNumber = () => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `WM-${dateStr}-${random}`;
};

module.exports = generateOrderNumber;
