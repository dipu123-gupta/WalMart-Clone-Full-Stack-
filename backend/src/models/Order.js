const mongoose = require('mongoose');
const { ORDER_STATUS, ORDER_STATUS_LIST } = require('../constants/orderStatus');
const { PAYMENT_METHOD_LIST } = require('../constants/paymentStatus');

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', default: null },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  image: { type: String, default: '' },
  sku: { type: String, default: '' },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  taxRate: { type: Number, default: 18 },
  taxAmount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'return_requested', 'returned', 'refunded'],
    default: 'pending',
  },
  commissionAmount: { type: Number, default: 0 },
  sellerNetProceeds: { type: Number, default: 0 },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [orderItemSchema],
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      addressLine1: { type: String, required: true },
      addressLine2: { type: String, default: '' },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, default: 'India' },
      landmark: { type: String, default: '' },
    },
    pricing: {
      subtotal: { type: Number, required: true },
      taxAmount: { type: Number, default: 0 },
      shippingFee: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      couponCode: { type: String, default: '' },
      total: { type: Number, required: true },
    },
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHOD_LIST,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
      default: 'pending',
    },
    orderStatus: {
      type: String,
      enum: ORDER_STATUS_LIST,
      default: ORDER_STATUS.PENDING,
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        note: { type: String, default: '' },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    invoiceUrl: { type: String, default: '' },
    deliveryAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryAgent' },
    estimatedDelivery: { type: Date },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date },
    cancellationReason: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ 'items.sellerId': 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ paymentStatus: 1 });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
