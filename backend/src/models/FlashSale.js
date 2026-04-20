const mongoose = require('mongoose');

const flashSaleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    products: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        salePrice: { type: Number, required: true },
        stockLimit: { type: Number, required: true },
        soldCount: { type: Number, default: 0 },
      },
    ],
    isActive: {
      type: Boolean,
      default: false,
    },
    bannerImage: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
  }
);

flashSaleSchema.index({ startTime: 1, endTime: 1, isActive: 1 });

const FlashSale = mongoose.model('FlashSale', flashSaleSchema);

module.exports = FlashSale;
