const orderService = require('../services/orderService');
const asyncHandler = require('../middlewares/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const pdfService = require('../services/pdfService');

const placeOrder = asyncHandler(async (req, res) => {
  const order = await orderService.placeOrder(req.user._id, req.body);
  new ApiResponse(201, 'Order placed successfully', order).send(res, 201);
});

const getUserOrders = asyncHandler(async (req, res) => {
  const result = await orderService.getUserOrders(req.user._id, req.query);
  new ApiResponse(200, 'Orders fetched', result.orders, result.meta).send(res);
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(req.user._id, req.params.id);
  new ApiResponse(200, 'Order details', order).send(res);
});

const cancelOrder = asyncHandler(async (req, res) => {
  const order = await orderService.cancelOrder(req.user._id, req.params.id, req.body);
  new ApiResponse(200, 'Order cancelled', order).send(res);
});

const requestReturn = asyncHandler(async (req, res) => {
  const order = await orderService.requestReturn(req.user._id, req.params.id, req.body);
  new ApiResponse(200, 'Return requested', order).send(res);
});

// Seller
const getSellerOrders = asyncHandler(async (req, res) => {
  const result = await orderService.getSellerOrders(req.user._id, req.query);
  new ApiResponse(200, 'Seller orders', result.orders, result.meta).send(res);
});

const updateOrderItemStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateOrderItemStatus(
    req.user._id, req.params.id, req.params.itemId, req.body
  );
  new ApiResponse(200, 'Item status updated', order).send(res);
});

// Admin
const getAllOrders = asyncHandler(async (req, res) => {
  const result = await orderService.getAllOrders(req.query);
  new ApiResponse(200, 'All orders', result.orders, result.meta).send(res);
});

const adminUpdateStatus = asyncHandler(async (req, res) => {
  const order = await orderService.adminUpdateOrderStatus(req.params.id, req.body, req.user._id);
  new ApiResponse(200, 'Order status updated', order).send(res);
});

const approveReturn = asyncHandler(async (req, res) => {
  const order = await orderService.approveReturn(req.params.id, req.body, req.user._id);
  new ApiResponse(200, 'Return processed', order).send(res);
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateOrderStatus(req.user._id, req.params.id, req.body.status);
  new ApiResponse(200, 'Order status updated', order).send(res);
});

const downloadInvoice = asyncHandler(async (req, res) => {
  await pdfService.generateInvoicePDF(req.params.id, req.user._id, res);
});

// Delivery Agent
const getDeliveryTasks = asyncHandler(async (req, res) => {
  const tasks = await orderService.getDeliveryTasks(req.user._id);
  new ApiResponse(200, 'Delivery tasks', tasks).send(res);
});

const assignDeliveryAgent = asyncHandler(async (req, res) => {
  const order = await orderService.assignDeliveryAgent(req.params.id, req.body.agentId);
  new ApiResponse(200, 'Agent assigned', order).send(res);
});

module.exports = {
  placeOrder, getUserOrders, getOrderById, cancelOrder, requestReturn,
  getSellerOrders, updateOrderItemStatus, updateOrderStatus,
  getAllOrders, adminUpdateStatus, approveReturn, downloadInvoice,
  getDeliveryTasks, assignDeliveryAgent,
};
