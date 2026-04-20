const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductVariant',
      default: null,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    reservedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
    },
    warehouse: {
      type: String,
      default: 'default',
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Available = total - reserved
inventorySchema.virtual('availableQuantity').get(function () {
  return Math.max(0, this.quantity - this.reservedQuantity);
});

// Low stock check
inventorySchema.virtual('isLowStock').get(function () {
  return this.quantity - this.reservedQuantity <= this.lowStockThreshold;
});

inventorySchema.virtual('isOutOfStock').get(function () {
  return this.quantity - this.reservedQuantity <= 0;
});

inventorySchema.index({ productId: 1, variantId: 1 }, { unique: true });
inventorySchema.index({ sellerId: 1 });
inventorySchema.index({ quantity: 1 });

const Inventory = mongoose.model('Inventory', inventorySchema);

module.exports = Inventory;
