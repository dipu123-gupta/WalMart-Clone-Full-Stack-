const Category = require('../models/Category');
const ApiError = require('../utils/ApiError');
const createSlug = require('../utils/slugify');
const { cacheGetOrSet, invalidatePattern } = require('../config/cache');

class CategoryService {
  async getAllCategories() {
    return cacheGetOrSet('categories:tree', async () => {
      const categories = await Category.find({ isActive: true })
        .sort({ sortOrder: 1, name: 1 })
        .lean();

      // Build tree structure
      const categoryMap = {};
      const tree = [];

      categories.forEach((cat) => {
        categoryMap[cat._id] = { ...cat, children: [] };
      });

      categories.forEach((cat) => {
        if (cat.parentId && categoryMap[cat.parentId]) {
          categoryMap[cat.parentId].children.push(categoryMap[cat._id]);
        } else if (!cat.parentId) {
          tree.push(categoryMap[cat._id]);
        }
      });

      return tree;
    }, 3600); // Cache 1 hour
  }

  async getCategoryBySlug(slug) {
    const category = await Category.findOne({ slug, isActive: true });
    if (!category) throw ApiError.notFound('Category not found');
    const children = await Category.find({ parentId: category._id, isActive: true }).lean();
    return { ...category.toObject(), children };
  }

  async createCategory(data) {
    const slug = createSlug(data.name);
    const existing = await Category.findOne({ slug });
    if (existing) throw ApiError.conflict('Category with this name already exists');

    let level = 0;
    if (data.parentId) {
      const parent = await Category.findById(data.parentId);
      if (!parent) throw ApiError.notFound('Parent category not found');
      level = parent.level + 1;
      if (level > 2) throw ApiError.badRequest('Maximum 3 levels of nesting allowed');
    }

    const category = await Category.create({ ...data, slug, level });
    invalidatePattern('categories:');
    return category;
  }

  async updateCategory(categoryId, data) {
    if (data.name) data.slug = createSlug(data.name);
    const category = await Category.findByIdAndUpdate(categoryId, data, { new: true, runValidators: true });
    if (!category) throw ApiError.notFound('Category not found');
    invalidatePattern('categories:');
    return category;
  }

  async deleteCategory(categoryId) {
    const hasChildren = await Category.countDocuments({ parentId: categoryId });
    if (hasChildren > 0) throw ApiError.badRequest('Cannot delete category with subcategories');

    const category = await Category.findByIdAndDelete(categoryId);
    if (!category) throw ApiError.notFound('Category not found');
    invalidatePattern('categories:');
    return { message: 'Category deleted' };
  }
}

module.exports = new CategoryService();
