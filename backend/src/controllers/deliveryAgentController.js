const Order = require('../models/Order');
const DeliveryAgent = require('../models/DeliveryAgent');
const asyncHandler = require('../middlewares/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { ORDER_STATUS } = require('../constants/orderStatus');
const logger = require('../config/logger');

/**
 * Get all tasks assigned to the logged-in delivery agent
 */
const getMyTasks = asyncHandler(async (req, res) => {
  const agent = await DeliveryAgent.findOne({ userId: req.user._id });
  if (!agent) throw ApiError.notFound('Delivery agent profile not found');

  const tasks = await Order.find({
    deliveryAgent: agent._id,
    orderStatus: {
      $in: [
        ORDER_STATUS.CONFIRMED,
        ORDER_STATUS.PROCESSING,
        ORDER_STATUS.SHIPPED,
        ORDER_STATUS.OUT_FOR_DELIVERY,
      ],
    },
  })
    .select('orderNumber orderStatus shippingAddress pricing estimatedDelivery items createdAt')
    .sort({ createdAt: -1 })
    .lean();

  new ApiResponse(200, 'Delivery tasks', tasks).send(res);
});

/**
 * Update delivery status for an assigned order
 * Allowed transitions for agent: shipped → out_for_delivery → delivered
 */
const updateDeliveryStatus = asyncHandler(async (req, res) => {
  const { status, note, failureReason } = req.body;

  const AGENT_ALLOWED_STATUSES = [
    ORDER_STATUS.SHIPPED,
    ORDER_STATUS.OUT_FOR_DELIVERY,
    ORDER_STATUS.DELIVERED,
  ];

  if (!AGENT_ALLOWED_STATUSES.includes(status)) {
    throw ApiError.badRequest(`Invalid status. Allowed: ${AGENT_ALLOWED_STATUSES.join(', ')}`);
  }

  const agent = await DeliveryAgent.findOne({ userId: req.user._id });
  if (!agent) throw ApiError.notFound('Delivery agent profile not found');

  const order = await Order.findOne({
    _id: req.params.orderId,
    deliveryAgent: agent._id,
  });

  if (!order) throw ApiError.notFound('Order not found or not assigned to you');

  // Validate transition
  const VALID_AGENT_TRANSITIONS = {
    [ORDER_STATUS.PROCESSING]:       [ORDER_STATUS.SHIPPED],
    [ORDER_STATUS.SHIPPED]:          [ORDER_STATUS.OUT_FOR_DELIVERY],
    [ORDER_STATUS.OUT_FOR_DELIVERY]: [ORDER_STATUS.DELIVERED],
    [ORDER_STATUS.CONFIRMED]:        [ORDER_STATUS.SHIPPED],
  };

  const allowed = VALID_AGENT_TRANSITIONS[order.orderStatus] || [];
  if (!allowed.includes(status)) {
    throw ApiError.badRequest(
      `Cannot update from '${order.orderStatus}' to '${status}'`
    );
  }

  order.orderStatus = status;
  order.statusHistory.push({
    status,
    note: note || `Marked ${status} by delivery agent`,
    updatedBy: req.user._id,
  });

  if (status === ORDER_STATUS.DELIVERED) {
    order.deliveredAt = new Date();
    order.paymentStatus = order.paymentMethod === 'cod' ? 'paid' : order.paymentStatus;

    // Mark agent as available again
    await DeliveryAgent.findByIdAndUpdate(agent._id, {
      $inc: { activeOrderCount: -1, totalDeliveries: 1 },
      isAvailable: true,
    });
  }

  await order.save();

  // Real-time socket notification to customer
  try {
    const io = require('../sockets/socketManager').getIo();
    io.to(`user_${order.userId}`).emit('order_updated', { orderId: order._id, status });
  } catch (e) { /* ignore if sockets down */ }

  logger.info(`[DeliveryAgent] Order ${order.orderNumber} → ${status} by agent ${req.user._id}`);
  new ApiResponse(200, 'Delivery status updated', order).send(res);
});

/**
 * Report a failed delivery attempt
 */
const reportFailedDelivery = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  if (!reason) throw ApiError.badRequest('Failure reason is required');

  const agent = await DeliveryAgent.findOne({ userId: req.user._id });
  if (!agent) throw ApiError.notFound('Delivery agent profile not found');

  const order = await Order.findOne({
    _id: req.params.orderId,
    deliveryAgent: agent._id,
    orderStatus: ORDER_STATUS.OUT_FOR_DELIVERY,
  });

  if (!order) throw ApiError.notFound('Order not found or not out for delivery');

  order.statusHistory.push({
    status: 'delivery_failed',
    note: `Delivery attempt failed: ${reason}`,
    updatedBy: req.user._id,
  });
  // Keep status as out_for_delivery for re-attempt
  await order.save();

  new ApiResponse(200, 'Failed delivery reported', { orderNumber: order.orderNumber, reason }).send(res);
});

/**
 * Get agent profile and stats
 */
const getAgentProfile = asyncHandler(async (req, res) => {
  const agent = await DeliveryAgent.findOne({ userId: req.user._id })
    .populate('userId', 'firstName lastName email phone avatar')
    .lean();

  if (!agent) throw ApiError.notFound('Delivery agent profile not found');
  new ApiResponse(200, 'Agent profile', agent).send(res);
});

/**
 * Update agent location (GPS coordinates)
 */
const updateLocation = asyncHandler(async (req, res) => {
  const { longitude, latitude } = req.body;
  if (longitude === undefined || latitude === undefined) {
    throw ApiError.badRequest('longitude and latitude are required');
  }

  const agent = await DeliveryAgent.findOneAndUpdate(
    { userId: req.user._id },
    { currentLocation: { type: 'Point', coordinates: [Number(longitude), Number(latitude)] } },
    { new: true }
  );
  if (!agent) throw ApiError.notFound('Delivery agent profile not found');

  new ApiResponse(200, 'Location updated').send(res);
});

/**
 * Toggle availability status
 */
const toggleAvailability = asyncHandler(async (req, res) => {
  const agent = await DeliveryAgent.findOne({ userId: req.user._id });
  if (!agent) throw ApiError.notFound('Delivery agent profile not found');

  agent.isAvailable = !agent.isAvailable;
  await agent.save();

  new ApiResponse(200, `You are now ${agent.isAvailable ? 'available' : 'unavailable'}`, {
    isAvailable: agent.isAvailable,
  }).send(res);
});

module.exports = {
  getMyTasks,
  updateDeliveryStatus,
  reportFailedDelivery,
  getAgentProfile,
  updateLocation,
  toggleAvailability,
};
