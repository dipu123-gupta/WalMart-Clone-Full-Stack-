const Subscriber = require('../models/Subscriber');
const Config = require('../models/Config');
const Coupon = require('../models/Coupon');
const asyncHandler = require('../middlewares/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

const subscribe = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw ApiError.badRequest('Email is required');

  const existing = await Subscriber.findOne({ email });
  if (existing) {
    return new ApiResponse(200, 'You are already subscribed!').send(res);
  }

  await Subscriber.create({ email });
  new ApiResponse(201, 'Successfully subscribed to newsletter!').send(res, 201);
});

const getSettings = asyncHandler(async (req, res) => {
  const configs = await Config.find({ group: { $in: ['general', 'appearance', 'security'] } });
  const configMap = {};
  configs.forEach(c => {
    configMap[c.key] = c.value;
  });
  new ApiResponse(200, 'Public settings fetched', configMap).send(res);
});

const getActiveCoupons = asyncHandler(async (req, res) => {
  const now = new Date();
  const coupons = await Coupon.find({
    isActive: true,
    validFrom: { $lte: now },
    validTo: { $gte: now }
  }).select('code description discountType discountValue minOrderAmount').sort({ createdAt: -1 });

  new ApiResponse(200, 'Active coupons fetched', coupons).send(res);
});

module.exports = { subscribe, getSettings, getActiveCoupons };
