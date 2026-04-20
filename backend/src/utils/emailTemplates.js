/**
 * OTP Email Template
 */
const otpEmailTemplate = (name, otp) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
    .container { max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #0071dc, #004c91); padding: 32px 24px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 24px; }
    .body { padding: 32px 24px; text-align: center; }
    .otp-code { display: inline-block; background: #f0f7ff; border: 2px dashed #0071dc; border-radius: 8px; padding: 16px 32px; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0071dc; margin: 20px 0; }
    .footer { padding: 16px 24px; text-align: center; color: #888; font-size: 12px; border-top: 1px solid #eee; }
    p { color: #333; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🛒 WalMart Clone</h1>
    </div>
    <div class="body">
      <p>Hi <strong>${name}</strong>,</p>
      <p>Your verification code is:</p>
      <div class="otp-code">${otp}</div>
      <p>This code expires in <strong>10 minutes</strong>.</p>
      <p style="color: #888; font-size: 13px;">If you didn't request this, please ignore this email.</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} WalMart Clone. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

/**
 * Welcome Email Template
 */
const welcomeEmailTemplate = (name) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
    .container { max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #0071dc, #004c91); padding: 32px 24px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 24px; }
    .body { padding: 32px 24px; }
    .cta { display: inline-block; background: #0071dc; color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px; }
    .footer { padding: 16px 24px; text-align: center; color: #888; font-size: 12px; border-top: 1px solid #eee; }
    p { color: #333; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Welcome to WalMart Clone!</h1>
    </div>
    <div class="body">
      <p>Hi <strong>${name}</strong>,</p>
      <p>Your account has been verified successfully! You're all set to start shopping.</p>
      <p>Here's what you can do:</p>
      <ul>
        <li>Browse thousands of products</li>
        <li>Get exclusive deals and offers</li>
        <li>Track orders in real-time</li>
        <li>Save items to your wishlist</li>
      </ul>
      <p style="text-align: center;">
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}" class="cta">Start Shopping →</a>
      </p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} WalMart Clone. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

/**
 * Order Confirmation Email Template
 */
const orderConfirmationTemplate = (name, order) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
    .container { max-width: 520px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #0071dc, #004c91); padding: 32px 24px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 20px; }
    .body { padding: 24px; }
    .order-box { background: #f8fafb; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .total { font-size: 20px; font-weight: bold; color: #0071dc; }
    .footer { padding: 16px 24px; text-align: center; color: #888; font-size: 12px; border-top: 1px solid #eee; }
    p { color: #333; line-height: 1.6; margin: 8px 0; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 8px 4px; border-bottom: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Order Confirmed — ${order.orderNumber}</h1>
    </div>
    <div class="body">
      <p>Hi <strong>${name}</strong>,</p>
      <p>Your order has been placed successfully!</p>
      <div class="order-box">
        <p><strong>Order #:</strong> ${order.orderNumber}</p>
        <p><strong>Items:</strong> ${order.items?.length || 0}</p>
        <p><strong>Payment:</strong> ${order.paymentMethod?.toUpperCase()}</p>
        <p class="total">Total: ₹${order.pricing?.total?.toLocaleString()}</p>
      </div>
      <p>We'll notify you when your order ships.</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} WalMart Clone. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

/**
 * Password Reset Email Template
 */
const passwordResetTemplate = (name, resetUrl) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
    .container { max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #e74c3c, #c0392b); padding: 32px 24px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 20px; }
    .body { padding: 32px 24px; text-align: center; }
    .cta { display: inline-block; background: #e74c3c; color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; }
    .footer { padding: 16px 24px; text-align: center; color: #888; font-size: 12px; border-top: 1px solid #eee; }
    p { color: #333; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Password Reset Request</h1>
    </div>
    <div class="body">
      <p>Hi <strong>${name}</strong>,</p>
      <p>We received a request to reset your password. Click the button below:</p>
      <p><a href="${resetUrl}" class="cta">Reset Password</a></p>
      <p style="color: #888; font-size: 13px; margin-top: 20px;">This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} WalMart Clone. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

module.exports = {
  otpEmailTemplate,
  welcomeEmailTemplate,
  orderConfirmationTemplate,
  passwordResetTemplate,
};
