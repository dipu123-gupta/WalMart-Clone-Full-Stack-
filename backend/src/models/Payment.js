const mongoose = require('mongoose');
const { PAYMENT_STATUS_LIST, PAYMENT_METHOD_LIST } = require('../constants/paymentStatus');

const refundSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  reason: { type: String, default: '' },
  razorpayRefundId: { type: String, default: '' },
  status: {
    type: String,
    enum: ['initiated', 'processed', 'failed'],
    default: 'initiated',
  },
  createdAt: { type: Date, default: Date.now },
});

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    razorpayOrderId: { type: String, default: '' },
    razorpayPaymentId: { type: String, default: '' },
    razorpaySignature: { type: String, default: '' },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    method: {
      type: String,
      enum: PAYMENT_METHOD_LIST,
      required: true,
    },
    status: {
      type: String,
      enum: PAYMENT_STATUS_LIST,
      default: 'created',
    },
    refunds: [refundSchema],
    failureReason: { type: String, default: '' },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ orderId: 1 });
paymentSchema.index({ userId: 1 });
paymentSchema.index({ razorpayOrderId: 1 });
paymentSchema.index({ status: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
