const mongoSanitize = require('express-mongo-sanitize');

/**
 * Sanitize request data to prevent NoSQL injection attacks
 * Compatible with Express 5 getters where req.query is read-only
 */
const sanitizer = (req, res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body, { replaceWith: '_' });
  if (req.params) mongoSanitize.sanitize(req.params, { replaceWith: '_' });
  // Skip req.query to avoid "IncomingMessage getter" crash in Express 5
  next();
};

module.exports = sanitizer;
