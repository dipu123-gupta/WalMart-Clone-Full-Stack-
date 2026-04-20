const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticate } = require('../middlewares/authMiddleware');

// Public
router.get('/products/:id/reviews', reviewController.getProductReviews);

// Authenticated
router.post('/products/:id/reviews', authenticate, reviewController.addReview);
router.patch('/reviews/:id', authenticate, reviewController.updateReview);
router.delete('/reviews/:id', authenticate, reviewController.deleteReview);

module.exports = router;
