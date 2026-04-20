const Payout = require('../models/Payout');
const Seller = require('../models/Seller');
const asyncHandler = require('../middlewares/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

const createPayout = asyncHandler(async (req, res) => {
  const { sellerId, amount, adminNote } = req.body;
  const seller = await Seller.findById(sellerId);
  if (!seller) throw ApiError.notFound('Seller not found');

  const pendingPayout = await Payout.create({
    sellerId,
    amount,
    adminNote
  });

  new ApiResponse(201, 'Payout record created', pendingPayout).send(res, 201);
});

const finalizePayout = asyncHandler(async (req, res) => {
  const { transactionId } = req.body;
  const payout = await Payout.findById(req.params.id);
  if (!payout) throw ApiError.notFound('Payout not found');

  if (payout.status === 'completed') throw ApiError.badRequest('Payout already finalized');

  payout.status = 'completed';
  payout.transactionId = transactionId;
  payout.processedAt = new Date();
  await payout.save();

  // Update seller paid amount
  await Seller.findByIdAndUpdate(payout.sellerId, {
    $inc: { paidAmount: payout.amount }
  });

  new ApiResponse(200, 'Payout finalized', payout).send(res);
});

const getSellerPayouts = asyncHandler(async (req, res) => {
    // Logic for seller to see their history
    const seller = await Seller.findOne({ userId: req.user._id });
    const payouts = await Payout.find({ sellerId: seller._id }).sort({ createdAt: -1 });
    new ApiResponse(200, 'Payouts fetched', payouts).send(res);
});

const getAllPayouts = asyncHandler(async (req, res) => {
    // Admin view
    const payouts = await Payout.find().populate('sellerId', 'businessName').sort({ createdAt: -1 });
    new ApiResponse(200, 'All payouts fetched', payouts).send(res);
});

module.exports = { createPayout, finalizePayout, getSellerPayouts, getAllPayouts };
