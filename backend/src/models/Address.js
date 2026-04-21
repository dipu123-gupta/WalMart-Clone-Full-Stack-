const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      validate: {
        validator: function(v) {
          return /^\d{10,12}$/.test(v);
        },
        message: props => `${props.value} is not a valid 10-12 digit phone number!`
      }
    },
    addressLine1: {
      type: String,
      required: [true, 'Address line 1 is required'],
      trim: true,
    },
    addressLine2: {
      type: String,
      trim: true,
      default: '',
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      trim: true,
      validate: {
        validator: function(v) {
          return /^\d{5,6}$/.test(v);
        },
        message: props => `${props.value} is not a valid pincode!`
      }
    },
    country: {
      type: String,
      default: 'India',
      trim: true,
    },
    landmark: {
      type: String,
      trim: true,
      default: '',
    },
    type: {
      type: String,
      enum: ['home', 'work', 'other'],
      default: 'home',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one default address per user
addressSchema.pre('save', async function () {
  if (this.isDefault) {
    await this.model('Address').updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
});

addressSchema.index({ userId: 1, isDefault: -1 });

const Address = mongoose.model('Address', addressSchema);

module.exports = Address;
