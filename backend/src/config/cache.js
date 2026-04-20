const NodeCache = require('node-cache');
const logger = require('./logger');

// Default TTL: 10 minutes, check period: 2 minutes
const cache = new NodeCache({
  stdTTL: 600,
  checkperiod: 120,
  useClones: false,
  deleteOnExpire: true,
});

cache.on('expired', (key) => {
  logger.debug(`Cache key expired: ${key}`);
});

/**
 * Cache wrapper with get-or-set pattern
 * @param {string} key - Cache key
 * @param {Function} fetchFn - Function to call on cache miss
 * @param {number} ttl - Time to live in seconds
 */
const cacheGetOrSet = async (key, fetchFn, ttl = 600) => {
  const cached = cache.get(key);
  if (cached !== undefined) {
    logger.debug(`Cache HIT: ${key}`);
    return cached;
  }

  logger.debug(`Cache MISS: ${key}`);
  const data = await fetchFn();
  cache.set(key, data, ttl);
  return data;
};

/**
 * Invalidate cache keys by pattern
 * @param {string} pattern - Key prefix to invalidate
 */
const invalidatePattern = (pattern) => {
  const keys = cache.keys();
  const matchingKeys = keys.filter((key) => key.startsWith(pattern));
  matchingKeys.forEach((key) => cache.del(key));
  logger.debug(`Cache invalidated ${matchingKeys.length} keys matching: ${pattern}`);
};

module.exports = { cache, cacheGetOrSet, invalidatePattern };
