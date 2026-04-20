const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { optionalAuth, authenticate } = require('../middlewares/authMiddleware');

router.get('/', optionalAuth, cartController.getCart);
router.post('/items', optionalAuth, cartController.addItem);
router.patch('/items/:itemId', optionalAuth, cartController.updateItem);
router.delete('/items/:itemId', optionalAuth, cartController.removeItem);
router.delete('/', optionalAuth, cartController.clearCart);
router.post('/sync', authenticate, cartController.syncCart);
router.post('/apply-coupon', authenticate, cartController.applyCoupon);
router.delete('/coupon', authenticate, cartController.removeCoupon);

module.exports = router;
