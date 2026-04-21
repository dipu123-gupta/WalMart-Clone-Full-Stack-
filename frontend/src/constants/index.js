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

// ===== Shipping Config =====
export const FREE_SHIPPING_THRESHOLD = 500; // ₹500
export const STANDARD_SHIPPING_FEE = 40;    // ₹40

// ===== Site Identity (driven by env, with sensible fallbacks) =====
export const SITE_NAME = import.meta.env.VITE_SITE_NAME || 'WalMart Clone';
export const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || 'support@walmart-clone.com';
export const SUPPORT_PHONE = import.meta.env.VITE_SUPPORT_PHONE || '+91 1800-123-4567';
export const SITE_ADDRESS = import.meta.env.VITE_SITE_ADDRESS || '123 Commerce Street, Bengaluru, India';
export const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || '';

// Fallback placeholder image (single source of truth)
export const PLACEHOLDER_IMAGE = 'https://placehold.co/400x400/e2e8f0/64748b?text=No+Image';
