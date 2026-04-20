const { v2: cloudinary } = require('cloudinary');
const env = require('./env');
const logger = require('./logger');

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

// Verify connection
if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_CLOUD_NAME !== 'demo') {
  cloudinary.api.ping()
    .then(() => logger.info('Cloudinary connected'))
    .catch((err) => logger.warn('Cloudinary connection failed:', err.message));
}

module.exports = cloudinary;
