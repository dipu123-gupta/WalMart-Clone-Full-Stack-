const Seller = require('../models/Seller');
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../constants/roles');
const { buildPagination, buildPaginationMeta } = require('../utils/pagination');
const { eventEmitter, EVENTS } = require('../events/eventEmitter');
const asyncHandler = require('../middlewares/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const registerSeller = asyncHandler(async (req, res) => {
  const existing = await Seller.findOne({ userId: req.user._id });
  if (existing) throw ApiError.conflict('Seller application already exists');

  const seller = await Seller.create({ userId: req.user._id, ...req.body });
  new ApiResponse(201, 'Seller application submitted', seller).send(res, 201);
});

const getSellerDashboard = asyncHandler(async (req, res) => {
  const mongoose = require('mongoose');
  const sellerId = new mongoose.Types.ObjectId(req.user._id);

  // Auto-create seller profile if first time
  let seller = await Seller.findOne({ userId: sellerId });
  if (!seller) {
    seller = await Seller.create({
      userId: sellerId,
      businessName: `${req.user.firstName}'s Store`,
      status: 'pending',
    });
  }

  const Inventory = require('../models/Inventory');
  const [totalProducts, activeProducts, totalOrders, recentOrders, revenue, lowStockCount, lowStockProducts] = await Promise.all([
    Product.countDocuments({ sellerId }),
    Product.countDocuments({ sellerId, status: 'active' }),
    Order.countDocuments({ 'items.sellerId': sellerId }),
    Order.find({ 'items.sellerId': sellerId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('orderNumber orderStatus pricing createdAt')
      .lean(),
    Order.aggregate([
      { $match: { 'items.sellerId': sellerId, paymentStatus: 'paid' } },
      { $unwind: '$items' },
      { $match: { 'items.sellerId': sellerId } },
      { $group: { _id: null, total: { $sum: '$items.total' } } },
    ]),
    Inventory.countDocuments({
      sellerId,
      $expr: { $lt: ['$quantity', '$lowStockThreshold'] },
    }),
    Inventory.find({
      sellerId,
      $expr: { $lt: ['$quantity', '$lowStockThreshold'] },
    })
      .populate('productId', 'name')
      .limit(10)
      .lean(),
  ]);

  new ApiResponse(200, 'Dashboard data', {
    seller,
    stats: {
      totalProducts,
      activeProducts,
      totalOrders,
      totalRevenue: revenue[0]?.total || 0,
      lowStock: lowStockCount || 0,
      lowStockProducts: lowStockProducts.map((inv) => ({
        _id: inv.productId?._id,
        name: inv.productId?.name || 'Unknown',
        inventory: { quantity: inv.quantity },
      })),
    },
    recentOrders,
  }).send(res);
});

const getSellerProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ sellerId: req.user._id })
    .populate('categoryId', 'name')
    .sort({ createdAt: -1 })
    .lean();
  new ApiResponse(200, 'Seller products fetched', { results: products }).send(res);
});

const getPayouts = asyncHandler(async (req, res) => {
  // Placeholder — in production, integrate with Razorpay Route / payouts
  const seller = await Seller.findOne({ userId: req.user._id });
  new ApiResponse(200, 'Payouts', {
    commissionRate: seller?.commissionRate || 10,
    totalRevenue: seller?.totalRevenue || 0,
    pendingPayout: 0,
    payoutHistory: [],
  }).send(res);
});

// Admin
const getAllSellers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const [sellers, total] = await Promise.all([
    Seller.find(filter)
      .populate('userId', 'firstName lastName email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Seller.countDocuments(filter),
  ]);

  new ApiResponse(200, 'Sellers fetched', sellers, buildPaginationMeta(total, page, limit)).send(res);
});

const approveSeller = asyncHandler(async (req, res) => {
  const { status, rejectionReason } = req.body;
  if (!['approved', 'rejected', 'suspended'].includes(status)) {
    throw ApiError.badRequest('Invalid status');
  }

  const seller = await Seller.findByIdAndUpdate(
    req.params.id,
    { status, rejectionReason: rejectionReason || '' },
    { new: true }
  ).populate('userId', 'firstName lastName email');

  if (!seller) throw ApiError.notFound('Seller not found');

  // Update user role if approved
  if (status === 'approved') {
    await User.findByIdAndUpdate(seller.userId._id, { role: ROLES.SELLER });
    eventEmitter.emit(EVENTS.SELLER_APPROVED, { seller, user: seller.userId });
  } else if (status === 'rejected') {
    eventEmitter.emit(EVENTS.SELLER_REJECTED, { seller, user: seller.userId });
  }

  new ApiResponse(200, 'Seller status updated', seller).send(res);
});

const setCommission = asyncHandler(async (req, res) => {
  const { commissionRate } = req.body;
  if (commissionRate < 0 || commissionRate > 100) {
    throw ApiError.badRequest('Commission must be 0-100');
  }
  const seller = await Seller.findByIdAndUpdate(
    req.params.id,
    { commissionRate },
    { new: true }
  );
  if (!seller) throw ApiError.notFound('Seller not found');
  new ApiResponse(200, 'Commission updated', seller).send(res);
});

const getSellerAnalytics = asyncHandler(async (req, res) => {
  const mongoose = require('mongoose');
  const sellerId = new mongoose.Types.ObjectId(req.user._id);

  const { period = '30d' } = req.query;
  let days = 30;
  if (period === '7d') days = 7;
  if (period === '90d') days = 90;

  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const analytics = await Order.aggregate([
    {
      $match: {
        'items.sellerId': sellerId,
        createdAt: { $gte: startDate },
        paymentStatus: { $in: ['paid', 'partially_refunded'] },
      },
    },
    { $unwind: '$items' },
    { $match: { 'items.sellerId': sellerId } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$items.total' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  new ApiResponse(200, 'Seller analytics', analytics).send(res);
});

const getSellerProfile = asyncHandler(async (req, res) => {
  const seller = await Seller.findOne({ userId: req.user._id });
  if (!seller) throw ApiError.notFound('Seller profile not found');
  new ApiResponse(200, 'Seller profile fetched', seller).send(res);
});

const updateSellerProfile = asyncHandler(async (req, res) => {
  const { businessName, description, supportEmail, payoutDetails } = req.body;
  
  const updateData = {
    businessName,
    description,
    supportEmail
  };

  // Map frontend's payoutDetails to backend's bankDetails
  if (payoutDetails) {
    updateData.bankDetails = {
      accountName: payoutDetails.accountName,
      accountNumber: payoutDetails.accountNumber,
      ifscCode: payoutDetails.ifscCode
    };
  }

  const seller = await Seller.findOneAndUpdate(
    { userId: req.user._id },
    updateData,
    { new: true, runValidators: true }
  );

  if (!seller) throw ApiError.notFound('Seller profile not found');
  new ApiResponse(200, 'Seller profile updated', seller).send(res);
});

const updateLogo = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('Logo file is required');

  const seller = await Seller.findOne({ userId: req.user._id });
  if (!seller) throw ApiError.notFound('Seller profile not found');

  // New logo from Cloudinary (via middleware)
  seller.logo = {
    url: req.file.path,
    publicId: req.file.filename
  };

  await seller.save();
  new ApiResponse(200, 'Logo updated successfully', seller.logo).send(res);
});

module.exports = { 
  registerSeller, 
  getSellerDashboard, 
  getSellerAnalytics, 
  getPayouts, 
  getAllSellers, 
  approveSeller, 
  setCommission,
  getSellerProducts,
  getSellerProfile,
  updateSellerProfile,
  updateLogo,
};
