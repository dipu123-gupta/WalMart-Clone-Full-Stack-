const PDFDocument = require('pdfkit');
const Order = require('../models/Order');
const ApiError = require('../utils/ApiError');

const generateInvoicePDF = async (orderId, userId, res) => {
  const order = await Order.findOne({ _id: orderId, userId }).populate('items.productId');
  if (!order) throw ApiError.notFound('Order not found');

  const doc = new PDFDocument({ margin: 50 });

  // Stream directly to Express Response
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=Invoice-${order.orderNumber}.pdf`);
  
  doc.pipe(res);

  // Generic Letterhead
  doc
    .fillColor('#0071dc')
    .fontSize(20)
    .text('WalMart Clone Store', 50, 50)
    .fillColor('#444444')
    .fontSize(10)
    .text('101 Retail Avenue', 50, 75)
    .text('New Delhi, IND 110001', 50, 90)
    .text('support@walmart-clone.com', 50, 105)
    .moveDown();

  // Invoice Details
  doc
    .fillColor('#000000')
    .fontSize(16)
    .text('Tax Invoice', 50, 140);
  
  doc.fontSize(10)
     .text(`Invoice Number: INV-${order.orderNumber}`, 50, 165)
     .text(`Order Date: ${new Date(order.createdAt).toLocaleDateString()}`, 50, 180)
     .text(`Payment Status: ${order.paymentStatus.toUpperCase()}`, 50, 195);

  // Billing Address
  const sa = order.shippingAddress;
  doc.text('Billed To:', 300, 140)
     .text(sa.fullName, 300, 155)
     .text(`${sa.addressLine1} ${sa.addressLine2 || ''}`, 300, 170)
     .text(`${sa.city}, ${sa.state} - ${sa.pincode}`, 300, 185)
     .text(sa.country, 300, 200);

  // Table Matrix
  const tableTop = 250;
  doc.font('Helvetica-Bold');
  doc.text('Item', 50, tableTop)
     .text('Price', 280, tableTop)
     .text('Qty', 370, tableTop)
     .text('Line Total', 450, tableTop);
  
  doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

  doc.font('Helvetica');
  let yPosition = tableTop + 25;

  order.items.forEach(item => {
    doc.text(item.name.substring(0, 40), 50, yPosition)
       .text(`Rs ${item.price.toFixed(2)}`, 280, yPosition)
       .text(item.quantity.toString(), 370, yPosition)
       .text(`Rs ${(item.price * item.quantity).toFixed(2)}`, 450, yPosition);
    yPosition += 20;
  });

  doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
  yPosition += 15;

  // Pricing Subtotals
  doc.text('Subtotal:', 350, yPosition).text(`Rs ${order.pricing.subtotal.toFixed(2)}`, 450, yPosition);
  yPosition += 15;
  doc.text('Shipping:', 350, yPosition).text(`Rs ${order.pricing.shippingFee.toFixed(2)}`, 450, yPosition);
  yPosition += 15;
  if(order.pricing.discount > 0) {
    doc.text(`Discount (${order.pricing.couponCode}):`, 350, yPosition).text(`- Rs ${order.pricing.discount.toFixed(2)}`, 450, yPosition);
    yPosition += 15;
  }
  doc.font('Helvetica-Bold')
     .text('Grand Total:', 350, yPosition)
     .text(`Rs ${order.pricing.total.toFixed(2)}`, 450, yPosition);

  // Footer
  doc.fontSize(10)
     .text('Thank you for your business. For any queries, please refer to the support channels mentioned above.', 50, 700, { align: 'center', width: 500 });
  
  doc.end();
};

module.exports = { generateInvoicePDF };
