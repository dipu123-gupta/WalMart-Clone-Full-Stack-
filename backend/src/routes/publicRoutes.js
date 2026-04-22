const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

router.post('/subscribe', publicController.subscribe);
router.get('/settings', publicController.getSettings);
router.get('/coupons/active', publicController.getActiveCoupons);

module.exports = router;
