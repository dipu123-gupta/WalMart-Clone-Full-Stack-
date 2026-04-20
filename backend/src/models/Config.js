const mongoose = require('mongoose');

const configSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    group: {
      type: String,
      enum: ['general', 'payment', 'notifications', 'security', 'appearance'],
      default: 'general',
    },
  },
  { timestamps: true }
);

const Config = mongoose.model('Config', configSchema);

module.exports = Config;
