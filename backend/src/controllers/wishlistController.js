const Wishlist = require('../models/Wishlist');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const asyncHandler = require('../middlewares/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.find({ userId: req.user._id })
    .populate({
      path: 'productId',
      select: 'name slug images basePrice salePrice avgRating totalRatings status',
      match: { status: 'active', isDeleted: false },
    })
    .sort({ createdAt: -1 })
    .lean();

  const items = wishlist.filter((w) => w.productId);
  new ApiResponse(200, 'Wishlist fetched', items).send(res);
});

const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const product = await Product.findById(productId);
  if (!product || product.status !== 'active') throw ApiError.notFound('Product not found');

  await Wishlist.findOneAndUpdate(
    { userId: req.user._id, productId },
    { userId: req.user._id, productId },
    { upsert: true, new: true }
  );
  new ApiResponse(200, 'Added to wishlist').send(res);
});

const removeFromWishlist = asyncHandler(async (req, res) => {
  await Wishlist.findOneAndDelete({ userId: req.user._id, productId: req.params.productId });
  new ApiResponse(200, 'Removed from wishlist').send(res);
});

const moveToCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const product = await Product.findById(productId);
  if (!product || product.status !== 'active') throw ApiError.notFound('Product not found');

  const price = product.salePrice || product.basePrice;
  let cart = await Cart.findOne({ userId: req.user._id });
  if (!cart) cart = await Cart.create({ userId: req.user._id, items: [] });

  const exists = cart.items.find((i) => i.productId.toString() === productId);
  if (!exists) {
    cart.items.push({ productId, quantity: 1, price });
    await cart.save();
  }

  await Wishlist.findOneAndDelete({ userId: req.user._id, productId });
  new ApiResponse(200, 'Moved to cart').send(res);
});

module.exports = { getWishlist, addToWishlist, removeFromWishlist, moveToCart };
