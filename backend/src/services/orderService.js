const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Coupon = require('../models/Coupon');
const Address = require('../models/Address');
const ApiError = require('../utils/ApiError');
const generateOrderNumber = require('../utils/generateOrderNumber');
const { calculateTax, calculateShippingFee } = require('../utils/helpers');
const { buildPagination, buildPaginationMeta } = require('../utils/pagination');
const { ORDER_STATUS, ORDER_TRANSITIONS } = require('../constants/orderStatus');
const { eventEmitter, EVENTS } = require('../events/eventEmitter');
const logger = require('../config/logger');
const mongoose = require('mongoose');

class OrderService {
  /**
   * Place an order from cart
   */
  async placeOrder(userId, { addressId, paymentMethod, notes = '' }) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Get user's cart
      const cart = await Cart.findOne({ userId })
        .populate({
          path: 'items.productId',
          select: 'name slug images basePrice salePrice taxRate sellerId status',
        })
        .session(session);

      if (!cart || cart.items.length === 0) {
        throw ApiError.badRequest('Cart is empty');
      }

      // 2. Get shipping address
      const address = await Address.findOne({ _id: addressId, userId }).session(session);
      if (!address) throw ApiError.notFound('Shipping address not found');

      // 3. Build order items with validation
      const orderItems = [];
      let subtotal = 0;
      let totalTax = 0;

      for (const cartItem of cart.items) {
        const product = cartItem.productId;
        if (!product || product.status !== 'active') {
          throw ApiError.badRequest(`Product "${product?.name || 'unknown'}" is unavailable`);
        }

        const price = product.salePrice || product.basePrice;
        const taxAmount = calculateTax(price * cartItem.quantity, product.taxRate || 18);
        const itemTotal = price * cartItem.quantity;

        // Reserve inventory atomically — handles both variant and base products
        const inventoryFilter = cartItem.variantId
          ? { variantId: cartItem.variantId }
          : { productId: product._id, variantId: null };

        const inventory = await Inventory.findOneAndUpdate(
          {
            ...inventoryFilter,
            $expr: { $gte: [{ $subtract: ['$quantity', '$reservedQuantity'] }, cartItem.quantity] },
          },
          { $inc: { reservedQuantity: cartItem.quantity } },
          { new: true, session }
        );

        if (!inventory) {
          throw ApiError.badRequest(`"${product.name}" is out of stock`);
        }

        orderItems.push({
          productId: product._id,
          variantId: cartItem.variantId || null,
          sellerId: product.sellerId,
          name: product.name,
          image: product.images?.[0]?.url || '',
          price,
          quantity: cartItem.quantity,
          taxRate: product.taxRate || 18,
          taxAmount,
          total: itemTotal,
          status: 'pending',
        });

        subtotal += itemTotal;
        totalTax += taxAmount;
      }

      // 4. Apply coupon discount
      let discount = 0;
      let couponCode = '';
      if (cart.couponCode) {
        const coupon = await Coupon.findOne({ code: cart.couponCode }).session(session);
        if (coupon) {
          const { valid } = coupon.isValid(userId, subtotal);
          if (valid) {
            discount = coupon.calculateDiscount(subtotal);
            couponCode = coupon.code;

            // Record usage
            coupon.usedCount += 1;
            coupon.usedBy.push({ userId });
            await coupon.save({ session });
          }
        }
      }

      // 5. Calculate totals
      const shippingFee = calculateShippingFee(subtotal);
      const total = subtotal + totalTax + shippingFee - discount;

      // 6. Calculate Seller Commissions & Update Stats
      const Seller = require('../models/Seller');
      for (const item of orderItems) {
        const seller = await Seller.findOne({ userId: item.sellerId }).session(session);
        if (seller) {
          const commissionAmount = Math.round(((item.total * seller.commissionRate) / 100) * 100) / 100;
          item.commissionAmount = commissionAmount;
          item.sellerNetProceeds = Math.round((item.total - commissionAmount) * 100) / 100;
          
          // Note: seller.totalRevenue is now updated only on delivery via event handlers
        }
      }

      // 7. Create order
      const order = await Order.create(
        [
          {
            orderNumber: generateOrderNumber(),
            userId,
            items: orderItems,
            shippingAddress: {
              fullName: address.fullName,
              phone: address.phone,
              addressLine1: address.addressLine1,
              addressLine2: address.addressLine2,
              city: address.city,
              state: address.state,
              pincode: address.pincode,
              country: address.country,
              landmark: address.landmark,
            },
            pricing: {
              subtotal,
              taxAmount: totalTax,
              shippingFee,
              discount,
              couponCode,
              total: Math.round(total * 100) / 100,
            },
            paymentMethod,
            paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
            orderStatus: paymentMethod === 'cod' ? ORDER_STATUS.CONFIRMED : ORDER_STATUS.PENDING,
            statusHistory: [
              {
                status: paymentMethod === 'cod' ? ORDER_STATUS.CONFIRMED : ORDER_STATUS.PENDING,
                note: 'Order placed',
                updatedBy: userId,
              },
            ],
            estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
            notes,
          },
        ],
        { session }
      );

      // 8. Clear cart
      cart.items = [];
      cart.couponCode = null;
      cart.couponDiscount = 0;
      await cart.save({ session });

      // 9. Update product sold count
      for (const item of orderItems) {
        await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { totalSold: item.quantity } },
          { session }
        );
      }

      await session.commitTransaction();

      // 10. Emit event (outside transaction)
      const User = require('../models/User');
      const user = await User.findById(userId);
      eventEmitter.emit(EVENTS.ORDER_PLACED, { order: order[0], user });

      return order[0];
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get user's orders
   */
  async getUserOrders(userId, query) {
    const { page, limit, skip, sort } = buildPagination(query);
    const filter = { userId };

    if (query.status) filter.orderStatus = query.status;

    const [orders, total] = await Promise.all([
      Order.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Order.countDocuments(filter),
    ]);

    return { orders, meta: buildPaginationMeta(total, page, limit) };
  }

  /**
   * Get single order detail
   */
  async getOrderById(userId, orderId) {
    const order = await Order.findOne({ _id: orderId, userId })
      .populate('statusHistory.updatedBy', 'firstName lastName role')
      .lean();

    if (!order) throw ApiError.notFound('Order not found');
    return order;
  }

  /**
   * Partial order cancellation (single item)
   */
  async partialCancelOrder(userId, orderId, itemId, { reason }) {
    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) throw ApiError.notFound('Order not found');

    const item = order.items.id(itemId);
    if (!item) throw ApiError.notFound('Item not found');

    const cancellableStatuses = ['pending', 'confirmed', 'processing'];
    if (!cancellableStatuses.includes(item.status)) {
      throw ApiError.badRequest('Item cannot be cancelled at this stage');
    }

    // Release inventory — handles both variant and base products
    if (item.variantId) {
      await Inventory.findOneAndUpdate(
        { variantId: item.variantId },
        { $inc: { reservedQuantity: -item.quantity } }
      );
    } else {
      await Inventory.findOneAndUpdate(
        { productId: item.productId, variantId: null },
        { $inc: { reservedQuantity: -item.quantity } }
      );
    }

    item.status = 'cancelled';
    
    // Recalculate totals
    const remainingItems = order.items.filter(i => i.status !== 'cancelled');
    if (remainingItems.length === 0) {
      order.orderStatus = ORDER_STATUS.CANCELLED;
      order.cancelledAt = new Date();
    }

    // Update pricing (approximate)
    order.pricing.subtotal -= item.total;
    order.pricing.taxAmount -= item.taxAmount;
    order.pricing.total = order.pricing.subtotal + order.pricing.taxAmount + order.pricing.shippingFee - order.pricing.discount;

    order.statusHistory.push({
      status: 'partial_cancel',
      note: `Item "${item.name}" cancelled. Reason: ${reason || 'Customer request'}`,
      updatedBy: userId,
    });

    await order.save();
    return order;
  }

  /**
   * Cancel order (full)
   */
  async cancelOrder(userId, orderId, { reason }) {
    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) throw ApiError.notFound('Order not found');

    const cancellableStatuses = [
      ORDER_STATUS.PENDING,
      ORDER_STATUS.CONFIRMED,
      ORDER_STATUS.PROCESSING,
    ];
    if (!cancellableStatuses.includes(order.orderStatus)) {
      throw ApiError.badRequest('Order cannot be cancelled at this stage');
    }

    // Release inventory for all items — handles both variant and base products
    for (const item of order.items) {
      if (item.variantId) {
        await Inventory.findOneAndUpdate(
          { variantId: item.variantId },
          { $inc: { reservedQuantity: -item.quantity } }
        );
      } else {
        await Inventory.findOneAndUpdate(
          { productId: item.productId, variantId: null },
          { $inc: { reservedQuantity: -item.quantity } }
        );
      }
      item.status = 'cancelled';
    }

    order.orderStatus = ORDER_STATUS.CANCELLED;
    order.cancelledAt = new Date();
    order.cancellationReason = reason || '';
    order.statusHistory.push({
      status: ORDER_STATUS.CANCELLED,
      note: reason || 'Cancelled by customer',
      updatedBy: userId,
    });

    // If paid, mark for refund
    if (order.paymentStatus === 'paid') {
      order.paymentStatus = 'refunded';
    }

    await order.save();

    const User = require('../models/User');
    const user = await User.findById(userId);
    eventEmitter.emit(EVENTS.ORDER_CANCELLED, { order, user });

    return order;
  }

  /**
   * Request return
   */
  async requestReturn(userId, orderId, { reason, itemIds }) {
    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) throw ApiError.notFound('Order not found');

    if (order.orderStatus !== ORDER_STATUS.DELIVERED) {
      throw ApiError.badRequest('Returns can only be requested for delivered orders');
    }

    // Check return window (7 days)
    const deliveredAt = order.deliveredAt || order.updatedAt;
    const daysSinceDelivery = (Date.now() - new Date(deliveredAt)) / (1000 * 60 * 60 * 24);
    if (daysSinceDelivery > 7) {
      throw ApiError.badRequest('Return window has expired (7 days)');
    }

    // Mark items for return
    if (itemIds && itemIds.length > 0) {
      for (const itemId of itemIds) {
        const item = order.items.id(itemId);
        if (item && item.status === 'delivered') {
          item.status = 'return_requested';
        }
      }
    } else {
      // Return all items
      order.items.forEach((item) => {
        if (item.status === 'delivered') {
          item.status = 'return_requested';
        }
      });
    }

    order.orderStatus = ORDER_STATUS.RETURN_REQUESTED;
    order.statusHistory.push({
      status: ORDER_STATUS.RETURN_REQUESTED,
      note: reason || 'Return requested by customer',
      updatedBy: userId,
    });

    await order.save();

    // Emit event
    try {
      const User = require('../models/User');
      const user = await User.findById(userId);
      eventEmitter.emit(EVENTS.ORDER_RETURN_REQUESTED, { order, user });
    } catch (e) { /* ignore event errors */ }

    return order;
  }

  // ===== Seller Order Management =====

  async getSellerOrders(sellerId, query) {
    const { page, limit, skip, sort } = buildPagination(query);
    const filter = { 'items.sellerId': sellerId };

    if (query.status) filter.orderStatus = query.status;

    const [orders, total] = await Promise.all([
      Order.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Order.countDocuments(filter),
    ]);

    return { orders, meta: buildPaginationMeta(total, page, limit) };
  }

  async updateOrderItemStatus(sellerId, orderId, itemId, { status }) {
    const order = await Order.findById(orderId);
    if (!order) throw ApiError.notFound('Order not found');

    const item = order.items.id(itemId);
    if (!item) throw ApiError.notFound('Order item not found');
    if (item.sellerId.toString() !== sellerId.toString()) {
      throw ApiError.forbidden('Not authorized to update this item');
    }

    item.status = status;
    order.statusHistory.push({
      status: `item:${status}`,
      note: `Item "${item.name}" updated to ${status}`,
      updatedBy: sellerId,
    });

    // Check if all items have same status → update order status
    const allStatuses = order.items.map((i) => i.status);
    if (allStatuses.every((s) => s === 'shipped')) {
      order.orderStatus = ORDER_STATUS.SHIPPED;
    } else if (allStatuses.every((s) => s === 'delivered')) {
      order.orderStatus = ORDER_STATUS.DELIVERED;
      order.deliveredAt = new Date();
    }

    await order.save();
    return order;
  }

  async updateOrderStatus(sellerId, orderId, status) {
    const order = await Order.findById(orderId);
    if (!order) throw ApiError.notFound('Order not found');

    // In a multi-vendor setup, verify if seller actually owns any items in this order
    const hasItems = order.items.some(item => item.sellerId.toString() === sellerId.toString());
    if (!hasItems) throw ApiError.forbidden('Not authorized to update this order');

    order.orderStatus = status;
    order.items.forEach(item => { item.status = status; });
    order.statusHistory.push({
      status,
      note: `Order marked as ${status} by seller`,
      updatedBy: sellerId,
    });

    if (status === ORDER_STATUS.DELIVERED) {
      order.deliveredAt = new Date();
    }

    await order.save();

    // Trigger WebSockets directly
    try {
      const io = require('../sockets/socketManager').getIo();
      io.to(`user_${order.userId}`).emit('order_updated', { 
        orderId: order._id, 
        status 
      });
    } catch(e) { /* ignore if sockets are down */ }
    
    return order;
  }

  // ===== Admin Order Management =====

  async getAllOrders(query) {
    const { page, limit, skip, sort } = buildPagination(query);
    const filter = {};

    if (query.status) filter.orderStatus = query.status;
    if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;
    if (query.orderNumber) filter.orderNumber = new RegExp(query.orderNumber, 'i');

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('userId', 'firstName lastName email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    return { orders, meta: buildPaginationMeta(total, page, limit) };
  }

  async adminUpdateOrderStatus(orderId, { status, note }, adminId) {
    const order = await Order.findById(orderId);
    if (!order) throw ApiError.notFound('Order not found');

    // Validate state transition
    const validNext = ORDER_TRANSITIONS[order.orderStatus] || [];
    if (!validNext.includes(status)) {
      throw ApiError.badRequest(
        `Cannot transition from '${order.orderStatus}' to '${status}'`
      );
    }

    order.orderStatus = status;
    order.statusHistory.push({
      status,
      note: note || '',
      updatedBy: adminId,
    });

    if (status === ORDER_STATUS.DELIVERED) {
      order.deliveredAt = new Date();
    }

    await order.save();

    // 📣 Real-time Notification via Socket.IO
    try {
      const io = require('../sockets/socketManager').getIo();
      io.to(`user_${order.userId.toString()}`).emit('order_updated', { 
        orderId: order._id, 
        status 
      });
    } catch(e) { /* Sockets optional */ }

    // Emit appropriate event
    const User = require('../models/User');
    const user = await User.findById(order.userId);
    if (status === ORDER_STATUS.SHIPPED) {
      eventEmitter.emit(EVENTS.ORDER_SHIPPED, { order, user });
    } else if (status === ORDER_STATUS.DELIVERED) {
      eventEmitter.emit(EVENTS.ORDER_DELIVERED, { order, user });
    }

    return order;
  }

  async approveReturn(orderId, { approved, note }, adminId) {
    const order = await Order.findById(orderId);
    if (!order) throw ApiError.notFound('Order not found');

    if (order.orderStatus !== ORDER_STATUS.RETURN_REQUESTED) {
      throw ApiError.badRequest('No return request pending');
    }

    if (approved) {
      order.orderStatus = ORDER_STATUS.RETURN_APPROVED;
      order.items.forEach((item) => {
        if (item.status === 'return_requested') {
          item.status = 'returned';
        }
      });
    } else {
      order.orderStatus = ORDER_STATUS.DELIVERED;
      order.items.forEach((item) => {
        if (item.status === 'return_requested') {
          item.status = 'delivered';
        }
      });
    }

    order.statusHistory.push({
      status: approved ? ORDER_STATUS.RETURN_APPROVED : ORDER_STATUS.DELIVERED,
      note: note || (approved ? 'Return approved' : 'Return rejected'),
      updatedBy: adminId,
    });

    await order.save();
    return order;
  }
  async assignDeliveryAgent(orderId, agentId) {
    const order = await Order.findById(orderId);
    if (!order) throw ApiError.notFound('Order not found');

    const DeliveryAgent = require('../models/DeliveryAgent');
    const User = require('../models/User');
    
    // 1. Try to find DeliveryAgent profile directly by ID
    let agent = await DeliveryAgent.findById(agentId).populate('userId');
    
    // 2. If not found, look up by userId (since frontend dropdown sends userId)
    if (!agent) {
      agent = await DeliveryAgent.findOne({ userId: agentId }).populate('userId');
    }

    // 3. Fallback: Create profile if user exists with correct role
    if (!agent) {
      const user = await User.findOne({ _id: agentId, role: 'delivery_agent' });
      if (user) {
        agent = await DeliveryAgent.create({ 
          userId: user._id, 
          isVerified: true 
        });
        // Refetch to ensure population works if needed, although we have user now
        agent.userId = user;
      }
    }

    if (!agent) throw ApiError.notFound('Delivery agent not found');

    // Link agent to order
    order.deliveryAgent = agent._id;
    
    // Transition status to processing if it was confirmed
    if (order.orderStatus === ORDER_STATUS.CONFIRMED) {
      order.orderStatus = ORDER_STATUS.PROCESSING;
    }

    const agentName = agent.userId ? `${agent.userId.firstName} ${agent.userId.lastName}` : 'Agent';
    
    order.statusHistory.push({
      status: 'assigned',
      note: `Delivery assigned to ${agentName}`,
    });

    await order.save();
    return order;
  }

  async getDeliveryTasks(agentId) {
    return await Order.find({ 
      deliveryAgent: agentId,
      orderStatus: { $in: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.PROCESSING, ORDER_STATUS.SHIPPED] }
    }).sort({ createdAt: -1 }).lean();
  }
}

module.exports = new OrderService();
