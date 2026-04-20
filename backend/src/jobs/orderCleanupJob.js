/**
 * ORDER CLEANUP JOB (P0-6 Fix)
 * 
 * Runs every 15 minutes and finds pending orders where payment was never
 * completed. After 30 minutes, it:
 *   1. Cancels the order
 *   2. Releases reserved inventory back to available stock
 *   3. Marks any associated Payment record as 'expired'
 */

const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Inventory = require('../models/Inventory');
const { ORDER_STATUS } = require('../constants/orderStatus');
const logger = require('../config/logger');

const runOrderCleanup = async () => {
  try {
    const TIMEOUT_MINUTES = 30;
    const cutoff = new Date(Date.now() - TIMEOUT_MINUTES * 60 * 1000);

    // Find orders stuck in 'pending' with payment method 'razorpay' older than cutoff
    const staleOrders = await Order.find({
      orderStatus: ORDER_STATUS.PENDING,
      paymentMethod: 'razorpay',
      paymentStatus: { $in: ['pending', 'failed'] },
      createdAt: { $lt: cutoff },
    });

    if (staleOrders.length === 0) return;

    logger.info(`[OrderCleanup] Found ${staleOrders.length} stale pending orders to expire.`);

    for (const order of staleOrders) {
      try {
        // 1. Release reserved inventory for each item
        for (const item of order.items) {
          if (item.status === 'cancelled' || item.status === 'refunded') continue;

          const inventoryFilter = item.variantId
            ? { variantId: item.variantId }
            : { productId: item.productId, variantId: null };

          await Inventory.findOneAndUpdate(
            inventoryFilter,
            { $inc: { reservedQuantity: -item.quantity } }
          );

          item.status = 'cancelled';
        }

        // 2. Update order status to cancelled
        order.orderStatus = ORDER_STATUS.CANCELLED;
        order.cancelledAt = new Date();
        order.cancellationReason = 'Payment timeout — auto cancelled after 30 minutes';
        order.statusHistory.push({
          status: ORDER_STATUS.CANCELLED,
          note: 'Auto-cancelled: payment window expired',
        });
        await order.save();

        // 3. Expire the associated Payment record
        await Payment.findOneAndUpdate(
          { orderId: order._id, status: { $in: ['created', 'pending'] } },
          { status: 'expired', failureReason: 'Payment window expired (30 min timeout)' }
        );

        logger.info(`[OrderCleanup] Expired order ${order.orderNumber} and released inventory.`);
      } catch (err) {
        logger.error(`[OrderCleanup] Error processing order ${order.orderNumber}:`, err);
      }
    }

    logger.info(`[OrderCleanup] Job complete. Processed ${staleOrders.length} orders.`);
  } catch (err) {
    logger.error('[OrderCleanup] Job failed:', err);
  }
};

/**
 * Start the cleanup job — runs every 15 minutes
 */
const startOrderCleanupJob = () => {
  const INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

  // Run immediately on startup, then on interval
  runOrderCleanup();
  const interval = setInterval(runOrderCleanup, INTERVAL_MS);

  logger.info('[OrderCleanup] Job scheduled — running every 15 minutes.');
  return interval;
};

module.exports = { startOrderCleanupJob, runOrderCleanup };
