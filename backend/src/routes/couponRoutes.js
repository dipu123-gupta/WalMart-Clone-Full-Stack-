const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { authenticate } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const { ROLES } = require('../constants/roles');

router.use(authenticate, authorize(ROLES.ADMIN));

router.get('/', couponController.getAllCoupons);
router.post('/', couponController.createCoupon);
router.patch('/:id/toggle', couponController.toggleCouponStatus);
router.delete('/:id', couponController.deleteCoupon);

module.exports = router;
