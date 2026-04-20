const reviewService = require('../services/reviewService');
const asyncHandler = require('../middlewares/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const getProductReviews = asyncHandler(async (req, res) => {
  const result = await reviewService.getProductReviews(req.params.id, req.query);
  new ApiResponse(200, 'Reviews fetched', result.reviews, { ...result.meta, distribution: result.distribution }).send(res);
});

const addReview = asyncHandler(async (req, res) => {
  const review = await reviewService.addReview(req.user._id, req.params.id, req.body);
  new ApiResponse(201, 'Review added', review).send(res, 201);
});

const updateReview = asyncHandler(async (req, res) => {
  const review = await reviewService.updateReview(req.user._id, req.params.id, req.body);
  new ApiResponse(200, 'Review updated', review).send(res);
});

const deleteReview = asyncHandler(async (req, res) => {
  await reviewService.deleteReview(req.user._id, req.params.id);
  new ApiResponse(200, 'Review deleted').send(res);
});

const moderateReview = asyncHandler(async (req, res) => {
  const review = await reviewService.moderateReview(req.params.id, req.body);
  new ApiResponse(200, 'Review moderated', review).send(res);
});

module.exports = { getProductReviews, addReview, updateReview, deleteReview, moderateReview };
