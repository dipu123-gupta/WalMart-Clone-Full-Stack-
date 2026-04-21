const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const Payment = require('../models/Payment');
const asyncHandler = require('../middlewares/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const env = require('../config/env');

const getOverview = asyncHandler(async (req, res) => {
  const [totalUsers, totalOrders, totalProducts, financeResult, recentOrders] = await Promise.all([
    User.countDocuments({ role: 'customer' }),
    Order.countDocuments(),
    Product.countDocuments({ status: 'active' }),
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$pricing.total' },
          platformProfit: { $sum: { $sum: '$items.commissionAmount' } },
          totalShipping: { $sum: '$pricing.shippingFee' },
          count: { $sum: 1 },
        },
      },
    ]),
    Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'firstName lastName')
      .select('orderNumber orderStatus pricing createdAt userId')
      .lean(),
  ]);

  const stats = financeResult[0] || { totalRevenue: 0, platformProfit: 0, totalShipping: 0 };
  
  new ApiResponse(200, 'Overview', {
    totalUsers,
    totalOrders,
    totalProducts,
    totalRevenue: stats.totalRevenue,
    platformProfit: stats.platformProfit,
    totalShipping: stats.totalShipping,
    recentOrders,
  }).send(res);
});

const getRevenueAnalytics = asyncHandler(async (req, res) => {
  const { period = '30d' } = req.query;
  let days = 30;
  if (period === '7d') days = 7;
  if (period === '90d') days = 90;
  if (period === '1y') days = 365;

  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const revenue = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        paymentStatus: { $in: ['paid', 'partially_refunded'] },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$pricing.total' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  new ApiResponse(200, 'Revenue analytics', revenue).send(res);
});

const getOrderAnalytics = asyncHandler(async (req, res) => {
  const statusDistribution = await Order.aggregate([
    { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const paymentMethods = await Order.aggregate([
    { $group: { _id: '$paymentMethod', count: { $sum: 1 }, revenue: { $sum: '$pricing.total' } } },
  ]);

  new ApiResponse(200, 'Order analytics', { statusDistribution, paymentMethods }).send(res);
});

const getUserAnalytics = asyncHandler(async (req, res) => {
  const newUsersPerDay = await User.aggregate([
    { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const roleDistribution = await User.aggregate([
    { $group: { _id: '$role', count: { $sum: 1 } } },
  ]);

  new ApiResponse(200, 'User analytics', { newUsersPerDay, roleDistribution }).send(res);
});

const getTopProducts = asyncHandler(async (req, res) => {
  const topProducts = await Product.find({ status: 'active' })
    .sort({ totalSold: -1 })
    .limit(20)
    .select('name slug images basePrice salePrice totalSold avgRating')
    .lean();

  new ApiResponse(200, 'Top products', topProducts).send(res);
});

const getFraudAlerts = asyncHandler(async (req, res) => {
  // Simple fraud detection: unusual patterns
  const alerts = [];

  // Multiple failed payments from same user
  const failedPayments = await Payment.aggregate([
    { $match: { status: 'failed', createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } },
    { $group: { _id: '$userId', count: { $sum: 1 } } },
    { $match: { count: { $gte: 3 } } },
  ]);
  failedPayments.forEach((fp) => {
    alerts.push({ type: 'payment_failure', userId: fp._id, count: fp.count, severity: 'high' });
  });

  // High-value orders
  const highValueOrders = await Order.find({
    'pricing.total': { $gte: env.HIGH_VALUE_ORDER_THRESHOLD },
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  })
    .populate('userId', 'firstName lastName email createdAt')
    .select('orderNumber pricing userId createdAt')
    .lean();

  highValueOrders.forEach((o) => {
    const accountAgeDays = (Date.now() - new Date(o.userId.createdAt)) / (1000 * 60 * 60 * 24);
    if (accountAgeDays < 7) {
      alerts.push({
        type: 'new_account_high_value',
        orderId: o._id,
        orderNumber: o.orderNumber,
        amount: o.pricing.total,
        userId: o.userId,
        severity: 'medium',
      });
    }
  });

  new ApiResponse(200, 'Fraud alerts', alerts).send(res);
});

module.exports = { getOverview, getRevenueAnalytics, getOrderAnalytics, getUserAnalytics, getTopProducts, getFraudAlerts };
