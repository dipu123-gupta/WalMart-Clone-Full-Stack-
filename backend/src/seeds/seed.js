const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const Inventory = require('../models/Inventory');
const Coupon = require('../models/Coupon');
const logger = require('../config/logger');
const env = require('../config/env');

const categories = [
  { name: 'Electronics', slug: 'electronics', icon: '📱', color: 'from-blue-500 to-cyan-400', description: 'Smartphones, laptops, accessories', sortOrder: 1 },
  { name: 'Fashion', slug: 'fashion', icon: '👗', color: 'from-pink-500 to-rose-400', description: 'Clothing, shoes, accessories', sortOrder: 2 },
  { name: 'Home & Kitchen', slug: 'home-kitchen', icon: '🏠', color: 'from-green-500 to-emerald-400', description: 'Furniture, appliances, decor', sortOrder: 3 },
  { name: 'Beauty', slug: 'beauty', icon: '💄', color: 'from-purple-500 to-fuchsia-400', description: 'Skincare, makeup, fragrance', sortOrder: 4 },
  { name: 'Sports', slug: 'sports', icon: '⚽', color: 'from-orange-500 to-amber-400', description: 'Fitness, outdoor, sports gear', sortOrder: 5 },
  { name: 'Books', slug: 'books', icon: '📚', color: 'from-indigo-500 to-violet-400', description: 'Fiction, non-fiction, academic', sortOrder: 6 },
  { name: 'Toys', slug: 'toys', icon: '🧸', color: 'from-red-500 to-pink-400', description: 'Kids toys, games, puzzles', sortOrder: 7 },
  { name: 'Grocery', slug: 'grocery', icon: '🍎', color: 'from-lime-500 to-green-400', description: 'Fresh produce, snacks, beverages', sortOrder: 8 },
];

const sampleProducts = [
  { name: 'iPhone 15 Pro Max', brand: 'Apple', basePrice: 134900, salePrice: 129900, description: 'Latest Apple flagship with A17 Pro chip, titanium design, and 48MP camera system.', tags: ['smartphone', 'apple', 'premium'], catSlug: 'electronics' },
  { name: 'Samsung Galaxy S24 Ultra', brand: 'Samsung', basePrice: 129999, salePrice: 119999, description: 'Galaxy AI powered smartphone with S Pen, 200MP camera, and titanium frame.', tags: ['smartphone', 'samsung', 'ai'], catSlug: 'electronics' },
  { name: 'Sony WH-1000XM5 Headphones', brand: 'Sony', basePrice: 29990, salePrice: 24990, description: 'Industry-leading noise cancellation with exceptional sound quality.', tags: ['headphones', 'wireless', 'noise-cancelling'], catSlug: 'electronics' },
  { name: 'MacBook Air M3', brand: 'Apple', basePrice: 114900, salePrice: 109900, description: '15-inch Liquid Retina display, M3 chip, 18-hour battery life.', tags: ['laptop', 'apple', 'ultrabook'], catSlug: 'electronics' },
  { name: 'Nike Air Max 270', brand: 'Nike', basePrice: 12995, salePrice: 8997, description: 'Iconic lifestyle sneaker with large Max Air unit for all-day comfort.', tags: ['sneakers', 'nike', 'running'], catSlug: 'fashion' },
  { name: 'Levi\'s 501 Original Jeans', brand: 'Levis', basePrice: 4599, salePrice: 3199, description: 'The original blue jean since 1873. Straight leg, button fly.', tags: ['jeans', 'denim', 'classic'], catSlug: 'fashion' },
  { name: 'Dyson V15 Detect Vacuum', brand: 'Dyson', basePrice: 62900, salePrice: 54900, description: 'Laser reveals microscopic dust. Most powerful intelligent vacuum.', tags: ['vacuum', 'home', 'cleaning'], catSlug: 'home-kitchen' },
  { name: 'Instant Pot Duo 7-in-1', brand: 'Instant Pot', basePrice: 8999, salePrice: 5999, description: 'Pressure cooker, slow cooker, rice cooker, steamer, sauté pan, yogurt maker, warmer.', tags: ['kitchen', 'cooker', 'appliance'], catSlug: 'home-kitchen' },
  { name: 'The Ordinary Niacinamide 10%', brand: 'The Ordinary', basePrice: 590, salePrice: 490, description: 'High-strength vitamin and mineral blemish formula for congested skin.', tags: ['skincare', 'serum', 'acne'], catSlug: 'beauty' },
  { name: 'Yoga Mat Premium 6mm', brand: 'Boldfit', basePrice: 1499, salePrice: 699, description: 'Anti-skid, eco-friendly exercise mat with carrying strap.', tags: ['yoga', 'fitness', 'exercise'], catSlug: 'sports' },
  { name: 'Atomic Habits by James Clear', brand: 'Penguin', basePrice: 599, salePrice: 399, description: 'An easy & proven way to build good habits & break bad ones.', tags: ['self-help', 'habits', 'bestseller'], catSlug: 'books' },
  { name: 'LEGO Star Wars Millennium Falcon', brand: 'LEGO', basePrice: 14999, salePrice: 12999, description: '1351-piece building set for ages 9 and up.', tags: ['lego', 'star-wars', 'building'], catSlug: 'toys' },
];

const seed = async () => {
  try {
    await connectDB();
    logger.info('Connected to DB for seeding...');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      ProductVariant.deleteMany({}),
      Inventory.deleteMany({}),
      Coupon.deleteMany({}),
    ]);
    logger.info('Cleared existing data');

    // Create admin user
    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: env.SEED_ADMIN_EMAIL,
      password: env.SEED_ADMIN_PASSWORD,
      role: 'admin',
      isVerified: true,
    });
    logger.info(`Admin user created: ${env.SEED_ADMIN_EMAIL} / ${env.SEED_ADMIN_PASSWORD}`);

    // Create seller user
    const seller = await User.create({
      firstName: 'John',
      lastName: 'Seller',
      email: env.SEED_SELLER_EMAIL,
      password: env.SEED_SELLER_PASSWORD,
      role: 'seller',
      isVerified: true,
    });
    logger.info(`Seller user created: ${env.SEED_SELLER_EMAIL} / ${env.SEED_SELLER_PASSWORD}`);

    // Create customer
    const customer = await User.create({
      firstName: 'Jane',
      lastName: 'Customer',
      email: env.SEED_CUSTOMER_EMAIL,
      password: env.SEED_CUSTOMER_PASSWORD,
      role: 'customer',
      isVerified: true,
    });
    logger.info(`Customer user created: ${env.SEED_CUSTOMER_EMAIL} / ${env.SEED_CUSTOMER_PASSWORD}`);

    // Categories
    const createdCategories = {};
    for (const cat of categories) {
      const created = await Category.create(cat);
      createdCategories[cat.slug] = created;
    }
    logger.info(`${Object.keys(createdCategories).length} categories created`);

    // Products
    const productsCreated = [];
    for (let i = 0; i < sampleProducts.length; i++) {
      const sp = sampleProducts[i];
      const category = createdCategories[sp.catSlug];
      const product = await Product.create({
        name: sp.name,
        slug: sp.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        brand: sp.brand,
        description: sp.description,
        shortDescription: sp.description.substring(0, 80),
        categoryId: category._id,
        sellerId: seller._id,
        basePrice: sp.basePrice,
        salePrice: sp.salePrice,
        taxRate: 18,
        tags: sp.tags,
        status: 'active',
        avgRating: (3.5 + Math.random() * 1.5).toFixed(1),
        totalRatings: Math.floor(Math.random() * 500) + 10,
        totalSold: Math.floor(Math.random() * 1000),
        viewCount: Math.floor(Math.random() * 5000),
        images: [
          {
            url: `https://placehold.co/600x600/0071dc/white?text=${encodeURIComponent(sp.name.split(' ').slice(0, 2).join('+'))}`,
            publicId: 'seed-placeholder-' + i,
            alt: sp.name,
            isPrimary: true,
          },
        ],
      });
      productsCreated.push(product);

      // Create default inventory
      await Inventory.create({
        productId: product._id,
        sellerId: seller._id,
        quantity: 100 + Math.floor(Math.random() * 200),
        reservedQuantity: Math.floor(Math.random() * 10),
        lowStockThreshold: 10,
      });
    }
    logger.info(`${productsCreated.length} products created`);

    // Coupons
    await Coupon.create([
      {
        code: 'WELCOME10',
        description: 'Get 10% off on your first order',
        discountType: 'percentage',
        discountValue: 10,
        maxDiscountAmount: 500,
        minOrderAmount: 500,
        usageLimit: 1000,
        perUserLimit: 1,
        validFrom: new Date(),
        validTo: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
      {
        code: 'FLAT200',
        description: '₹200 off on orders above ₹1500',
        discountType: 'fixed',
        discountValue: 200,
        minOrderAmount: 1500,
        usageLimit: 500,
        perUserLimit: 2,
        validFrom: new Date(),
        validTo: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      },
      {
        code: 'SUPER50',
        description: '50% off up to ₹2000',
        discountType: 'percentage',
        discountValue: 50,
        maxDiscountAmount: 2000,
        minOrderAmount: 2000,
        usageLimit: 100,
        perUserLimit: 1,
        validFrom: new Date(),
        validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    ]);
    logger.info('3 coupons created');

    logger.info('\n✅ Seed completed successfully!\n');
    logger.info('Test credentials:');
    logger.info(`  Admin:    ${env.SEED_ADMIN_EMAIL}    / ${env.SEED_ADMIN_PASSWORD}`);
    logger.info(`  Seller:   ${env.SEED_SELLER_EMAIL}   / ${env.SEED_SELLER_PASSWORD}`);
    logger.info(`  Customer: ${env.SEED_CUSTOMER_EMAIL} / ${env.SEED_CUSTOMER_PASSWORD}`);
    logger.info('  Coupons:  WELCOME10, FLAT200, SUPER50\n');

    process.exit(0);
  } catch (error) {
    logger.error('Seed failed:', error);
    process.exit(1);
  }
};

seed();
