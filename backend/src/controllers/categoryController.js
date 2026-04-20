const categoryService = require('../services/categoryService');
const asyncHandler = require('../middlewares/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.getAllCategories();
  new ApiResponse(200, 'Categories fetched', categories).send(res);
});

const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryBySlug(req.params.slug);
  new ApiResponse(200, 'Category fetched', category).send(res);
});

const createCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.body);
  new ApiResponse(201, 'Category created', category).send(res, 201);
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.updateCategory(req.params.id, req.body);
  new ApiResponse(200, 'Category updated', category).send(res);
});

const deleteCategory = asyncHandler(async (req, res) => {
  await categoryService.deleteCategory(req.params.id);
  new ApiResponse(200, 'Category deleted').send(res);
});

module.exports = { getAllCategories, getCategoryBySlug, createCategory, updateCategory, deleteCategory };
