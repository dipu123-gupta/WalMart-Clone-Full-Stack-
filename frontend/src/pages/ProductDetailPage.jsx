import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProductBySlug, clearCurrentProduct } from '@/features/products/productSlice';
import { addToCart } from '@/features/cart/cartSlice';
import { toggleWishlist } from '@/features/wishlist/wishlistSlice';
import { Star, Heart, ShoppingCart, Truck, Shield, RotateCcw, Minus, Plus, ChevronRight, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { optimizeCloudinaryUrl } from '@/utils/imageOptimizer';

const ProductDetailPage = () => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const { currentProduct: product, isLoading } = useSelector((state) => state.products);
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);

  // Reviews State
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [formRating, setFormRating] = useState(5);
  const [formTitle, setFormTitle] = useState('');
  const [formComment, setFormComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Q&A State
  const [questions, setQuestions] = useState([]);
  const [loadingQA, setLoadingQA] = useState(true);
  const [showQAForm, setShowQAForm] = useState(false);
  const [formQuestion, setFormQuestion] = useState('');
  const [isSubmittingQA, setIsSubmittingQA] = useState(false);

  // Fetch product and reviews
  useEffect(() => {
    dispatch(fetchProductBySlug(slug));
    return () => { dispatch(clearCurrentProduct()); };
  }, [dispatch, slug]);

  const fetchReviews = async () => {
    if (!product?._id) return;
    try {
      const { default: api } = await import('@/services/api');
      const res = await api.get(`/products/${product._id}/reviews`);
      setReviews(res.data?.data || []);
    } catch (err) { } finally { setLoadingReviews(false); }
  };

  const fetchQA = async () => {
    if (!product?._id) return;
    try {
      const { default: api } = await import('@/services/api');
      const res = await api.get(`/products/${product._id}/questions`);
      setQuestions(res.data?.data || []);
    } catch (err) { } finally { setLoadingQA(false); }
  };

  useEffect(() => {
    if (product?._id) {
      fetchReviews();
      fetchQA();
    }
  }, [product]);

  const submitReview = async () => {
    if (!formTitle || !formComment) return toast.error('Please fill in all fields');
    setIsSubmittingReview(true);
    try {
      const { default: api } = await import('@/services/api');
      const res = await api.post(`/products/${product._id}/reviews`, {
        rating: formRating, title: formTitle, comment: formComment
      });
      setReviews([res.data?.data, ...reviews]);
      setShowReviewForm(false);
      setFormTitle('');
      setFormComment('');
      toast.success('Review posted successfully!');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const submitQuestion = async () => {
    if (formQuestion.length < 10) return;
    setIsSubmittingQA(true);
    try {
      const { default: api } = await import('@/services/api');
      const res = await api.post(`/products/questions`, {
        productId: product._id, question: formQuestion
      });
      setQuestions([res.data?.data, ...questions]);
      setShowQAForm(false);
      setFormQuestion('');
      toast.success('Question posted');
    } catch (err) {
      toast.error('Failed to post question');
    } finally {
      setIsSubmittingQA(false);
    }
  };

  const handleAddToCart = () => {
    dispatch(addToCart({
      productId: product._id,
      variantId: selectedVariant?._id || undefined,
      quantity,
    }));
    toast.success('Added to cart!');
  };

  const handleWishlist = () => {
    dispatch(toggleWishlist(product._id));
    toast.success('Wishlist updated!');
  };

  if (isLoading || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="aspect-square shimmer rounded-2xl"></div>
          <div className="space-y-4">
            <div className="h-4 w-24 shimmer rounded"></div>
            <div className="h-8 w-3/4 shimmer rounded"></div>
            <div className="h-4 w-32 shimmer rounded"></div>
            <div className="h-10 w-40 shimmer rounded"></div>
            <div className="h-20 w-full shimmer rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const price = selectedVariant
    ? (selectedVariant.salePrice || selectedVariant.price)
    : (product.salePrice || product.basePrice);
  const originalPrice = selectedVariant ? selectedVariant.price : product.basePrice;
  const discount = price < originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in text-left">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-walmart-blue">Home</Link>
        <ChevronRight size={14} />
        <Link to="/products" className="hover:text-walmart-blue">Products</Link>
        <ChevronRight size={14} />
        <span className="text-gray-900 font-medium line-clamp-1">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 border">
            <img
              src={optimizeCloudinaryUrl(product.images?.[selectedImage]?.url, 'w_800,q_auto,f_auto')}
              alt={product.name}
              className="w-full h-full object-contain p-4"
            />
            {discount > 0 && (
              <span className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                {discount}% OFF
              </span>
            )}
            <button onClick={handleWishlist} className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-red-50 transition-colors">
              <Heart size={20} className="text-red-500" />
            </button>
          </div>

          {/* Thumbnails */}
          {product.images?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors shrink-0 ${
                    selectedImage === idx ? 'border-walmart-blue' : 'border-gray-200'
                  }`}
                >
                  <img src={optimizeCloudinaryUrl(img.url, 'w_100,h_100,c_fill,q_auto,f_auto')} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-5">
          {product.brand && (
            <span className="text-sm text-walmart-blue font-semibold uppercase tracking-wide">{product.brand}</span>
          )}
          <h1 className="text-2xl lg:text-3xl font-bold leading-tight">{product.name}</h1>

          {/* Rating */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-green-50 px-3 py-1 rounded-lg">
              <Star size={16} className="text-yellow-500" fill="currentColor" />
              <span className="font-bold text-green-700">{product.avgRating?.toFixed(1) || 'New'}</span>
            </div>
            <span className="text-sm text-gray-500">{product.totalRatings || 0} ratings</span>
            <button onClick={() => { if(!isAuthenticated) return toast.error('Login first'); setShowReviewForm(true); }} className="text-sm text-walmart-blue hover:underline">Write a review</button>
          </div>

          {/* Price */}
          <div className="bg-gray-50 rounded-2xl p-5">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold">₹{price?.toLocaleString()}</span>
              {discount > 0 && (
                <>
                  <span className="text-lg text-gray-400 line-through">₹{originalPrice?.toLocaleString()}</span>
                  <span className="text-green-600 font-semibold">{discount}% off</span>
                </>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Inclusive of all taxes</p>
          </div>

          {/* Variants */}
          {product.variants?.length > 0 && (
            <div>
              <p className="text-sm font-semibold mb-2">Select Variant</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v._id}
                    onClick={() => setSelectedVariant(v)}
                    disabled={v.isOutOfStock}
                    className={`px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
                      selectedVariant?._id === v._id
                        ? 'border-walmart-blue bg-blue-50 text-walmart-blue'
                        : v.isOutOfStock
                        ? 'border-gray-200 text-gray-300 cursor-not-allowed line-through'
                        : 'border-gray-200 hover:border-walmart-blue'
                    }`}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <p className="text-sm font-semibold mb-2">Quantity</p>
            <div className="flex items-center gap-3">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 rounded-xl border flex items-center justify-center hover:bg-gray-50">
                <Minus size={16} />
              </button>
              <span className="w-12 text-center font-semibold text-lg">{quantity}</span>
              <button onClick={() => setQuantity(Math.min(10, quantity + 1))} className="w-10 h-10 rounded-xl border flex items-center justify-center hover:bg-gray-50">
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleAddToCart}
              className="flex-1 flex items-center justify-center gap-2 btn-walmart py-3.5 text-base"
              id="add-to-cart"
            >
              <ShoppingCart size={20} /> Add to Cart
            </button>
            <Link
              to="/checkout"
              onClick={handleAddToCart}
              className="flex-1 flex items-center justify-center gap-2 bg-walmart-yellow text-gray-900 py-3.5 rounded-full font-semibold hover:brightness-110 transition-all text-base"
              id="buy-now"
            >
              Buy Now
            </Link>
            <button onClick={() => { navigator.clipboard?.writeText(window.location.href); toast.success('Link copied!'); }} className="w-12 h-12 rounded-full border flex items-center justify-center hover:bg-gray-50 shrink-0">
              <Share2 size={18} />
            </button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t text-center">
            <div className="p-3 rounded-xl bg-blue-50">
              <Truck size={20} className="text-walmart-blue mx-auto mb-1" />
              <p className="text-[10px] font-bold">Free Delivery</p>
            </div>
            <div className="p-3 rounded-xl bg-green-50">
              <RotateCcw size={20} className="text-green-600 mx-auto mb-1" />
              <p className="text-[10px] font-bold">7 Day Return</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-50">
              <Shield size={20} className="text-purple-600 mx-auto mb-1" />
              <p className="text-[10px] font-bold">Secure Pay</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-16 pt-10 border-t">
         <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-slate-800">Customer Reviews</h2>
            <button 
              onClick={() => {
                if(!isAuthenticated) return toast.error('Please login first');
                setShowReviewForm(!showReviewForm);
              }} 
              className="text-walmart-blue font-semibold hover:underline"
            >
              Write a Review
            </button>
         </div>

         {showReviewForm && (
            <div className="bg-slate-50 p-6 rounded-2xl mb-8 border border-slate-200 animate-fade-in">
              <h3 className="font-bold text-lg mb-4">Submit your review</h3>
              <div className="flex items-center gap-2 mb-4">
                 {[1,2,3,4,5].map(star => (
                   <button key={star} onClick={() => setFormRating(star)} className={`transition-colors ${formRating >= star ? 'text-yellow-500' : 'text-slate-300'}`}>
                     <Star size={24} fill="currentColor" />
                   </button>
                 ))}
              </div>
              <input type="text" placeholder="Summary (e.g. Great product!)" value={formTitle} onChange={e => setFormTitle(e.target.value)} className="w-full px-4 py-3 rounded-xl border focus:border-walmart-blue outline-none mb-3 bg-white" />
              <textarea placeholder="Describe your experience..." rows={4} value={formComment} onChange={e => setFormComment(e.target.value)} className="w-full px-4 py-3 rounded-xl border focus:border-walmart-blue outline-none mb-4 bg-white py-3 resize-none"></textarea>
              <button disabled={isSubmittingReview} onClick={submitReview} className="btn-walmart disabled:opacity-50">
                 {isSubmittingReview ? 'Submitting...' : 'Post Review'}
              </button>
            </div>
         )}

         {loadingReviews ? (
           <div className="flex justify-center p-8"><span className="loading loading-spinner text-walmart-blue"></span></div>
         ) : reviews.length === 0 ? (
           <p className="text-slate-500 text-center py-8 bg-slate-50 rounded-3xl border border-dashed">No reviews yet. Be the first to review this product!</p>
         ) : (
           <div className="space-y-6">
             {reviews.map(review => (
               <div key={review._id} className="border-b pb-6">
                 <div className="flex items-center gap-3 mb-2">
                   <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                     {review.userId?.firstName?.[0]}{review.userId?.lastName?.[0]}
                   </div>
                   <div>
                     <p className="font-bold text-sm text-slate-800">{review.userId?.firstName} {review.userId?.lastName}</p>
                     <div className="flex items-center gap-1 text-yellow-500 mt-0.5">
                       {[...Array(5)].map((_, i) => (
                         <Star key={i} size={12} fill={i < review.rating ? "currentColor" : "none"} className={i >= review.rating ? "text-slate-300" : ""} />
                       ))}
                     </div>
                   </div>
                   <span className="ml-auto text-xs text-slate-400">
                     {new Date(review.createdAt).toLocaleDateString()}
                   </span>
                 </div>
                 <h4 className="font-semibold text-slate-800 mb-1">{review.title}</h4>
                 <p className="text-sm text-slate-600 leading-relaxed">{review.comment}</p>
                 {review.isVerifiedPurchase && (
                   <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-green-600 bg-green-50 px-2 py-0.5 rounded-full mt-3 border border-green-200">
                     <Shield size={10} /> Verified Purchase
                   </span>
                 )}
               </div>
             ))}
           </div>
         )}
      </div>

      {/* Q&A Section */}
      <div className="mt-16 pt-10 border-t pb-20">
         <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-slate-800">Questions & Answers</h2>
            <button 
              onClick={() => {
                if(!isAuthenticated) return toast.error('Please login first');
                setShowQAForm(!showQAForm);
              }} 
              className="px-6 py-2 bg-slate-900 text-white rounded-full font-bold text-sm hover:bg-slate-800 transition-all"
            >
              Ask a Question
            </button>
         </div>

         {showQAForm && (
            <div className="bg-blue-50 p-6 rounded-2xl mb-8 border border-blue-100 animate-fade-in text-left">
              <h3 className="font-bold text-lg mb-4">What's on your mind?</h3>
              <textarea 
                placeholder="Ask your question here... (minimum 10 characters)" 
                rows={3} 
                value={formQuestion} 
                onChange={e => setFormQuestion(e.target.value)} 
                className="w-full px-4 py-3 rounded-xl border border-blue-200 focus:border-walmart-blue outline-none mb-4 resize-none"
              ></textarea>
              <div className="flex gap-3">
                <button 
                  disabled={isSubmittingQA || formQuestion.length < 10} 
                  onClick={submitQuestion} 
                  className="btn-walmart disabled:opacity-50"
                >
                  {isSubmittingQA ? 'Posting...' : 'Post Question'}
                </button>
                <button onClick={() => setShowQAForm(false)} className="px-6 py-2 font-bold text-slate-500">Cancel</button>
              </div>
            </div>
         )}

         {loadingQA ? (
           <div className="flex justify-center p-8"><span className="loading loading-spinner text-walmart-blue"></span></div>
         ) : questions.length === 0 ? (
           <div className="text-center py-10 bg-slate-50 rounded-3xl border border-dashed">
              <p className="text-slate-500 italic">Have a question? Be the first to ask!</p>
           </div>
         ) : (
           <div className="space-y-8">
             {questions.map(q => (
               <div key={q._id} className="group">
                 <div className="flex gap-4">
                   <div className="flex-1">
                     <p className="font-black text-slate-800 flex items-center gap-2">
                       <span className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">Q</span>
                       {q.question}
                     </p>
                     <p className="text-[10px] text-slate-400 mt-1 ml-8">
                       Asked by {q.userId?.firstName} • {new Date(q.createdAt).toLocaleDateString()}
                     </p>
                     
                     {q.answer?.text ? (
                       <div className="mt-4 ml-8 p-4 bg-slate-50 rounded-2xl border-l-4 border-walmart-blue">
                         <p className="text-sm text-slate-700 font-medium leading-relaxed">
                           <span className="text-walmart-blue font-black mr-2">A:</span>
                           {q.answer.text}
                         </p>
                         <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-tight">
                           Answered by {q.answer.answeredBy?.role === 'admin' ? 'WalMart Official' : 'Verified Seller'} • {new Date(q.answer.answeredAt).toLocaleDateString()}
                         </p>
                       </div>
                     ) : (
                       <p className="text-xs text-slate-400 mt-4 ml-8 italic">Waiting for an answer...</p>
                     )}
                   </div>
                 </div>
               </div>
             ))}
           </div>
         )}
      </div>
    </div>
  );
};

export default ProductDetailPage;
