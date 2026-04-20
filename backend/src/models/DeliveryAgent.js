const mongoose = require('mongoose');

const deliveryAgentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    vehicleType: {
      type: String,
      enum: ['bike', 'scooter', 'van', 'truck'],
      default: 'bike',
    },
    vehicleNumber: {
      type: String,
      trim: true,
      default: '',
    },
    licenseNumber: {
      type: String,
      trim: true,
      default: '',
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    currentLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },
    totalDeliveries: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 5,
      min: 0,
      max: 5,
    },
    activeOrderCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

deliveryAgentSchema.index({ currentLocation: '2dsphere' });
deliveryAgentSchema.index({ isAvailable: 1, activeOrderCount: 1 });
deliveryAgentSchema.index({ userId: 1 });

const DeliveryAgent = mongoose.model('DeliveryAgent', deliveryAgentSchema);

module.exports = DeliveryAgent;
