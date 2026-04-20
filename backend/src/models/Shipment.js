const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeliveryAgent',
      default: null,
    },
    status: {
      type: String,
      enum: ['assigned', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'returned'],
      default: 'assigned',
    },
    trackingHistory: [
      {
        status: { type: String, required: true },
        location: {
          type: { type: String, default: 'Point' },
          coordinates: { type: [Number], default: [0, 0] },
        },
        timestamp: { type: Date, default: Date.now },
        note: { type: String, default: '' },
      },
    ],
    estimatedDelivery: { type: Date },
    actualDelivery: { type: Date },
    deliveryProof: {
      imageUrl: { type: String, default: '' },
      signature: { type: String, default: '' },
      otp: { type: String, default: '' },
    },
    failureReason: { type: String, default: '' },
    attemptCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

shipmentSchema.index({ orderId: 1 });
shipmentSchema.index({ agentId: 1, status: 1 });

const Shipment = mongoose.model('Shipment', shipmentSchema);

module.exports = Shipment;
