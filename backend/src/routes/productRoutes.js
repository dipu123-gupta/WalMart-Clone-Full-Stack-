const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const questionController = require('../controllers/questionController');
const reviewController = require('../controllers/reviewController');
const { optionalAuth, authenticate } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const { uploadImage } = require('../middlewares/uploadMiddleware');
const { cacheMiddleware } = require('../middlewares/cacheMiddleware');
const { ROLES } = require('../constants/roles');

// Public
router.get('/', cacheMiddleware(300), productController.getProducts);
router.get('/featured', cacheMiddleware(600), productController.getFeaturedProducts);
router.get('/search', productController.searchProducts);
router.get('/suggestions', productController.getSuggestions);
router.get('/recently-viewed', authenticate, productController.getRecentlyViewed);
router.get('/:slug', optionalAuth, productController.getProductBySlug);

// Reviews
router.get('/:productId/reviews', reviewController.getProductReviews);
router.post('/:productId/reviews', authenticate, reviewController.addReview);

// Q&A
router.get('/:productId/questions', questionController.getProductQuestions);
router.post('/questions', authenticate, questionController.askQuestion);
router.patch('/questions/:id/answer', authenticate, authorize(ROLES.SELLER, ROLES.ADMIN), questionController.answerQuestion);

module.exports = router;
