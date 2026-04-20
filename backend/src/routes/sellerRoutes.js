const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/sellerController');
const productController = require('../controllers/productController');
const orderController = require('../controllers/orderController');
const { authenticate } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const { uploadImage } = require('../middlewares/uploadMiddleware');
const { ROLES } = require('../constants/roles');

// Seller registration (any authenticated user)
router.post('/register', authenticate, sellerController.registerSeller);

// Seller-only routes
router.use(authenticate, authorize(ROLES.SELLER));

router.get('/dashboard', sellerController.getSellerDashboard);
router.get('/analytics', sellerController.getSellerAnalytics);
router.get('/payouts', sellerController.getPayouts);
router.get('/profile', sellerController.getSellerProfile);
router.patch('/profile', sellerController.updateSellerProfile);

// Seller product management
router.get('/products', sellerController.getSellerProducts);
router.post('/products', uploadImage.array('images', 10), productController.createProduct);
router.patch('/products/:id', productController.updateProduct);
router.delete('/products/:id', productController.deleteProduct);
router.post('/products/:id/variants', productController.addVariant);
router.patch('/products/:id/variants/:vid', productController.updateVariant);

// Seller order management
router.get('/orders', orderController.getSellerOrders);
router.patch('/orders/:id/items/:itemId/status', orderController.updateOrderItemStatus);

module.exports = router;
