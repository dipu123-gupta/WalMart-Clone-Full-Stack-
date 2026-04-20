const cartService = require('../services/cartService');
const asyncHandler = require('../middlewares/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const getCart = asyncHandler(async (req, res) => {
  const userId = req.user?._id || null;
  const sessionId = req.headers['x-session-id'] || null;
  const cart = await cartService.getCart(userId, sessionId);
  new ApiResponse(200, 'Cart fetched', cart).send(res);
});

const addItem = asyncHandler(async (req, res) => {
  const userId = req.user?._id || null;
  const sessionId = req.headers['x-session-id'] || null;
  const cart = await cartService.addItem(userId, sessionId, req.body);
  new ApiResponse(200, 'Item added to cart', cart).send(res);
});

const updateItem = asyncHandler(async (req, res) => {
  const userId = req.user?._id || null;
  const sessionId = req.headers['x-session-id'] || null;
  const cart = await cartService.updateItem(userId, sessionId, req.params.itemId, req.body);
  new ApiResponse(200, 'Cart updated', cart).send(res);
});

const removeItem = asyncHandler(async (req, res) => {
  const userId = req.user?._id || null;
  const sessionId = req.headers['x-session-id'] || null;
  const cart = await cartService.removeItem(userId, sessionId, req.params.itemId);
  new ApiResponse(200, 'Item removed', cart).send(res);
});

const clearCart = asyncHandler(async (req, res) => {
  const userId = req.user?._id || null;
  const sessionId = req.headers['x-session-id'] || null;
  await cartService.clearCart(userId, sessionId);
  new ApiResponse(200, 'Cart cleared').send(res);
});

const syncCart = asyncHandler(async (req, res) => {
  const { sessionId } = req.body;
  const cart = await cartService.syncCart(req.user._id, sessionId);
  new ApiResponse(200, 'Cart synced', cart).send(res);
});

const applyCoupon = asyncHandler(async (req, res) => {
  const cart = await cartService.applyCoupon(req.user._id, req.body.code);
  new ApiResponse(200, 'Coupon applied', cart).send(res);
});

const removeCoupon = asyncHandler(async (req, res) => {
  const cart = await cartService.removeCoupon(req.user._id);
  new ApiResponse(200, 'Coupon removed', cart).send(res);
});

module.exports = { getCart, addItem, updateItem, removeItem, clearCart, syncCart, applyCoupon, removeCoupon };
