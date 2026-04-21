import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Heart, Star, ShoppingCart, GitCompare } from 'lucide-react';
import { addToCart } from '@/features/cart/cartSlice';
import { toggleWishlist } from '@/features/wishlist/wishlistSlice';
import { addToCompare } from '@/features/compare/compareSlice';
import { optimizeCloudinaryUrl } from '@/utils/imageOptimizer';
import toast from 'react-hot-toast';

const ProductCard = ({ product, isWishlisted = false }) => {
  const dispatch = useDispatch();
  const { name, slug, images, basePrice, salePrice, avgRating, totalRatings, brand } = product;
  const discount = salePrice ? Math.round(((basePrice - salePrice) / basePrice) * 100) : 0;
  const primaryImage = optimizeCloudinaryUrl(images?.[0]?.url, 'w_300,h_300,c_fill,q_auto,f_auto');

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(addToCart({ productId: product._id, quantity: 1 }));
    toast.success('Added to cart!');
  };

  const handleToggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(toggleWishlist(product._id));
    toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
  };

  const handleCompare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(addToCompare(product));
    toast.success('Added to comparison');
  };

  return (
    <Link to={`/products/${slug}`} className="group" id={`product-${slug}`}>
      <div className="bg-white rounded-2xl overflow-hidden card-hover border border-gray-100">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          <img
            src={primaryImage}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          {/* Discount badge */}
          {discount > 0 && (
            <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {discount}% OFF
            </span>
          )}
          {/* Quick actions */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleToggleWishlist}
              className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-colors ${
                isWishlisted ? 'bg-red-500 text-white' : 'bg-white text-gray-600 hover:text-red-500'
              }`}
            >
              <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={handleCompare}
              className="w-9 h-9 bg-white text-gray-600 hover:text-walmart-blue rounded-full flex items-center justify-center shadow-lg transition-colors"
              title="Add to Compare"
            >
              <GitCompare size={16} />
            </button>
          </div>
          {/* Add to cart */}
          <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
            <button
              onClick={handleAddToCart}
              className="w-full flex items-center justify-center gap-2 bg-walmart-blue text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-walmart-dark transition-colors shadow-lg"
            >
              <ShoppingCart size={16} /> Add to Cart
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          {brand && <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">{brand}</p>}
          <h3 className="font-medium text-sm line-clamp-2 mb-2 group-hover:text-walmart-blue transition-colors">{name}</h3>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-2">
            <div className="flex items-center gap-0.5 bg-green-50 px-2 py-0.5 rounded-md">
              <Star size={12} className="text-yellow-500" fill="currentColor" />
              <span className="text-xs font-semibold text-green-700">{avgRating?.toFixed(1) || 'New'}</span>
            </div>
            {totalRatings > 0 && <span className="text-xs text-gray-400">({totalRatings})</span>}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-gray-900">₹{(salePrice || basePrice)?.toLocaleString()}</span>
            {salePrice && salePrice < basePrice && (
              <span className="text-sm text-gray-400 line-through">₹{basePrice?.toLocaleString()}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
