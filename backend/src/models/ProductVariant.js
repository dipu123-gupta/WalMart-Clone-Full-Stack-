const mongoose = require('mongoose');

const productVariantSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true, // e.g., "Red - XL"
    },
    attributes: {
      type: Map,
      of: String,
      default: {}, // e.g., { color: "Red", size: "XL" }
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    salePrice: {
      type: Number,
      min: 0,
      default: null,
    },
    images: [
      {
        url: { type: String },
        publicId: { type: String },
      },
    ],
    weight: {
      type: Number,
      default: 0, // in grams
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

productVariantSchema.index({ productId: 1 });

// Virtual: inventory
productVariantSchema.virtual('inventory', {
  ref: 'Inventory',
  localField: '_id',
  foreignField: 'variantId',
  justOne: true,
});

const ProductVariant = mongoose.model('ProductVariant', productVariantSchema);

module.exports = ProductVariant;
