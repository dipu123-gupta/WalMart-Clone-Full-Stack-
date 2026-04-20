const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { cacheMiddleware } = require('../middlewares/cacheMiddleware');

// Public
router.get('/', cacheMiddleware(600), categoryController.getAllCategories);
router.get('/:slug', cacheMiddleware(300), categoryController.getCategoryBySlug);

module.exports = router;
