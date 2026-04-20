const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const productRoutes = require('./productRoutes');
const cartRoutes = require('./cartRoutes');
const orderRoutes = require('./orderRoutes');
const paymentRoutes = require('./paymentRoutes');
const reviewRoutes = require('./reviewRoutes');
const categoryRoutes = require('./categoryRoutes');
const wishlistRoutes = require('./wishlistRoutes');
const notificationRoutes = require('./notificationRoutes');
const sellerRoutes = require('./sellerRoutes');
const adminRoutes = require('./adminRoutes');
const publicRoutes = require('./publicRoutes');
const couponRoutes = require('./couponRoutes');
const payoutRoutes = require('./payoutRoutes');
const deliveryAgentRoutes = require('./deliveryAgentRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/', reviewRoutes); // /products/:id/reviews & /reviews/:id
router.use('/categories', categoryRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/notifications', notificationRoutes);
router.use('/seller', sellerRoutes);
router.use('/admin', adminRoutes);
router.use('/admin/coupons', couponRoutes);
router.use('/payouts', payoutRoutes);
router.use('/public', publicRoutes);
router.use('/delivery-agent', deliveryAgentRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'WalMart Clone API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

module.exports = router;
