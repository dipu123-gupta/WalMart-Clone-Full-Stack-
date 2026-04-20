const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const { ROLES } = require('../constants/roles');
const userController = require('../controllers/userController');
const productController = require('../controllers/productController');
const orderController = require('../controllers/orderController');
const paymentController = require('../controllers/paymentController');
const reviewController = require('../controllers/reviewController');
const categoryController = require('../controllers/categoryController');
const sellerController = require('../controllers/sellerController');
const analyticsController = require('../controllers/analyticsController');
const configController = require('../controllers/configController');
const { uploadImage } = require('../middlewares/uploadMiddleware');

// All admin routes require admin role
router.use(authenticate, authorize(ROLES.ADMIN));

// User management
router.get('/users', userController.getAllUsers);
router.patch('/users/:id/status', userController.updateUserStatus);
router.patch('/users/:id/role', userController.updateUserRole);

// Product management
router.get('/products/pending', productController.getPendingProducts);
router.patch('/products/:id/approve', productController.approveProduct);

// Category management
router.post('/categories', uploadImage.single('image'), categoryController.createCategory);
router.patch('/categories/:id', categoryController.updateCategory);
router.delete('/categories/:id', categoryController.deleteCategory);

// Order management
router.get('/orders', orderController.getAllOrders);
router.patch('/orders/:id/status', orderController.adminUpdateStatus);
router.patch('/orders/:id/return-approve', orderController.approveReturn);

// Payment / refund
router.post('/payments/:id/refund', paymentController.processRefund);

// Review moderation
router.patch('/reviews/:id/moderate', reviewController.moderateReview);

// Seller management
router.get('/sellers', sellerController.getAllSellers);
router.patch('/sellers/:id/approve', sellerController.approveSeller);
router.patch('/sellers/:id/commission', sellerController.setCommission);

// Analytics
router.get('/analytics/overview', analyticsController.getOverview);
router.get('/analytics/revenue', analyticsController.getRevenueAnalytics);
router.get('/analytics/orders', analyticsController.getOrderAnalytics);
router.get('/analytics/users', analyticsController.getUserAnalytics);
router.get('/analytics/products', analyticsController.getTopProducts);
router.get('/fraud/alerts', analyticsController.getFraudAlerts);

// Platform Settings
router.get('/settings', configController.getConfigs);
router.patch('/settings', configController.updateConfigs);

module.exports = router;
