const express = require('express');
const router = express.Router();
const payoutController = require('../controllers/payoutController');
const { authenticate } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const { ROLES } = require('../constants/roles');

// Seller Payout History
router.get('/my-payouts', authenticate, authorize(ROLES.SELLER), payoutController.getSellerPayouts);

// Admin Payout Management
router.get('/all', authenticate, authorize(ROLES.ADMIN), payoutController.getAllPayouts);
router.post('/create', authenticate, authorize(ROLES.ADMIN), payoutController.createPayout);
router.patch('/:id/finalize', authenticate, authorize(ROLES.ADMIN), payoutController.finalizePayout);

module.exports = router;
