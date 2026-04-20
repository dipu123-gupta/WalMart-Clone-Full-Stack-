const EventEmitter = require('events');

class AppEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(20);
  }
}

const eventEmitter = new AppEventEmitter();

// Event names
const EVENTS = {
  USER_REGISTERED: 'user:registered',
  USER_VERIFIED: 'user:verified',
  USER_LOGIN: 'user:login',
  ORDER_PLACED: 'order:placed',
  ORDER_CONFIRMED: 'order:confirmed',
  ORDER_SHIPPED: 'order:shipped',
  ORDER_DELIVERED: 'order:delivered',
  ORDER_CANCELLED: 'order:cancelled',
  PAYMENT_SUCCESS: 'payment:success',
  PAYMENT_FAILED: 'payment:failed',
  REFUND_PROCESSED: 'refund:processed',
  PRODUCT_APPROVED: 'product:approved',
  PRODUCT_REJECTED: 'product:rejected',
  REVIEW_ADDED: 'review:added',
  STOCK_LOW: 'stock:low',
  STOCK_OUT: 'stock:out',
  SELLER_APPROVED: 'seller:approved',
  SELLER_REJECTED: 'seller:rejected',
  ORDER_RETURN_REQUESTED: 'order:return_requested',
};

module.exports = { eventEmitter, EVENTS };
