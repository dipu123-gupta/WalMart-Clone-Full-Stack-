const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryAgentController');
const { authenticate } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const { ROLES } = require('../constants/roles');

// All delivery agent routes require authentication and delivery_agent role
router.use(authenticate, authorize(ROLES.DELIVERY_AGENT));

// Profile & availability
router.get('/profile', deliveryController.getAgentProfile);
router.patch('/toggle-availability', deliveryController.toggleAvailability);
router.patch('/location', deliveryController.updateLocation);

// Task management
router.get('/tasks', deliveryController.getMyTasks);
router.patch('/tasks/:orderId/status', deliveryController.updateDeliveryStatus);
router.post('/tasks/:orderId/failed', deliveryController.reportFailedDelivery);

module.exports = router;
