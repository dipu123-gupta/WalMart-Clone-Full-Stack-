const PAYMENT_STATUS = {
  CREATED: 'created',
  AUTHORIZED: 'authorized',
  CAPTURED: 'captured',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

const PAYMENT_STATUS_LIST = Object.values(PAYMENT_STATUS);

const PAYMENT_METHODS = {
  RAZORPAY: 'razorpay',
  COD: 'cod',
};

const PAYMENT_METHOD_LIST = Object.values(PAYMENT_METHODS);

module.exports = { PAYMENT_STATUS, PAYMENT_STATUS_LIST, PAYMENT_METHODS, PAYMENT_METHOD_LIST };
