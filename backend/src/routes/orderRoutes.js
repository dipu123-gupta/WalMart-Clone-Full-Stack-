const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate } = require('../middlewares/authMiddleware');

const { authorize } = require('../middlewares/roleMiddleware');
const { ROLES } = require('../constants/roles');

router.use(authenticate);
router.post('/', orderController.placeOrder);
router.get('/', orderController.getUserOrders);
router.get('/:id', orderController.getOrderById);
router.patch('/:id/cancel', orderController.cancelOrder);
router.post('/:id/return', orderController.requestReturn);
router.get('/:id/invoice', orderController.downloadInvoice);
router.patch('/:id/status', authorize(ROLES.SELLER, ROLES.ADMIN, ROLES.DELIVERY_AGENT), orderController.updateOrderStatus);

// Delivery & Logistics
router.get('/delivery/tasks', authorize(ROLES.DELIVERY_AGENT), orderController.getDeliveryTasks);
router.patch('/:id/assign-agent', authorize(ROLES.ADMIN), orderController.assignDeliveryAgent);

module.exports = router;
