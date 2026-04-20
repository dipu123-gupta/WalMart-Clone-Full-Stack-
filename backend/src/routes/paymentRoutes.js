const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middlewares/authMiddleware');
const { paymentLimiter } = require('../middlewares/rateLimiter');

router.post('/create-order', authenticate, paymentLimiter, paymentController.createOrder);
router.post('/verify', authenticate, paymentController.verifyPayment);
router.post('/webhook', paymentController.handleWebhook); // No auth — verified by signature

module.exports = router;
