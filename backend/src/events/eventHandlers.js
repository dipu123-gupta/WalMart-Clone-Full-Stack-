const { eventEmitter, EVENTS } = require('./eventEmitter');
const logger = require('../config/logger');
const { sendEmail } = require('../config/nodemailer');
const { otpEmailTemplate, welcomeEmailTemplate, orderConfirmationTemplate } = require('../utils/emailTemplates');
const Notification = require('../models/Notification');

/**
 * Register all event handlers
 */
const registerEventHandlers = () => {
  // User registered — send OTP email
  eventEmitter.on(EVENTS.USER_REGISTERED, async ({ user, otp }) => {
    try {
      await sendEmail({
        to: user.email,
        subject: 'Verify your WalMart Clone account',
        html: otpEmailTemplate(user.firstName, otp),
      });
      logger.info(`OTP email sent to ${user.email}`);
    } catch (error) {
      logger.error('Failed to send OTP email:', error);
    }
  });

  // User verified — send welcome email
  eventEmitter.on(EVENTS.USER_VERIFIED, async ({ user }) => {
    try {
      await sendEmail({
        to: user.email,
        subject: 'Welcome to WalMart Clone! 🎉',
        html: welcomeEmailTemplate(user.firstName),
      });
      logger.info(`Welcome email sent to ${user.email}`);
    } catch (error) {
      logger.error('Failed to send welcome email:', error);
    }
  });

  // Order placed — notification + email
  eventEmitter.on(EVENTS.ORDER_PLACED, async ({ order, user }) => {
    try {
      // In-app notification
      await Notification.create({
        userId: user._id,
        type: 'order',
        title: 'Order Placed Successfully',
        message: `Your order #${order.orderNumber} has been placed.`,
        data: { orderId: order._id, orderNumber: order.orderNumber },
        channels: ['in_app', 'email'],
      });

      // Email
      await sendEmail({
        to: user.email,
        subject: `Order Confirmed — ${order.orderNumber}`,
        html: orderConfirmationTemplate(user.firstName, order),
      });

      logger.info(`Order placed notification sent for ${order.orderNumber}`);
    } catch (error) {
      logger.error('Failed to send order notification:', error);
    }
  });

  // Order status changes
  eventEmitter.on(EVENTS.ORDER_SHIPPED, async ({ order, user }) => {
    try {
      await Notification.create({
        userId: user._id,
        type: 'delivery',
        title: 'Order Shipped',
        message: `Your order #${order.orderNumber} has been shipped.`,
        data: { orderId: order._id },
        channels: ['in_app', 'push'],
      });
    } catch (error) {
      logger.error('Failed to send shipped notification:', error);
    }
  });

  eventEmitter.on(EVENTS.ORDER_DELIVERED, async ({ order, user }) => {
    try {
      await Notification.create({
        userId: user._id,
        type: 'delivery',
        title: 'Order Delivered',
        message: `Your order #${order.orderNumber} has been delivered.`,
        data: { orderId: order._id },
        channels: ['in_app', 'push'],
      });

      // 💰 Financial Settlement & 📦 Inventory Finalization
      const Seller = require('../models/Seller');
      const DeliveryAgent = require('../models/DeliveryAgent');
      const Inventory = require('../models/Inventory');
      const Transaction = require('../models/Transaction');

      // 1. Credit Sellers
      for (const item of order.items) {
        if (item.status === 'delivered' || order.orderStatus === 'delivered') {
          const netProceeds = item.sellerNetProceeds || item.total;
          
          // Update Seller Balance
          const seller = await Seller.findOneAndUpdate(
            { userId: item.sellerId },
            { $inc: { totalRevenue: netProceeds, currentBalance: netProceeds, totalOrders: 1 } },
            { new: true }
          );

          if (seller) {
            // Log Transaction for Seller
            await Transaction.create({
              userId: seller.userId,
              userRole: 'seller',
              amount: netProceeds,
              type: 'credit',
              category: 'sale_proceeds',
              orderId: order._id,
              description: `Sale proceeds for item: ${item.name}`,
            });
          }

          // Deduct Final Inventory
          if (item.variantId) {
            await Inventory.findOneAndUpdate(
              { variantId: item.variantId },
              { $inc: { quantity: -item.quantity, reservedQuantity: -item.quantity } }
            );
          } else {
            await Inventory.findOneAndUpdate(
              { productId: item.productId, variantId: null },
              { $inc: { quantity: -item.quantity, reservedQuantity: -item.quantity } }
            );
          }
        }
      }

      // 2. Credit Delivery Agent (Fixed fee: ₹40)
      if (order.deliveryAgent) {
        const deliveryFee = 40;
        const agent = await DeliveryAgent.findByIdAndUpdate(
          order.deliveryAgent,
          { $inc: { totalEarnings: deliveryFee, currentBalance: deliveryFee, totalDeliveries: 1 } },
          { new: true }
        );

        if (agent) {
          // Log Transaction for Agent
          await Transaction.create({
            userId: agent.userId,
            userRole: 'delivery_agent',
            amount: deliveryFee,
            type: 'credit',
            category: 'delivery_fee',
            orderId: order._id,
            description: `Delivery fee for order: ${order.orderNumber}`,
          });
        }
      }

      logger.info(`Financial settlement completed for order: ${order.orderNumber}`);
    } catch (error) {
      logger.error('Failed to process delivered order financial settlement:', error);
    }
  });

  // Payment events
  eventEmitter.on(EVENTS.PAYMENT_FAILED, async ({ order, user, reason }) => {
    try {
      await Notification.create({
        userId: user._id,
        type: 'payment',
        title: 'Payment Failed',
        message: `Payment for order #${order.orderNumber} failed. ${reason || ''}`,
        data: { orderId: order._id },
        channels: ['in_app', 'email'],
      });
    } catch (error) {
      logger.error('Failed to send payment failure notification:', error);
    }
  });

  // Stock alerts
  eventEmitter.on(EVENTS.STOCK_LOW, async ({ product, sellerId }) => {
    try {
      await Notification.create({
        userId: sellerId,
        type: 'stock',
        title: 'Low Stock Alert',
        message: `Product "${product.name}" is running low on stock.`,
        data: { productId: product._id },
        channels: ['in_app', 'email'],
      });
    } catch (error) {
      logger.error('Failed to send low stock notification:', error);
    }
  });

  // Seller events
  eventEmitter.on(EVENTS.SELLER_APPROVED, async ({ seller, user }) => {
    try {
      await Notification.create({
        userId: user._id,
        type: 'system',
        title: 'Seller Account Approved',
        message: 'Congratulations! Your seller account has been approved.',
        channels: ['in_app', 'email'],
      });
    } catch (error) {
      logger.error('Failed to send seller approval notification:', error);
    }
  });

  logger.info('Event handlers registered');
};

module.exports = registerEventHandlers;
