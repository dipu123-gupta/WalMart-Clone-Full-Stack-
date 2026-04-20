/**
 * Pick specific keys from an object
 */
const pick = (obj, keys) => {
  return keys.reduce((result, key) => {
    if (obj && Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = obj[key];
    }
    return result;
  }, {});
};

/**
 * Omit specific keys from an object
 */
const omit = (obj, keys) => {
  return Object.keys(obj).reduce((result, key) => {
    if (!keys.includes(key)) {
      result[key] = obj[key];
    }
    return result;
  }, {});
};

/**
 * Calculate tax amount
 * @param {number} amount - Base amount
 * @param {number} taxRate - Tax percentage (e.g., 18 for 18%)
 */
const calculateTax = (amount, taxRate = 18) => {
  return Math.round((amount * taxRate) / 100 * 100) / 100;
};

/**
 * Calculate shipping fee based on order subtotal
 */
const calculateShippingFee = (subtotal) => {
  if (subtotal >= 500) return 0; // Free shipping above ₹500
  if (subtotal >= 200) return 29;
  return 49;
};

/**
 * Sleep utility for retry logic
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Retry function with exponential backoff
 */
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(baseDelay * Math.pow(2, i));
    }
  }
};

module.exports = { pick, omit, calculateTax, calculateShippingFee, sleep, retryWithBackoff };
