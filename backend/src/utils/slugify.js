const slugifyLib = require('slugify');
const crypto = require('crypto');

/**
 * Create URL-friendly slug with uniqueness suffix
 * @param {string} text - Text to slugify
 * @param {boolean} addSuffix - Add random suffix for uniqueness
 * @returns {string}
 */
const createSlug = (text, addSuffix = false) => {
  let slug = slugifyLib(text, {
    lower: true,
    strict: true,
    trim: true,
  });

  if (addSuffix) {
    const suffix = crypto.randomBytes(3).toString('hex');
    slug = `${slug}-${suffix}`;
  }

  return slug;
};

module.exports = createSlug;
