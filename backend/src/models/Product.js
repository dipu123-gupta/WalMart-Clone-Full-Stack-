const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    shortDescription: {
      type: String,
      maxlength: [500, 'Short description cannot exceed 500 characters'],
      default: '',
    },
    brand: {
      type: String,
      trim: true,
      default: '',
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Seller is required'],
    },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
        alt: { type: String, default: '' },
        isPrimary: { type: Boolean, default: false },
      },
    ],
    basePrice: {
      type: Number,
      required: [true, 'Base price is required'],
      min: [0, 'Price cannot be negative'],
    },
    salePrice: {
      type: Number,
      min: [0, 'Sale price cannot be negative'],
      default: null,
    },
    taxRate: {
      type: Number,
      default: 18, // GST percentage
      min: 0,
      max: 100,
    },
    specifications: [
      {
        key: { type: String, required: true },
        value: { type: String, required: true },
      },
    ],
    tags: [{ type: String, trim: true, lowercase: true }],
    status: {
      type: String,
      enum: ['draft', 'pending_approval', 'active', 'rejected', 'archived'],
      default: 'pending_approval',
    },
    approvalNote: {
      type: String,
      default: '',
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
    avgRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalSold: {
      type: Number,
      default: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    seoTitle: {
      type: String,
      maxlength: 70,
      default: '',
    },
    seoDescription: {
      type: String,
      maxlength: 160,
      default: '',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Text index for search
productSchema.index({ name: 'text', description: 'text', brand: 'text', tags: 'text' });

// Compound indexes
productSchema.index({ sellerId: 1, status: 1 });
productSchema.index({ categoryId: 1, status: 1 });
productSchema.index({ status: 1, createdAt: -1 });
productSchema.index({ basePrice: 1 });
productSchema.index({ avgRating: -1 });
productSchema.index({ totalSold: -1 });
productSchema.index({ isFeatured: 1, status: 1 });
productSchema.index({ isDeleted: 1 });

// Virtual: effective price
productSchema.virtual('effectivePrice').get(function () {
  return this.salePrice && this.salePrice < this.basePrice ? this.salePrice : this.basePrice;
});

// Virtual: discount percentage
productSchema.virtual('discountPercent').get(function () {
  if (!this.salePrice || this.salePrice >= this.basePrice) return 0;
  return Math.round(((this.basePrice - this.salePrice) / this.basePrice) * 100);
});

// Virtual: variants
productSchema.virtual('variants', {
  ref: 'ProductVariant',
  localField: '_id',
  foreignField: 'productId',
});

// Pre-find: exclude soft-deleted
productSchema.pre(/^find/, function () {
  if (this.getQuery().isDeleted === undefined) {
    this.where({ isDeleted: false });
  }
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
