const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true, // Must be a verified purchase
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      trim: true,
      maxlength: 100,
      default: '',
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    images: [
      {
        url: { type: String },
        publicId: { type: String },
      },
    ],
    isVerifiedPurchase: {
      type: Boolean,
      default: true,
    },
    isApproved: {
      type: Boolean,
      default: true, // Auto-approve by default, admin can moderate
    },
    moderationNote: {
      type: String,
      default: '',
    },
    helpfulCount: {
      type: Number,
      default: 0,
    },
    reportCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// One review per user per product
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });
reviewSchema.index({ productId: 1, isApproved: 1, createdAt: -1 });
reviewSchema.index({ userId: 1 });

// Static: Calculate average rating for a product
reviewSchema.statics.calculateAvgRating = async function (productId) {
  const result = await this.aggregate([
    { $match: { productId, isApproved: true } },
    {
      $group: {
        _id: '$productId',
        avgRating: { $avg: '$rating' },
        totalRatings: { $sum: 1 },
      },
    },
  ]);

  const Product = mongoose.model('Product');
  if (result.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      avgRating: Math.round(result[0].avgRating * 10) / 10,
      totalRatings: result[0].totalRatings,
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      avgRating: 0,
      totalRatings: 0,
    });
  }
};

// Post-save: recalculate rating
reviewSchema.post('save', async function () {
  await this.constructor.calculateAvgRating(this.productId);
});

reviewSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    await doc.constructor.calculateAvgRating(doc.productId);
  }
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
