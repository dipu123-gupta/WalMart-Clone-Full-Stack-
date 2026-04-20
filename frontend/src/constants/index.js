export const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const ORDER_STATUS = {
  pending: { label: 'Pending', color: 'warning' },
  confirmed: { label: 'Confirmed', color: 'info' },
  processing: { label: 'Processing', color: 'info' },
  shipped: { label: 'Shipped', color: 'primary' },
  out_for_delivery: { label: 'Out for Delivery', color: 'primary' },
  delivered: { label: 'Delivered', color: 'success' },
  cancelled: { label: 'Cancelled', color: 'error' },
  return_requested: { label: 'Return Requested', color: 'warning' },
  returned: { label: 'Returned', color: 'neutral' },
};

export const PAYMENT_METHODS = {
  razorpay: { label: 'Online Payment', icon: '💳' },
  cod: { label: 'Cash on Delivery', icon: '💵' },
};

export const ROLES = {
  CUSTOMER: 'customer',
  SELLER: 'seller',
  ADMIN: 'admin',
};
