const express = require('express');
const router = express.Router();
const payoutController = require('../controllers/payoutController');
const { authenticate } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const { ROLES } = require('../constants/roles');

// Payout History for Sellers & Agents
router.get('/my', authenticate, authorize(ROLES.SELLER, ROLES.DELIVERY_AGENT), payoutController.getMyPayouts);

// Request Withdrawal (Sellers & Agents)
router.post('/request', authenticate, authorize(ROLES.SELLER, ROLES.DELIVERY_AGENT), payoutController.requestWithdrawal);

// Admin Payout Management
router.get('/all', authenticate, authorize(ROLES.ADMIN), payoutController.getAllPayouts);
router.patch('/:id/finalize', authenticate, authorize(ROLES.ADMIN), payoutController.finalizePayout);

module.exports = router;
