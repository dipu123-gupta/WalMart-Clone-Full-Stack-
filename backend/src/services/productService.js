const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const Inventory = require('../models/Inventory');
const Category = require('../models/Category');
const RecentlyViewed = require('../models/RecentlyViewed');
const ApiError = require('../utils/ApiError');
const createSlug = require('../utils/slugify');
const { buildPagination, buildPaginationMeta } = require('../utils/pagination');
const { cacheGetOrSet, invalidatePattern } = require('../config/cache');
const cloudinary = require('../config/cloudinary');
const { eventEmitter, EVENTS } = require('../events/eventEmitter');
const logger = require('../config/logger');

class ProductService {
  /**
   * Get featured products
   */
  async getFeaturedProducts(limit = 8) {
    return Product.find({ isFeatured: true, status: 'active' })
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();
  }

  /**
   * Get products with advanced filtering, sorting, & pagination
   */
  async getProducts(query) {
    const { page, limit, skip, sort } = buildPagination(query);
    const filter = { status: 'active' };

    // Category filter
    if (query.category) {
      const category = await Category.findOne({ slug: query.category });
      if (category) {
        // Include subcategories
        const childIds = await Category.find({ parentId: category._id }).select('_id');
        const allCategoryIds = [category._id, ...childIds.map((c) => c._id)];
        filter.categoryId = { $in: allCategoryIds };
      }
    }

    // Price range
    if (query.minPrice || query.maxPrice) {
      filter.basePrice = {};
      if (query.minPrice) filter.basePrice.$gte = Number(query.minPrice);
      if (query.maxPrice) filter.basePrice.$lte = Number(query.maxPrice);
    }

    // Brand filter
    if (query.brand) {
      filter.brand = { $in: query.brand.split(',').map((b) => new RegExp(b.trim(), 'i')) };
    }

    // Rating filter
    if (query.minRating) {
      filter.avgRating = { $gte: Number(query.minRating) };
    }

    // In stock filter
    if (query.inStock === 'true') {
      filter.totalSold = { $exists: true }; // We'll refine this with inventory join
    }

    // Seller filter
    if (query.seller) {
      filter.sellerId = query.seller;
    }

    // Featured
    if (query.featured === 'true') {
      filter.isFeatured = true;
    }

    // Tags
    if (query.tags) {
      filter.tags = { $in: query.tags.split(',').map((t) => t.trim().toLowerCase()) };
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('categoryId', 'name slug')
        .populate('sellerId', 'firstName lastName')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    return {
      products,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  /**
   * Get product by slug (with full details)
   */
  async getProductBySlug(slug, userId = null) {
    const product = await Product.findOne({ slug, status: 'active' })
      .populate('categoryId', 'name slug')
      .populate('sellerId', 'firstName lastName avatar')
      .populate('variants')
      .lean();

    if (!product) throw ApiError.notFound('Product not found');

    // Get inventory for variants
    if (product.variants?.length > 0) {
      const variantIds = product.variants.map((v) => v._id);
      const inventories = await Inventory.find({ variantId: { $in: variantIds } }).lean();
      product.variants = product.variants.map((v) => {
        const inv = inventories.find((i) => i.variantId.toString() === v._id.toString());
        return {
          ...v,
          stock: inv ? inv.quantity - inv.reservedQuantity : 0,
          isOutOfStock: inv ? inv.quantity - inv.reservedQuantity <= 0 : true,
        };
      });
    }

    // Increment view count (fire and forget)
    Product.findByIdAndUpdate(product._id, { $inc: { viewCount: 1 } }).exec();

    // Track recently viewed
    if (userId) {
      RecentlyViewed.findOneAndUpdate(
        { userId, productId: product._id },
        { viewedAt: new Date() },
        { upsert: true, new: true }
      ).exec();
    }

    return product;
  }

  /**
   * Full-text search
   */
  async searchProducts(query) {
    const { page, limit, skip } = buildPagination(query);
    const searchQuery = query.q;
    if (!searchQuery) throw ApiError.badRequest('Search query is required');

    const filter = {
      $text: { $search: searchQuery },
      status: 'active',
    };

    // Add common filters
    if (query.category) {
      const category = await Category.findOne({ slug: query.category });
      if (category) filter.categoryId = category._id;
    }
    
    if (query.minPrice || query.maxPrice) {
      filter.basePrice = {};
      if (query.minPrice) filter.basePrice.$gte = Number(query.minPrice);
      if (query.maxPrice) filter.basePrice.$lte = Number(query.maxPrice);
    }

    if (query.minRating) {
      filter.avgRating = { $gte: Number(query.minRating) };
    }

    const [products, total] = await Promise.all([
      Product.find(filter, { score: { $meta: 'textScore' } })
        .populate('categoryId', 'name slug')
        .sort({ score: { $meta: 'textScore' } })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    return {
      products,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  /**
   * Auto-suggestions
   */
  async getSuggestions(query) {
    const q = query.q;
    if (!q || q.length < 2) return [];

    const suggestions = await Product.find(
      {
        name: new RegExp(q, 'i'),
        status: 'active',
      },
      { name: 1, slug: 1, images: { $slice: 1 }, basePrice: 1, salePrice: 1 }
    )
      .limit(8)
      .lean();

    return suggestions;
  }

  // ===== Seller Product Management =====

  /**
   * Create product (seller)
   */
  async createProduct(sellerId, data, files = []) {
    // Generate unique slug
    let slug = createSlug(data.name);
    const existing = await Product.findOne({ slug });
    if (existing) slug = createSlug(data.name, true);

    // Upload images to Cloudinary
    const images = [];
    if (files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const result = await this._uploadImage(files[i], 'walmart/products');
        images.push({
          url: result.secure_url,
          publicId: result.public_id,
          alt: data.name,
          isPrimary: i === 0,
        });
      }
    }

    const product = await Product.create({
      ...data,
      slug,
      sellerId,
      images,
      status: 'pending_approval',
    });

    // P0-3: Auto-create inventory record for the base product
    // (variant inventory is created separately via addVariant)
    await Inventory.create({
      productId: product._id,
      variantId: null,
      sellerId,
      quantity: Number(data.stock) || 0,
      lowStockThreshold: Number(data.lowStockThreshold) || 10,
    });

    // Invalidate cache
    invalidatePattern('products:');

    return product;
  }

  /**
   * Update product (seller — own products only)
   */
  async updateProduct(sellerId, productId, data) {
    const product = await Product.findOne({ _id: productId, sellerId });
    if (!product) throw ApiError.notFound('Product not found or unauthorized');

    const allowedUpdates = [
      'name', 'description', 'shortDescription', 'brand',
      'categoryId', 'basePrice', 'salePrice', 'taxRate',
      'specifications', 'tags', 'seoTitle', 'seoDescription',
    ];

    for (const key of allowedUpdates) {
      if (data[key] !== undefined) product[key] = data[key];
    }

    // Regenerate slug if name changed
    if (data.name && data.name !== product.name) {
      product.slug = createSlug(data.name, true);
    }

    // Re-submit for approval if key fields changed
    if (data.name || data.description) {
      product.status = 'pending_approval';
    }

    await product.save();
    invalidatePattern('products:');
    return product;
  }

  /**
   * Soft delete product
   */
  async deleteProduct(sellerId, productId) {
    const product = await Product.findOne({ _id: productId, sellerId });
    if (!product) throw ApiError.notFound('Product not found or unauthorized');

    product.isDeleted = true;
    product.status = 'archived';
    await product.save();
    invalidatePattern('products:');
    return { message: 'Product deleted' };
  }

  /**
   * Add variant to product
   */
  async addVariant(sellerId, productId, data) {
    const product = await Product.findOne({ _id: productId, sellerId });
    if (!product) throw ApiError.notFound('Product not found or unauthorized');

    const variant = await ProductVariant.create({
      productId,
      ...data,
    });

    // Create inventory record
    await Inventory.create({
      productId,
      variantId: variant._id,
      sellerId,
      quantity: data.stock || 0,
    });

    return variant;
  }

  /**
   * Update variant
   */
  async updateVariant(sellerId, productId, variantId, data) {
    const product = await Product.findOne({ _id: productId, sellerId });
    if (!product) throw ApiError.notFound('Product not found');

    const variant = await ProductVariant.findOneAndUpdate(
      { _id: variantId, productId },
      data,
      { new: true, runValidators: true }
    );
    if (!variant) throw ApiError.notFound('Variant not found');

    // Update inventory if stock provided
    if (data.stock !== undefined) {
      await Inventory.findOneAndUpdate(
        { variantId },
        { quantity: data.stock },
        { upsert: true }
      );
    }

    return variant;
  }

  // ===== Admin Product Management =====

  /**
   * Approve/reject product
   */
  async approveProduct(productId, { status, approvalNote }) {
    if (!['active', 'rejected'].includes(status)) {
      throw ApiError.badRequest('Status must be active or rejected');
    }

    const product = await Product.findByIdAndUpdate(
      productId,
      { status, approvalNote: approvalNote || '' },
      { new: true }
    ).populate('sellerId', 'firstName lastName email');

    if (!product) throw ApiError.notFound('Product not found');

    // Update category product count
    if (status === 'active') {
      await Category.findByIdAndUpdate(product.categoryId, { $inc: { productCount: 1 } });
      eventEmitter.emit(EVENTS.PRODUCT_APPROVED, { product });
    } else {
      eventEmitter.emit(EVENTS.PRODUCT_REJECTED, { product });
    }

    invalidatePattern('products:');
    return product;
  }

  /**
   * Get pending products for admin
   */
  async getPendingProducts(query) {
    const { page, limit, skip } = buildPagination(query);
    const filter = { status: 'pending_approval' };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('sellerId', 'firstName lastName email')
        .populate('categoryId', 'name')
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    return { products, meta: buildPaginationMeta(total, page, limit) };
  }

  /**
   * Get recently viewed products
   */
  async getRecentlyViewed(userId, limit = 12) {
    const views = await RecentlyViewed.find({ userId })
      .sort({ viewedAt: -1 })
      .limit(limit)
      .populate({
        path: 'productId',
        select: 'name slug images basePrice salePrice avgRating',
        match: { status: 'active', isDeleted: false },
      })
      .lean();

    return views
      .filter((v) => v.productId)
      .map((v) => v.productId);
  }

  /**
   * Bulk upload products via CSV
   */
  async bulkUploadProducts(sellerId, fileBuffer) {
    const csv = require('csv-parser');
    const { Readable } = require('stream');
    const products = [];

    return new Promise((resolve, reject) => {
      const stream = Readable.from(fileBuffer);
      stream
        .pipe(csv())
        .on('data', (row) => {
          if (row.name && row.basePrice) {
            products.push({
              name: row.name,
              description: row.description || '',
              brand: row.brand || '',
              basePrice: Number(row.basePrice),
              salePrice: row.salePrice ? Number(row.salePrice) : null,
              categoryId: row.categoryId, // UUID
              sellerId,
              status: 'pending_approval',
              slug: createSlug(row.name, true),
              images: [{ url: process.env.DEFAULT_PRODUCT_IMAGE || 'https://placehold.co/800x800/e2e8f0/64748b?text=No+Image', publicId: 'placeholder', isPrimary: true }]
            });
          }
        })
        .on('end', async () => {
          try {
            const result = await Product.insertMany(products);
            invalidatePattern('products:');
            resolve({ count: result.length, message: 'Products uploaded for approval' });
          } catch (err) {
            reject(ApiError.internal('CSV processing failed: ' + err.message));
          }
        })
        .on('error', (err) => reject(ApiError.badRequest('Invalid CSV format')));
    });
  }

  // ===== Private helpers =====

  async _uploadImage(file, folder) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          transformation: [
            { width: 800, height: 800, crop: 'limit' },
            { quality: 'auto', fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(file.buffer);
    });
  }
}

module.exports = new ProductService();
