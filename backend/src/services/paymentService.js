const crypto = require('crypto');
const { getRazorpayInstance } = require('../config/razorpay');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');
const { eventEmitter, EVENTS } = require('../events/eventEmitter');
const logger = require('../config/logger');

class PaymentService {
  /**
   * Create Razorpay order for an existing order
   */
  async createRazorpayOrder(userId, orderId) {
    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) throw ApiError.notFound('Order not found');

    if (order.paymentMethod !== 'razorpay') {
      throw ApiError.badRequest('This order is not set for online payment');
    }

    if (order.paymentStatus === 'paid') {
      throw ApiError.badRequest('Order is already paid');
    }

    // Check for existing pending payment (idempotency)
    const existingPayment = await Payment.findOne({
      orderId,
      status: 'created',
    });
    if (existingPayment) {
      return {
        razorpayOrderId: existingPayment.razorpayOrderId,
        amount: existingPayment.amount,
        currency: existingPayment.currency,
        keyId: env.RAZORPAY_KEY_ID,
      };
    }

    const razorpay = getRazorpayInstance();
    const amountInPaise = Math.round(order.pricing.total * 100);

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: order.orderNumber,
      notes: {
        orderId: order._id.toString(),
        userId: userId.toString(),
      },
    });

    // Save payment record
    await Payment.create({
      orderId,
      userId,
      razorpayOrderId: razorpayOrder.id,
      amount: order.pricing.total,
      currency: 'INR',
      method: 'razorpay',
      status: 'created',
    });

    return {
      razorpayOrderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: 'INR',
      keyId: env.RAZORPAY_KEY_ID,
    };
  }

  /**
   * Verify Razorpay payment signature
   */
  async verifyPayment(userId, { razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      logger.warn(`Payment signature mismatch for order: ${razorpay_order_id}`);
      throw ApiError.badRequest('Payment verification failed');
    }

    // Update payment record
    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
    if (!payment) throw ApiError.notFound('Payment record not found');

    // Idempotency check
    if (payment.status === 'captured') {
      return { message: 'Payment already verified' };
    }

    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.status = 'captured';
    await payment.save();

    // Update order status
    const order = await Order.findById(payment.orderId);
    if (order) {
      order.paymentStatus = 'paid';
      if (order.orderStatus === 'pending') {
        order.orderStatus = 'confirmed';
        order.statusHistory.push({
          status: 'confirmed',
          note: 'Payment verified',
          updatedBy: userId,
        });
      }
      await order.save();

      const User = require('../models/User');
      const user = await User.findById(userId);
      eventEmitter.emit(EVENTS.PAYMENT_SUCCESS, { order, user });
      eventEmitter.emit(EVENTS.ORDER_CONFIRMED, { order, user });
    }

    return { message: 'Payment verified successfully' };
  }

  /**
   * Handle Razorpay webhook events
   */
  async handleWebhook(body, signature) {
    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(JSON.stringify(body))
      .digest('hex');

    if (expectedSignature !== signature) {
      logger.warn('Webhook signature mismatch');
      throw ApiError.unauthorized('Invalid webhook signature');
    }

    const event = body.event;
    const paymentEntity = body.payload?.payment?.entity;

    switch (event) {
      case 'payment.captured': {
        const payment = await Payment.findOne({
          razorpayOrderId: paymentEntity.order_id,
        });
        if (payment && payment.status !== 'captured') {
          payment.status = 'captured';
          payment.razorpayPaymentId = paymentEntity.id;
          await payment.save();

          const order = await Order.findById(payment.orderId);
          if (order && order.paymentStatus !== 'paid') {
            order.paymentStatus = 'paid';
            order.orderStatus = 'confirmed';
            order.statusHistory.push({
              status: 'confirmed',
              note: 'Payment captured via webhook',
            });
            await order.save();
          }
        }
        break;
      }

      case 'payment.failed': {
        const payment = await Payment.findOne({
          razorpayOrderId: paymentEntity.order_id,
        });
        if (payment) {
          payment.status = 'failed';
          payment.failureReason = paymentEntity.error_description || 'Payment failed';
          await payment.save();

          const order = await Order.findById(payment.orderId);
          if (order) {
            order.paymentStatus = 'failed';
            await order.save();

            const User = require('../models/User');
            const user = await User.findById(order.userId);
            eventEmitter.emit(EVENTS.PAYMENT_FAILED, {
              order,
              user,
              reason: paymentEntity.error_description,
            });
          }
        }
        break;
      }

      case 'refund.processed': {
        const refundEntity = body.payload?.refund?.entity;
        const payment = await Payment.findOne({
          razorpayPaymentId: refundEntity.payment_id,
        });
        if (payment) {
          const refund = payment.refunds.find(
            (r) => r.razorpayRefundId === refundEntity.id
          );
          if (refund) {
            refund.status = 'processed';
            await payment.save();
          }
        }
        break;
      }

      default:
        logger.info(`Unhandled webhook event: ${event}`);
    }

    return { received: true };
  }

  /**
   * Process refund (admin)
   */
  async processRefund(paymentId, { amount, reason }) {
    const payment = await Payment.findById(paymentId);
    if (!payment) throw ApiError.notFound('Payment not found');
    if (payment.status !== 'captured') {
      throw ApiError.badRequest('Can only refund captured payments');
    }

    const totalRefunded = payment.refunds
      .filter((r) => r.status !== 'failed')
      .reduce((sum, r) => sum + r.amount, 0);

    const refundAmount = amount || payment.amount - totalRefunded;
    if (refundAmount <= 0) throw ApiError.badRequest('No refundable amount');
    if (totalRefunded + refundAmount > payment.amount) {
      throw ApiError.badRequest('Refund amount exceeds payment');
    }

    try {
      const razorpay = getRazorpayInstance();
      const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
        amount: Math.round(refundAmount * 100),
        notes: { reason: reason || 'Customer refund' },
      });

      payment.refunds.push({
        amount: refundAmount,
        reason: reason || '',
        razorpayRefundId: refund.id,
        status: 'initiated',
      });

      if (totalRefunded + refundAmount >= payment.amount) {
        payment.status = 'refunded';
      }

      await payment.save();

      // Update order
      const order = await Order.findById(payment.orderId);
      if (order) {
        order.paymentStatus = totalRefunded + refundAmount >= payment.amount
          ? 'refunded'
          : 'partially_refunded';
        await order.save();

        const User = require('../models/User');
        const user = await User.findById(order.userId);
        eventEmitter.emit(EVENTS.REFUND_PROCESSED, { order, user, amount: refundAmount });
      }

      return { message: 'Refund initiated', refundId: refund.id };
    } catch (error) {
      logger.error('Refund failed:', error);
      payment.refunds.push({
        amount: refundAmount,
        reason: reason || '',
        status: 'failed',
      });
      await payment.save();
      throw ApiError.internal('Refund processing failed');
    }
  }
}

module.exports = new PaymentService();
