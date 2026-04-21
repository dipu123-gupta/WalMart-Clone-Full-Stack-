const Payout = require('../models/Payout');
const Seller = require('../models/Seller');
const DeliveryAgent = require('../models/DeliveryAgent');
const Transaction = require('../models/Transaction');
const asyncHandler = require('../middlewares/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

/**
 * @desc    Request a withdrawal (Seller or Delivery Agent)
 * @route   POST /api/v1/payouts/request
 * @access  Private (Seller, Delivery Agent)
 */
const requestWithdrawal = asyncHandler(async (req, res) => {
  const { amount, adminNote } = req.body;
  const userId = req.user._id;
  const userRole = req.user.role === 'seller' ? 'seller' : 'delivery_agent';

  let profile;
  if (userRole === 'seller') {
    profile = await Seller.findOne({ userId });
    if (!profile) throw ApiError.notFound('Seller profile not found');
  } else {
    profile = await DeliveryAgent.findOne({ userId });
    if (!profile) throw ApiError.notFound('Delivery Agent profile not found');
  }

  if (profile.currentBalance < amount) {
    throw ApiError.badRequest('Insufficient balance for withdrawal');
  }

  const payoutRequest = await Payout.create({
    userId,
    userRole,
    sellerId: userRole === 'seller' ? profile._id : undefined,
    agentId: userRole === 'delivery_agent' ? profile._id : undefined,
    amount,
    adminNote,
    status: 'pending'
  });

  new ApiResponse(201, 'Withdrawal request submitted', payoutRequest).send(res, 201);
});

/**
 * @desc    Finalize a payout (Admin only)
 * @route   PUT /api/v1/payouts/:id/finalize
 * @access  Private (Admin)
 */
const finalizePayout = asyncHandler(async (req, res) => {
  const { transactionId } = req.body;
  const payout = await Payout.findById(req.params.id);
  
  if (!payout) throw ApiError.notFound('Payout record not found');
  if (payout.status === 'completed') throw ApiError.badRequest('Payout already finalized');

  payout.status = 'completed';
  payout.transactionId = transactionId;
  payout.processedAt = new Date();
  await payout.save();

  // Deduct from balance and increase paidAmount
  if (payout.userRole === 'seller') {
    await Seller.findByIdAndUpdate(payout.sellerId, {
      $inc: { currentBalance: -payout.amount, paidAmount: payout.amount }
    });
  } else if (payout.userRole === 'delivery_agent') {
    await DeliveryAgent.findByIdAndUpdate(payout.agentId, {
      $inc: { currentBalance: -payout.amount, paidAmount: payout.amount }
    });
  }

  // Log Transaction
  await Transaction.create({
    userId: payout.userId,
    userRole: payout.userRole,
    amount: payout.amount,
    type: 'debit',
    category: 'payout',
    description: `Payout of ₹${payout.amount} completed. Transaction ID: ${transactionId}`,
  });

  new ApiResponse(200, 'Payout finalized and balance updated', payout).send(res);
});

/**
 * @desc    Get payout history for current user
 * @route   GET /api/v1/payouts/my
 * @access  Private (Seller, Delivery Agent)
 */
const getMyPayouts = asyncHandler(async (req, res) => {
  const payouts = await Payout.find({ userId: req.user._id }).sort({ createdAt: -1 });
  new ApiResponse(200, 'Your payouts fetched', payouts).send(res);
});

/**
 * @desc    Get all payouts (Admin only)
 * @route   GET /api/v1/payouts
 * @access  Private (Admin)
 */
const getAllPayouts = asyncHandler(async (req, res) => {
  const payouts = await Payout.find()
    .populate('sellerId', 'businessName')
    .populate('agentId', 'fullName')
    .sort({ createdAt: -1 });
  new ApiResponse(200, 'All payouts fetched', payouts).send(res);
});

module.exports = { 
  requestWithdrawal, 
  finalizePayout, 
  getMyPayouts, 
  getAllPayouts 
};
