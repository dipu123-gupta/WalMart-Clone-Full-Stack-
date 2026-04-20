const NodeCache = require('node-cache');
const logger = require('../config/logger');

const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 }); // Default 10 mins

const cacheMiddleware = (duration) => (req, res, next) => {
  // Only cache GET requests
  if (req.method !== 'GET') return next();

  const key = req.originalUrl || req.url;
  const cachedResponse = cache.get(key);

  if (cachedResponse) {
    logger.info(`Cache hit for ${key}`);
    return res.json(cachedResponse);
  }

  // Intercept res.json to cache the response
  const originalJson = res.json;
  res.json = (body) => {
    cache.set(key, body, duration);
    return originalJson.call(res, body);
  };

  next();
};

const clearCache = (key) => {
  if (key) {
    cache.del(key);
    logger.info(`Cache cleared for key: ${key}`);
  } else {
    cache.flushAll();
    logger.info('Full cache cleared');
  }
};

module.exports = {
  cacheMiddleware,
  clearCache,
};
