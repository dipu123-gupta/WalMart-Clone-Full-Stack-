const paymentService = require('../services/paymentService');
const asyncHandler = require('../middlewares/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const createOrder = asyncHandler(async (req, res) => {
  const result = await paymentService.createRazorpayOrder(req.user._id, req.body.orderId);
  new ApiResponse(200, 'Razorpay order created', result).send(res);
});

const verifyPayment = asyncHandler(async (req, res) => {
  const result = await paymentService.verifyPayment(req.user._id, req.body);
  new ApiResponse(200, result.message).send(res);
});

const handleWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  await paymentService.handleWebhook(req.body, signature);
  res.status(200).json({ status: 'ok' });
});

const processRefund = asyncHandler(async (req, res) => {
  const result = await paymentService.processRefund(req.params.id, req.body);
  new ApiResponse(200, result.message, result).send(res);
});

module.exports = { createOrder, verifyPayment, handleWebhook, processRefund };
