const Review = require('../models/Review');
const Order = require('../models/Order');
const ApiError = require('../utils/ApiError');
const { buildPagination, buildPaginationMeta } = require('../utils/pagination');

class ReviewService {
  async getProductReviews(productId, query) {
    const { page, limit, skip } = buildPagination(query);
    const filter = { productId, isApproved: true };

    if (query.rating) filter.rating = Number(query.rating);

    let sort = { createdAt: -1 };
    if (query.sort === 'helpful') sort = { helpfulCount: -1 };
    if (query.sort === 'rating_high') sort = { rating: -1 };
    if (query.sort === 'rating_low') sort = { rating: 1 };

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate('userId', 'firstName lastName avatar')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(filter),
    ]);

    // Rating distribution
    const distribution = await Review.aggregate([
      { $match: { productId: require('mongoose').Types.ObjectId.createFromHexString(productId), isApproved: true } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
    ]);

    return {
      reviews,
      meta: buildPaginationMeta(total, page, limit),
      distribution: distribution.reduce((acc, d) => { acc[d._id] = d.count; return acc; }, {}),
    };
  }

  async addReview(userId, productId, data) {
    // Check if already reviewed
    const existing = await Review.findOne({ userId, productId });
    if (existing) throw ApiError.conflict('You have already reviewed this product');

    // Verify purchase
    const order = await Order.findOne({
      userId,
      'items.productId': productId,
      orderStatus: 'delivered',
    });
    if (!order) throw ApiError.forbidden('You can only review products you have purchased and received');

    // Basic Fraud Detection: Velocity Check
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentReviews = await Review.countDocuments({
      userId,
      createdAt: { $gte: oneHourAgo }
    });
    if (recentReviews >= 3) {
      throw ApiError.badRequest('Rate limit exceeded: Suspected bot activity / Spam reviews');
    }

    const review = await Review.create({
      userId,
      productId,
      orderId: order._id,
      ...data,
      isVerifiedPurchase: true,
    });

    return review;
  }

  async updateReview(userId, reviewId, data) {
    const review = await Review.findOne({ _id: reviewId, userId });
    if (!review) throw ApiError.notFound('Review not found');

    const allowedUpdates = ['rating', 'title', 'comment'];
    for (const key of allowedUpdates) {
      if (data[key] !== undefined) review[key] = data[key];
    }
    await review.save();
    return review;
  }

  async deleteReview(userId, reviewId) {
    const review = await Review.findOneAndDelete({ _id: reviewId, userId });
    if (!review) throw ApiError.notFound('Review not found');
    return { message: 'Review deleted' };
  }

  async moderateReview(reviewId, { isApproved, moderationNote }) {
    const review = await Review.findByIdAndUpdate(
      reviewId,
      { isApproved, moderationNote: moderationNote || '' },
      { new: true }
    );
    if (!review) throw ApiError.notFound('Review not found');
    return review;
  }
}

module.exports = new ReviewService();
