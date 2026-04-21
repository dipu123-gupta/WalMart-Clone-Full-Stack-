const Cart = require('../models/Cart');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const Inventory = require('../models/Inventory');
const Coupon = require('../models/Coupon');
const ApiError = require('../utils/ApiError');

class CartService {
  /**
   * Get cart (user or guest)
   */
  async getCart(userId, sessionId) {
    if (!userId && !sessionId) {
      throw ApiError.badRequest('User ID or Session ID is required to fetch cart');
    }

    // Strict filter: avoid finding a user's cart using guest session ID
    const filter = userId ? { userId } : { sessionId, userId: null };
    
    let cart = await Cart.findOne(filter)
      .populate({
        path: 'items.productId',
        select: 'name slug images basePrice salePrice status isDeleted sellerId',
      })
      .populate({
        path: 'items.variantId',
        select: 'name sku price salePrice attributes',
      });

    if (!cart) {
      try {
        cart = await Cart.create({ ...filter, items: [] });
      } catch (error) {
        if (error.code === 11000) {
          cart = await Cart.findOne(filter)
            .populate({
              path: 'items.productId',
              select: 'name slug images basePrice salePrice status isDeleted sellerId',
            })
            .populate({
              path: 'items.variantId',
              select: 'name sku price salePrice attributes',
            });
        } else {
          throw error;
        }
      }
    }

    // Validate cart items
    return this._validateCartItems(cart);
  }

  /**
   * Add item to cart
   */
  async addItem(userId, sessionId, { productId, variantId, quantity = 1 }) {
    if (!userId && !sessionId) {
      throw ApiError.badRequest('User ID or Session ID is required');
    }

    const product = await Product.findById(productId);
    if (!product || product.status !== 'active' || product.isDeleted) {
      throw ApiError.notFound('Product not found or unavailable');
    }

    let price = product.salePrice || product.basePrice;
    
    if (variantId) {
      const variant = await ProductVariant.findOne({ _id: variantId, productId });
      if (!variant) throw ApiError.notFound('Variant not found');
      price = variant.salePrice || variant.price;
    }

    // Check stock
    const inventoryFilter = variantId ? { variantId } : { productId, variantId: null };
    const inventory = await Inventory.findOne(inventoryFilter);
    if (inventory && inventory.quantity - inventory.reservedQuantity < quantity) {
      throw ApiError.badRequest('Insufficient stock');
    }

    const filter = userId ? { userId } : { sessionId, userId: null };
    let cart = await Cart.findOne(filter);
    
    if (!cart) {
      try {
         cart = await Cart.create({ ...filter, items: [] });
      } catch (e) {
         if (e.code === 11000) cart = await Cart.findOne(filter);
         else throw e;
      }
    }

    // Robust Item Matching (handles populated, unpopulated, or NULL productId)
    const existingIndex = cart.items.findIndex(item => {
      if (!item.productId) return false; // Skip broken references

      const pId = (item.productId._id || item.productId).toString();
      const vId = item.variantId 
        ? (item.variantId._id || item.variantId).toString() 
        : null;
      
      return pId === productId.toString() && vId === (variantId ? variantId.toString() : null);
    });

    if (existingIndex > -1) {
      const newQty = cart.items[existingIndex].quantity + Number(quantity);
      if (newQty > 10) throw ApiError.badRequest('Maximum 10 units per item');
      cart.items[existingIndex].quantity = newQty;
      cart.items[existingIndex].price = price;
    } else {
      if (cart.items.length >= 50) throw ApiError.badRequest('Cart is full (max 50 items)');
      cart.items.push({ productId, variantId: variantId || null, quantity: Number(quantity), price });
    }

    await cart.save();
    return this.getCart(userId, sessionId);
  }

  /**
   * Update item quantity
   */
  async updateItem(userId, sessionId, itemId, { quantity }) {
    if (quantity < 1 || quantity > 10) {
      throw ApiError.badRequest('Quantity must be between 1 and 10');
    }

    const filter = userId ? { userId } : { sessionId, userId: null };
    const cart = await Cart.findOne(filter);
    if (!cart) throw ApiError.notFound('Cart not found');

    const item = cart.items.id(itemId);
    if (!item) throw ApiError.notFound('Item not found in cart');

    // Check stock
    if (item.variantId) {
      const inventory = await Inventory.findOne({ variantId: item.variantId });
      if (inventory && inventory.quantity - inventory.reservedQuantity < quantity) {
        throw ApiError.badRequest('Insufficient stock');
      }
    }

    item.quantity = quantity;
    await cart.save();
    return this.getCart(userId, sessionId);
  }

  /**
   * Remove item from cart
   */
  async removeItem(userId, sessionId, itemId) {
    const filter = userId ? { userId } : { sessionId, userId: null };
    const cart = await Cart.findOne(filter);
    if (!cart) throw ApiError.notFound('Cart not found');

    cart.items = cart.items.filter((item) => item._id.toString() !== itemId);
    await cart.save();
    return this.getCart(userId, sessionId);
  }

  /**
   * Clear cart
   */
  async clearCart(userId, sessionId) {
    const filter = userId ? { userId } : { sessionId, userId: null };
    await Cart.findOneAndUpdate(filter, {
      items: [],
      couponCode: null,
      couponDiscount: 0,
    });
    return { message: 'Cart cleared' };
  }

  /**
   * Sync guest cart to user cart on login
   */
  async syncCart(userId, sessionId) {
    if (!sessionId) return this.getCart(userId, null);

    const guestCart = await Cart.findOne({ sessionId });
    if (!guestCart || guestCart.items.length === 0) {
      return this.getCart(userId, null);
    }

    let userCart = await Cart.findOne({ userId });
    if (!userCart) {
      // Simply transfer guest cart
      guestCart.userId = userId;
      guestCart.sessionId = null;
      await guestCart.save();
      return this.getCart(userId, null);
    }

    // Merge: add guest items to user cart (skip duplicates)
    for (const guestItem of guestCart.items) {
      const exists = userCart.items.find(
        (item) =>
          item.productId.toString() === guestItem.productId.toString() &&
          ((!guestItem.variantId && !item.variantId) ||
            (guestItem.variantId && item.variantId?.toString() === guestItem.variantId?.toString()))
      );

      if (!exists && userCart.items.length < 50) {
        userCart.items.push(guestItem);
      }
    }

    await userCart.save();
    await Cart.deleteOne({ sessionId }); // Remove guest cart
    return this.getCart(userId, null);
  }

  /**
   * Apply coupon
   */
  async applyCoupon(userId, code) {
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) throw ApiError.notFound('Invalid coupon code');

    const cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0) {
      throw ApiError.badRequest('Cart is empty');
    }

    // Calculate subtotal
    const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Validate coupon
    const { valid, reason } = coupon.isValid(userId, subtotal);
    if (!valid) throw ApiError.badRequest(reason);

    const discount = coupon.calculateDiscount(subtotal);

    cart.couponCode = coupon.code;
    cart.couponDiscount = discount;
    await cart.save();

    return this.getCart(userId, null);
  }

  /**
   * Remove coupon
   */
  async removeCoupon(userId) {
    await Cart.findOneAndUpdate({ userId }, { couponCode: null, couponDiscount: 0 });
    return this.getCart(userId, null);
  }

  // ===== Private =====

  /**
   * Validate all cart items — check product status, stock, update prices
   */
  async _validateCartItems(cart) {
    let hasChanges = false;
    const warnings = [];
    const validItems = [];

    for (const item of cart.items) {
      const product = item.productId;
      if (!product || product.status !== 'active' || product.isDeleted) {
        warnings.push(`"${product?.name || 'Unknown'}" is no longer available`);
        hasChanges = true;
        continue;
      }

      // Update price if changed
      const currentPrice = product.salePrice || product.basePrice;
      let itemPrice = currentPrice;

      if (item.variantId) {
        const variant = item.variantId;
        if (variant) {
          itemPrice = variant.salePrice || variant.price;
        }
      }

      if (Math.abs(item.price - itemPrice) > 0.01) {
        warnings.push(`Price of "${product.name}" has changed`);
        item.price = itemPrice;
        hasChanges = true;
      }

      validItems.push(item);
    }

    if (hasChanges) {
      cart.items = validItems;
      await cart.save();
    }

    const cartObj = cart.toObject();
    cartObj.warnings = warnings;
    return cartObj;
  }
}

module.exports = new CartService();
