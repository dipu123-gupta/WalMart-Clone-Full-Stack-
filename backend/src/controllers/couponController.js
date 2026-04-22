const Coupon = require('../models/Coupon');
const asyncHandler = require('../middlewares/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

const createCoupon = asyncHandler(async (req, res) => {
  const existing = await Coupon.findOne({ code: req.body.code.toUpperCase() });
  if (existing) throw ApiError.conflict('Coupon code already exists');

  const coupon = await Coupon.create(req.body);
  new ApiResponse(201, 'Coupon created', coupon).send(res, 201);
});

const getAllCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  new ApiResponse(200, 'Coupons fetched', coupons).send(res);
});

const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) throw ApiError.notFound('Coupon not found');
  new ApiResponse(200, 'Coupon deleted').send(res);
});

const toggleCouponStatus = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) throw ApiError.notFound('Coupon not found');
  
  coupon.isActive = !coupon.isActive;
  await coupon.save();
  
  new ApiResponse(200, `Coupon ${coupon.isActive ? 'activated' : 'deactivated'}`, coupon).send(res);
});

const getPublicCoupons = asyncHandler(async (req, res) => {
  const now = new Date();
  const coupons = await Coupon.find({
    isActive: true,
    validFrom: { $lte: now },
    validTo: { $gte: now }
  }).select('code description discountType discountValue minOrderAmount').sort({ createdAt: -1 });

  new ApiResponse(200, 'Active coupons fetched', coupons).send(res);
});

module.exports = { createCoupon, getAllCoupons, deleteCoupon, toggleCouponStatus, getPublicCoupons };
