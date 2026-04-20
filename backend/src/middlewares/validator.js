const validator = require('validator');
const ApiError = require('../utils/ApiError');

/**
 * Request validation middleware factory
 * @param {Object} schema - Validation schema
 * @param {string} source - 'body' | 'query' | 'params'
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = req[source];
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];

      for (const rule of rules) {
        const error = rule(value, field, data);
        if (error) {
          errors.push({ field, message: error });
          break; // Stop on first error per field
        }
      }
    }

    if (errors.length > 0) {
      const detailedMsg = errors.map(e => e.message).join(', ');
      return next(ApiError.unprocessable(`Validation failed: ${detailedMsg}`, errors));
    }

    next();
  };
};

// Validation rule factories
const rules = {
  required: (msg) => (value, field) => {
    if (value === undefined || value === null || value === '') {
      return msg || `${field} is required`;
    }
  },

  email: (msg) => (value) => {
    if (value && !validator.isEmail(String(value))) {
      return msg || 'Invalid email format';
    }
  },

  minLength: (min, msg) => (value, field) => {
    if (value && String(value).length < min) {
      return msg || `${field} must be at least ${min} characters`;
    }
  },

  maxLength: (max, msg) => (value, field) => {
    if (value && String(value).length > max) {
      return msg || `${field} cannot exceed ${max} characters`;
    }
  },

  isNumeric: (msg) => (value, field) => {
    if (value !== undefined && value !== null && !validator.isNumeric(String(value))) {
      return msg || `${field} must be a number`;
    }
  },

  isIn: (options, msg) => (value, field) => {
    if (value && !options.includes(value)) {
      return msg || `${field} must be one of: ${options.join(', ')}`;
    }
  },

  isPhone: (msg) => (value) => {
    if (value && !validator.isMobilePhone(String(value), 'any')) {
      return msg || 'Invalid phone number';
    }
  },

  isMongoId: (msg) => (value, field) => {
    if (value && !validator.isMongoId(String(value))) {
      return msg || `${field} must be a valid ID`;
    }
  },

  isStrongPassword: (msg) => (value) => {
    if (value && !validator.isStrongPassword(String(value), {
      minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 0,
    })) {
      return msg || 'Password must be at least 8 characters with uppercase, lowercase, and number';
    }
  },

  matches: (pattern, msg) => (value, field) => {
    if (value && !pattern.test(String(value))) {
      return msg || `${field} format is invalid`;
    }
  },

  min: (minVal, msg) => (value, field) => {
    if (value !== undefined && Number(value) < minVal) {
      return msg || `${field} must be at least ${minVal}`;
    }
  },

  max: (maxVal, msg) => (value, field) => {
    if (value !== undefined && Number(value) > maxVal) {
      return msg || `${field} cannot exceed ${maxVal}`;
    }
  },
};

module.exports = { validate, rules };
