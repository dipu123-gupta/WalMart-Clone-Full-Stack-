const productService = require('../services/productService');
const asyncHandler = require('../middlewares/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

// ===== Public =====
const getProducts = asyncHandler(async (req, res) => {
  const result = await productService.getProducts(req.query);
  new ApiResponse(200, 'Products fetched', result.products, result.meta).send(res);
});

const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await productService.getProductBySlug(req.params.slug, req.user?._id);
  new ApiResponse(200, 'Product fetched', product).send(res);
});

const searchProducts = asyncHandler(async (req, res) => {
  const result = await productService.searchProducts(req.query);
  new ApiResponse(200, 'Search results', result.products, result.meta).send(res);
});

const getSuggestions = asyncHandler(async (req, res) => {
  const suggestions = await productService.getSuggestions(req.query);
  new ApiResponse(200, 'Suggestions', suggestions).send(res);
});

const getRecentlyViewed = asyncHandler(async (req, res) => {
  const products = await productService.getRecentlyViewed(req.user._id);
  new ApiResponse(200, 'Recently viewed', products).send(res);
});

// ===== Seller =====
const createProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.user._id, req.body, req.files || []);
  new ApiResponse(201, 'Product created', product).send(res, 201);
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.user._id, req.params.id, req.body);
  new ApiResponse(200, 'Product updated', product).send(res);
});

const deleteProduct = asyncHandler(async (req, res) => {
  await productService.deleteProduct(req.user._id, req.params.id);
  new ApiResponse(200, 'Product deleted').send(res);
});

const addVariant = asyncHandler(async (req, res) => {
  const variant = await productService.addVariant(req.user._id, req.params.id, req.body);
  new ApiResponse(201, 'Variant added', variant).send(res, 201);
});

const updateVariant = asyncHandler(async (req, res) => {
  const variant = await productService.updateVariant(req.user._id, req.params.id, req.params.vid, req.body);
  new ApiResponse(200, 'Variant updated', variant).send(res);
});

// ===== Admin =====
const approveProduct = asyncHandler(async (req, res) => {
  const product = await productService.approveProduct(req.params.id, req.body);
  new ApiResponse(200, 'Product status updated', product).send(res);
});

const getPendingProducts = asyncHandler(async (req, res) => {
  const result = await productService.getPendingProducts(req.query);
  new ApiResponse(200, 'Pending products', result.products, result.meta).send(res);
});

const getFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await productService.getFeaturedProducts(req.query.limit);
  new ApiResponse(200, 'Featured products fetched', products).send(res);
});

module.exports = {
  getProducts, getProductBySlug, searchProducts, getSuggestions, getRecentlyViewed, getFeaturedProducts,
  createProduct, updateProduct, deleteProduct, addVariant, updateVariant,
  approveProduct, getPendingProducts,
};
