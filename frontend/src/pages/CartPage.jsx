import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchCart, updateCartItem, removeCartItem, applyCoupon } from '@/features/cart/cartSlice';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

const CartPage = () => {
  const dispatch = useDispatch();
  const { items, couponCode, couponDiscount, warnings, isLoading } = useSelector((state) => state.cart);
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal >= 500 ? 0 : 40;
  const total = subtotal + shipping - couponDiscount;

  const handleQuantityChange = (itemId, quantity) => {
    if (quantity < 1 || quantity > 10) return;
    dispatch(updateCartItem({ itemId, quantity }));
  };

  const handleRemove = (itemId) => {
    dispatch(removeCartItem(itemId));
    toast.success('Item removed');
  };

  if (!isLoading && items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
          <ShoppingBag size={40} className="text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Looks like you haven't added anything yet</p>
        <Link to="/products" className="btn-walmart inline-flex items-center gap-2">
          Start Shopping <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">Shopping Cart ({items.length} items)</h1>

      {/* Warnings */}
      {warnings?.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          {warnings.map((w, i) => <p key={i} className="text-sm text-yellow-700">⚠️ {w}</p>)}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const product = item.productId || {};
            const variant = item.variantId;
            return (
              <div key={item._id} className="bg-white rounded-2xl p-4 sm:p-6 border flex gap-4 animate-fade-in">
                <Link to={`/products/${product.slug}`} className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                  <img src={product.images?.[0]?.url || 'https://via.placeholder.com/150'} alt={product.name} className="w-full h-full object-cover" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/products/${product.slug}`} className="font-semibold line-clamp-2 hover:text-walmart-blue transition-colors">{product.name}</Link>
                  {variant && <p className="text-xs text-gray-500 mt-1">Variant: {variant.name}</p>}
                  {product.sellerId && <p className="text-xs text-gray-400 mt-0.5">Seller: {product.sellerId.firstName}</p>}

                  <div className="flex items-center justify-between mt-3 gap-4">
                    <p className="text-lg font-bold">₹{(item.price * item.quantity).toLocaleString()}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center border rounded-xl overflow-hidden">
                        <button onClick={() => handleQuantityChange(item._id, item.quantity - 1)} className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 transition-colors">
                          <Minus size={14} />
                        </button>
                        <span className="w-10 text-center font-semibold text-sm">{item.quantity}</span>
                        <button onClick={() => handleQuantityChange(item._id, item.quantity + 1)} className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 transition-colors">
                          <Plus size={14} />
                        </button>
                      </div>
                      <button onClick={() => handleRemove(item._id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-6 border sticky top-28">
            <h3 className="font-bold text-lg mb-4">Order Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-medium">₹{subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span className="font-medium">{shipping === 0 ? <span className="text-green-600">FREE</span> : `₹${shipping}`}</span></div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span className="flex items-center gap-1"><Tag size={14} /> Coupon ({couponCode})</span>
                  <span>-₹{couponDiscount.toLocaleString()}</span>
                </div>
              )}
              <hr />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>₹{Math.max(0, total).toLocaleString()}</span>
              </div>
            </div>

            {/* Coupon Input Form */}
            <div className="mt-5 pt-5 border-t">
              <p className="text-sm font-semibold mb-2 flex items-center gap-1"><Tag size={16} /> Promo Code</p>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  id="coupon-input"
                  placeholder="Enter code" 
                  className="input-primary uppercase text-sm w-full"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      dispatch(applyCoupon(e.target.value));
                    }
                  }}
                />
                <button 
                  onClick={() => {
                    const input = document.getElementById('coupon-input');
                    if (input.value) dispatch(applyCoupon(input.value));
                  }}
                  className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>

            {subtotal < 500 && (
              <p className="text-xs text-gray-500 mt-3 bg-blue-50 px-3 py-2 rounded-lg">
                Add ₹{(500 - subtotal).toLocaleString()} more for free shipping
              </p>
            )}

            <Link
              to={isAuthenticated ? '/checkout' : '/login?redirect=/checkout'}
              className="btn-walmart w-full py-3 mt-5 flex items-center justify-center gap-2 text-base"
              id="proceed-checkout"
            >
              Proceed to Checkout <ArrowRight size={16} />
            </Link>

            <Link to="/products" className="block text-center text-sm text-walmart-blue mt-3 hover:underline">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
