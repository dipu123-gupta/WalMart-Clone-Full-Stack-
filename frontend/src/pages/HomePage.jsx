import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { ShoppingBag, Truck, Shield, Headphones, Star, ArrowRight, Zap, Tag, MailCheck, CheckCircle2 } from 'lucide-react';
import api from '@/services/api';
import { formatCurrency, calcDiscount } from '@/utils/helpers';
import toast from 'react-hot-toast';
import { FREE_SHIPPING_THRESHOLD, SITE_NAME, PLACEHOLDER_IMAGE } from '@/constants';

const HomePage = () => {
  const features = [
    { icon: <Truck className="text-walmart-blue" size={28} />, title: 'Free Shipping', desc: `On orders above ₹${FREE_SHIPPING_THRESHOLD}` },
    { icon: <Shield className="text-green-500" size={28} />, title: 'Secure Payments', desc: '100% secure checkout' },
    { icon: <Headphones className="text-purple-500" size={28} />, title: '24/7 Support', desc: 'Dedicated help center' },
    { icon: <Star className="text-yellow-500" size={28} />, title: 'Quality Assured', desc: 'Verified sellers only' },
  ];

  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [subscriberEmail, setSubscriberEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);

  const [allProducts, setAllProducts] = useState([]);
  const [activeCoupons, setActiveCoupons] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "EVERYTHING YOU NEED. DELIVERED.",
      subtitle: "High-quality essentials at prices you won't find anywhere else. Shop our spring collection now.",
      image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2000&auto=format&fit=crop",
      badge: "Marketplace Special",
      color: "bg-[#0071dc]",
      accent: "text-walmart-yellow",
      btnText: "Shop Storefront",
      link: "/products"
    },
    {
      title: "NEXT-GEN TECH. TODAY.",
      subtitle: "Upgrade your lifestyle with the latest gadgets. From noise-cancelling headphones to 4K displays.",
      image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=2000&auto=format&fit=crop",
      badge: "Tech Insider",
      color: "bg-slate-900",
      accent: "text-blue-400",
      btnText: "Explore Tech",
      link: "/products?category=electronics"
    },
    {
      title: "ELEVATE YOUR STYLE.",
      subtitle: "Discover trending styles and curated wardrobe essentials for every occasion and season.",
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2000&auto=format&fit=crop",
      badge: "Fashion Forward",
      color: "bg-indigo-950",
      accent: "text-pink-400",
      btnText: "Shop Wardrobe",
      link: "/products?category=fashion"
    }
  ];

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  useEffect(() => {
    const timer = setInterval(nextSlide, 7000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catsRes, featuredRes, allRes, couponRes] = await Promise.all([
          api.get('/categories'),
          api.get('/products/featured?limit=8'),
          api.get('/products?limit=12'),
          api.get('/public/coupons/active')
        ]);
        setCategories(catsRes.data?.data || []);
        setFeaturedProducts(featuredRes.data?.data || []);
        setAllProducts(allRes.data?.data || []);
        setActiveCoupons(couponRes.data?.data || []);
      } catch (err) {
        console.error('Failed to fetch home data:', err);
      } finally {
        setIsLoading(false);
        setIsProductsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!subscriberEmail) return;
    setIsSubscribing(true);
    try {
      const res = await api.post('/public/subscribe', { email: subscriberEmail });
      toast.success(res.data?.message || 'Subscribed successfully!');
      setSubscriberEmail('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Subscription failed');
    } finally {
      setIsSubscribing(false);
    }
  };

  const ProductCard = ({ product }) => (
    <Link
      to={`/products/${product.slug}`}
      className="group bg-white rounded-3xl border border-slate-100 p-4 hover:shadow-2xl hover:shadow-slate-200 hover:border-walmart-blue transition-all duration-300 flex flex-col h-full"
    >
      <div className="aspect-square rounded-2xl overflow-hidden bg-slate-50 mb-4 relative">
        <img 
          src={product.images?.[0]?.url || PLACEHOLDER_IMAGE} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
        />
        {product.salePrice && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-lg uppercase shadow-lg">
            Save {Math.round(((product.basePrice - product.salePrice) / product.basePrice) * 100)}%
          </span>
        )}
      </div>
      <h3 className="font-bold text-slate-800 text-sm line-clamp-2 mb-2 flex-grow">{product.name}</h3>
      <div className="mt-auto">
        <div className="flex items-end justify-between">
           <div>
              <p className="text-lg font-black text-slate-900 leading-none">
                 {formatCurrency(product.salePrice || product.basePrice)}
              </p>
              {product.salePrice && (
                 <p className="text-xs text-slate-400 line-through mt-1">
                    {formatCurrency(product.basePrice)}
                 </p>
              )}
           </div>
           <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center group-hover:bg-walmart-blue transition-colors">
              <ArrowRight size={16} />
           </div>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="animate-fade-in bg-slate-50 min-h-screen pb-20">
      {/* Announcement Bar */}
      <div className="bg-walmart-blue text-white text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] py-2 text-center overflow-hidden">
        <div className="flex justify-center gap-6 sm:gap-12 whitespace-nowrap animate-marquee">
          <span>⚡ Flash Sale Live: Up to 70% Off</span>
          <span>🚚 Free Shipping on orders over ₹{FREE_SHIPPING_THRESHOLD}</span>
          <span>💎 Premium Quality Guaranteed</span>
          <span className="hidden lg:inline">⚡ Flash Sale Live: Up to 70% Off</span>
        </div>
      </div>

      {/* Hero Slider - Pro Style */}
      <section className="relative h-[480px] sm:h-[600px] md:h-[700px] overflow-hidden group">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out transform ${
              index === currentSlide ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-110 invisible'
            }`}
          >
            {/* Background Image with Parallax Effect */}
            <div className="absolute inset-0 overflow-hidden">
               <img 
                 src={slide.image} 
                 className={`w-full h-full object-cover transition-transform duration-[7000ms] ease-out ${index === currentSlide ? 'scale-110' : 'scale-100'}`} 
                 alt={slide.title} 
               />
               <div className={`absolute inset-0 ${slide.color} opacity-40 mix-blend-multiply`}></div>
               <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/30 to-transparent"></div>
            </div>

            {/* Content Container */}
            <div className="max-w-7xl mx-auto px-6 md:px-12 h-full flex items-center relative z-10">
              <div className="max-w-3xl space-y-6 sm:space-y-10 text-left">
                 <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-bold text-[10px] uppercase tracking-[0.2em] bg-white/10 backdrop-blur-xl text-white border border-white/20 shadow-2xl animate-slide-up`}>
                    <span className="w-1.5 h-1.5 bg-walmart-yellow rounded-full animate-pulse"></span>
                    {slide.badge}
                 </div>
                 <div className="space-y-4 sm:space-y-6">
                    <h1 className="text-4xl sm:text-7xl md:text-[5.5rem] font-black leading-[0.9] tracking-tighter text-white animate-slide-up" style={{ animationDelay: '150ms' }}>
                      {slide.title.split(' ').map((word, i) => (
                        <span key={i} className={`inline-block ${i >= slide.title.split(' ').length - 2 ? slide.accent : ''}`}>
                          {word}&nbsp;
                        </span>
                      ))}
                    </h1>
                    <p className="text-sm sm:text-xl text-white/70 font-medium max-w-lg leading-relaxed animate-slide-up" style={{ animationDelay: '300ms' }}>
                      {slide.subtitle}
                    </p>
                 </div>
                 <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2 animate-slide-up" style={{ animationDelay: '450ms' }}>
                    <Link 
                      to={slide.link} 
                      className="group relative overflow-hidden bg-walmart-yellow text-slate-900 px-8 md:px-12 py-4 md:py-5 rounded-full font-black text-xs md:text-sm uppercase tracking-widest transition-all shadow-2xl shadow-walmart-yellow/20 hover:scale-105 active:scale-95"
                    >
                       <span className="relative z-10">{slide.btnText}</span>
                       <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                    </Link>
                    <Link 
                      to="/products" 
                      className="group flex items-center gap-3 bg-white/5 backdrop-blur-md text-white border border-white/30 px-8 md:px-12 py-4 md:py-5 rounded-full font-black text-xs md:text-sm uppercase tracking-widest hover:bg-white hover:text-slate-900 transition-all shadow-xl"
                    >
                       Explore Deals
                       <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                 </div>
              </div>
            </div>
          </div>
        ))}

        {/* Navigation Controls */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-20 px-4 md:px-12 flex justify-between pointer-events-none">
           <button 
             onClick={prevSlide}
             className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-black/20 hover:bg-black/50 backdrop-blur-md text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 pointer-events-auto border border-white/10 -translate-x-4 group-hover:translate-x-0"
           >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
           </button>
           <button 
             onClick={nextSlide}
             className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-black/20 hover:bg-black/50 backdrop-blur-md text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 pointer-events-auto border border-white/10 translate-x-4 group-hover:translate-x-0"
           >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
           </button>
        </div>

        {/* Improved Slide Indicators */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 bg-black/20 backdrop-blur-xl px-6 py-3 rounded-full border border-white/10">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className="group relative h-1"
            >
              <div className={`h-1.5 rounded-full transition-all duration-700 ease-out overflow-hidden bg-white/20 ${i === currentSlide ? 'w-16' : 'w-4 hover:w-8'}`}>
                 <div className={`h-full bg-walmart-yellow transition-all duration-[7000ms] linear ${i === currentSlide ? 'w-full' : 'w-0'}`}></div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Walmart Value Strip */}
      <section className="bg-white border-b py-4 shadow-sm hidden md:block">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center text-xs font-bold text-slate-600">
           <div className="flex items-center gap-8">
              <div className="flex items-center gap-2 group cursor-pointer">
                 <Truck className="text-walmart-blue group-hover:scale-110 transition-transform" size={20} />
                 <span>Free shipping on all orders over ₹{FREE_SHIPPING_THRESHOLD}</span>
              </div>
              <div className="w-px h-4 bg-slate-200"></div>
              <div className="flex items-center gap-2 group cursor-pointer">
                 <ShoppingBag className="text-walmart-blue group-hover:scale-110 transition-transform" size={20} />
                 <span>Free store pickup</span>
              </div>
           </div>
           <div className="flex items-center gap-4">
              <span className="text-slate-400 font-medium">WalMart+ Member?</span>
              <button className="bg-walmart-blue/10 text-walmart-blue px-4 py-1.5 rounded-full hover:bg-walmart-blue hover:text-white transition-all">Join Now</button>
           </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 py-10 space-y-16">
        
        {/* Pro Category Bubbles - Walmart Style */}
        <section>
           <h2 className="text-xl font-bold text-slate-800 mb-8 px-2">Top Categories</h2>
           <div className="flex overflow-x-auto pb-4 gap-6 scrollbar-hide no-scrollbar">
              {isLoading ? (
                [...Array(8)].map((_, i) => (
                  <div key={i} className="shrink-0 text-center space-y-3">
                    <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-full shimmer border shadow-sm"></div>
                    <div className="h-3 w-16 bg-slate-100 mx-auto rounded shimmer"></div>
                  </div>
                ))
              ) : (
                categories.map((cat) => (
                  <Link 
                    key={cat._id} 
                    to={`/products?category=${cat.slug}`} 
                    className="shrink-0 group text-center space-y-4"
                  >
                    <div className={`w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center p-6 transition-all duration-300 bg-white border border-slate-100 shadow-sm group-hover:shadow-xl group-hover:border-walmart-blue group-hover:-translate-y-2`}>
                       <span className="text-3xl md:text-5xl transform group-hover:scale-125 transition-transform">{cat.icon || '📦'}</span>
                    </div>
                    <span className="block text-sm font-bold text-slate-700 group-hover:text-walmart-blue whitespace-nowrap">{cat.name}</span>
                  </Link>
                ))
              )}
           </div>
        </section>

        {/* Feature Service Grids - Walmart Style */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
              <div className="relative z-10">
                 <h3 className="text-2xl font-black text-slate-900 tracking-tight">Order Grocery</h3>
                 <p className="text-slate-500 mt-2 text-sm font-medium">Fresh food delivered to your door.</p>
                 <Link to="/products?category=grocery" className="inline-flex items-center gap-2 mt-6 font-bold text-walmart-blue border-b-2 border-walmart-blue/0 hover:border-walmart-blue transition-all">
                    Shop Fresh <ArrowRight size={16} />
                 </Link>
              </div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-green-50 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
           </div>
           
           <div className="bg-[#e6f1fc] rounded-3xl p-8 border border-blue-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
              <div className="relative z-10">
                 <h3 className="text-2xl font-black text-slate-900 tracking-tight">Pharmacy Services</h3>
                 <p className="text-slate-500 mt-2 text-sm font-medium">Health essentials and prescriptions.</p>
                 <Link to="/products?category=health" className="inline-flex items-center gap-2 mt-6 font-bold text-walmart-blue border-b-2 border-walmart-blue/0 hover:border-walmart-blue transition-all">
                    Explore Health <ArrowRight size={16} />
                 </Link>
              </div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/50 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
           </div>

           <div className="bg-[#ffc220] rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
              <div className="relative z-10">
                 <h3 className="text-2xl font-black text-slate-900 tracking-tight">Flash Savings</h3>
                 <p className="text-slate-900/60 mt-2 text-sm font-medium">New deals added every day.</p>
                 <Link to="/products" className="inline-flex items-center gap-2 mt-6 font-bold text-slate-900 border-b-2 border-black/20 hover:border-black transition-all">
                    View Deals <ArrowRight size={16} />
                 </Link>
              </div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/20 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
           </div>
        </section>

        {/* Global Offers & Coupons Section */}
        {activeCoupons.length > 0 && (
          <section className="bg-slate-900 rounded-[2.5rem] p-8 md:p-10 text-white overflow-hidden relative group">
             <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-1000"></div>
             <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                   <div>
                      <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                        <Tag className="text-walmart-yellow" size={24} /> Exclusive Offers
                      </h2>
                      <p className="text-slate-400 text-sm mt-1 font-medium">Limited time deals just for you.</p>
                   </div>
                </div>
                
                <div className="flex overflow-x-auto gap-6 pb-2 no-scrollbar">
                   {activeCoupons.map((coupon) => (
                      <div 
                        key={coupon._id} 
                        className="shrink-0 w-72 bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-3xl flex flex-col justify-between hover:bg-white/20 transition-all cursor-pointer group/card"
                        onClick={() => {
                          navigator.clipboard.writeText(coupon.code);
                          toast.success(`Code ${coupon.code} copied!`);
                        }}
                      >
                         <div>
                            <div className="flex items-center justify-between mb-4">
                               <div className="bg-walmart-yellow/20 text-walmart-yellow px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                  {coupon.discountValue}{coupon.discountType === 'percentage' ? '%' : ' OFF'}
                               </div>
                               <button className="text-white/40 hover:text-white transition-colors">
                                  <ArrowRight size={18} />
                               </button>
                            </div>
                            <h3 className="text-lg font-black leading-tight mb-2 uppercase tracking-tighter">{coupon.code}</h3>
                            <p className="text-xs text-white/60 font-medium line-clamp-2 leading-relaxed">
                               {coupon.description || `Get ${coupon.discountValue}${coupon.discountType === 'percentage' ? '%' : ' currency'} discount on your orders.`}
                            </p>
                         </div>
                         <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-4">
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                               Min: {formatCurrency(coupon.minOrderAmount)}
                            </span>
                            <span className="text-[10px] font-bold text-walmart-yellow uppercase tracking-widest group-hover/card:underline">
                               Copy Code
                            </span>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </section>
        )}

        {/* Featured Savings Section */}
        <section className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <Zap className="text-walmart-yellow fill-walmart-yellow" size={24} /> Featured Savings
              </h2>
              <p className="text-slate-500 text-sm mt-1 font-medium">Score big on these top-rated items.</p>
            </div>
            <Link to="/products" className="text-walmart-blue font-bold text-sm hover:underline flex items-center gap-1">
              See All <ArrowRight size={14} />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-6">
            {isProductsLoading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="space-y-4">
                   <div className="aspect-square bg-slate-50 rounded-2xl shimmer"></div>
                   <div className="h-4 w-3/4 bg-slate-50 rounded shimmer"></div>
                   <div className="h-6 w-1/2 bg-slate-50 rounded shimmer"></div>
                </div>
              ))
            ) : featuredProducts.length === 0 ? (
              <div className="col-span-full py-10 text-center italic font-bold text-slate-300">
                Refreshing deals...
              </div>
            ) : (
              featuredProducts.map((product) => (
                <Link
                  key={product._id}
                  to={`/products/${product.slug}`}
                  className="bg-white group flex flex-col h-full"
                >
                  <div className="aspect-square rounded-2xl overflow-hidden bg-slate-50 mb-4 border border-slate-100 relative shadow-sm group-hover:shadow-lg transition-all duration-300">
                    <img 
                      src={product.images?.[0]?.url || PLACEHOLDER_IMAGE} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      alt={product.name} 
                    />
                    {product.salePrice && (
                       <div className="absolute top-3 left-3 bg-red-600 text-white text-[9px] font-black px-2 py-1 rounded-md uppercase">
                          Save {calcDiscount(product.basePrice, product.salePrice)}%
                       </div>
                    )}
                  </div>
                  <div className="flex-grow">
                    <p className="text-xl font-bold text-slate-900">
                       {formatCurrency(product.salePrice || product.basePrice)}
                    </p>
                    {product.salePrice && (
                       <p className="text-xs text-slate-400 line-through">
                          {formatCurrency(product.basePrice)}
                       </p>
                    )}
                    <h3 className="text-sm font-medium text-slate-700 mt-2 line-clamp-2 leading-snug group-hover:text-walmart-blue transition-colors">
                       {product.name}
                    </h3>
                  </div>
                  <div className="mt-4">
                     <button className="w-full py-2 border-2 border-walmart-blue text-walmart-blue font-bold text-xs rounded-full hover:bg-walmart-blue hover:text-white transition-all">
                        Options
                     </button>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* Brand Banner Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden relative group h-[300px] sm:h-[400px]">
              <img src={import.meta.env.VITE_BRAND_BANNER_1 || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2000&auto=format&fit=crop"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Nike" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 sm:p-10 text-white">
                 <h2 className="text-2xl sm:text-4xl font-black tracking-tight mb-2">RUN YOUR WAY.</h2>
                 <p className="text-slate-200 mb-4 sm:mb-6 font-medium text-xs sm:text-base">New arrivals from Nike are here.</p>
                 <Link to="/products?brand=nike" className="bg-white text-slate-900 w-fit px-6 sm:px-8 py-2.5 sm:py-3 rounded-full font-bold text-xs sm:text-sm tracking-wide hover:bg-slate-100 transition-all">Shop Nike</Link>
              </div>
           </div>
           
           <div className="rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden relative group h-[300px] sm:h-[400px]">
              <img src={import.meta.env.VITE_BRAND_BANNER_2 || "https://images.unsplash.com/photo-1511385348-a52b4a160dc2?q=80&w=2000&auto=format&fit=crop"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Apple" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 sm:p-10 text-white">
                 <h2 className="text-2xl sm:text-4xl font-black tracking-tight mb-2">M3 CHIP IS HERE.</h2>
                 <p className="text-slate-200 mb-4 sm:mb-6 font-medium text-xs sm:text-base">Experience the future of MacBook.</p>
                 <Link to="/products?category=electronics" className="bg-white text-slate-900 w-fit px-6 sm:px-8 py-2.5 sm:py-3 rounded-full font-bold text-xs sm:text-sm tracking-wide hover:bg-slate-100 transition-all">Learn More</Link>
              </div>
           </div>
        </section>

        {/* Trending Now Horizontal Section */}
        <section>
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Trending Now</h2>
            <Link to="/products" className="text-walmart-blue font-bold text-sm hover:underline">Explore More</Link>
          </div>
          <div className="flex overflow-x-auto pb-4 gap-6 no-scrollbar">
             {allProducts.slice(0, 8).map((product) => (
                <Link key={product._id} to={`/products/${product.slug}`} className="shrink-0 w-48 bg-white border border-slate-100 p-4 rounded-3xl hover:shadow-xl transition-all">
                   <div className="aspect-square bg-slate-50 rounded-2xl overflow-hidden mb-3">
                      <img src={product.images?.[0]?.url || PLACEHOLDER_IMAGE} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt={product.name} />
                   </div>
                   <p className="text-lg font-bold text-slate-900 leading-none">{formatCurrency(product.salePrice || product.basePrice)}</p>
                   <h3 className="text-xs font-medium text-slate-600 mt-2 line-clamp-2 leading-relaxed">{product.name}</h3>
                </Link>
             ))}
          </div>
        </section>

        {/* Recently Viewed Section */}
        <RecentlyViewedSection />
      </main>

      {/* Trust Badges Bar */}
      <section className="bg-slate-100 py-12">
         <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
               <div className="space-y-3">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
                     <Shield className="text-walmart-blue" size={32} />
                  </div>
                  <h4 className="font-bold text-slate-800">Secure Shopping</h4>
                  <p className="text-xs text-slate-500 font-medium">Your data is always protected.</p>
               </div>
               <div className="space-y-3">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
                     <CheckCircle2 className="text-green-500" size={32} />
                  </div>
                  <h4 className="font-bold text-slate-800">Verified Sellers</h4>
                  <p className="text-xs text-slate-500 font-medium">Trusted products only.</p>
               </div>
               <div className="space-y-3">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
                     <Headphones className="text-purple-500" size={32} />
                  </div>
                  <h4 className="font-bold text-slate-800">24/7 Support</h4>
                  <p className="text-xs text-slate-500 font-medium">We're here whenever you need.</p>
               </div>
               <div className="space-y-3">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
                     <Star className="text-yellow-500" size={32} />
                  </div>
                  <h4 className="font-bold text-slate-800">Satisfaction</h4>
                  <p className="text-xs text-slate-500 font-medium">Join 1M+ happy customers.</p>
               </div>
            </div>
         </div>
      </section>

      {/* Final Newsletter Section */}
      <section className="bg-[#0071dc] py-20 text-white">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-8">
          <div className="inline-flex items-center gap-3 bg-white/20 px-6 py-2 rounded-full backdrop-blur-md">
             <Star className="text-walmart-yellow fill-walmart-yellow" size={16} />
             <span className="text-xs font-black uppercase tracking-widest">Join WalMart Plus</span>
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-none">MEMBERS GET MORE.</h2>
            <p className="text-blue-100 font-medium max-w-lg mx-auto">Get free delivery, secret deals, and faster checkout by joining our newsletter community.</p>
          </div>
          <form className="flex flex-col sm:flex-row w-full max-w-xl mx-auto gap-4 sm:gap-2 sm:bg-white sm:p-1.5 sm:rounded-full sm:shadow-2xl" onSubmit={handleSubscribe}>
            <input 
              type="email" 
              placeholder="Enter email to get started" 
              required
              value={subscriberEmail}
              onChange={(e) => setSubscriberEmail(e.target.value)}
              className="flex-1 px-6 sm:px-8 py-4 sm:py-3 rounded-full bg-white sm:bg-transparent text-slate-900 outline-none font-bold shadow-xl sm:shadow-none min-w-0" 
            />
            <button type="submit" disabled={isSubscribing} className="bg-slate-900 text-white px-8 sm:px-10 py-4 sm:py-3 rounded-full font-black text-xs uppercase tracking-widest hover:bg-walmart-blue transition-all disabled:opacity-50 shadow-xl sm:shadow-none shrink-0 whitespace-nowrap">
              {isSubscribing ? '...' : 'Unlock Now'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

// Sub-component for Recently Viewed
const RecentlyViewedSection = () => {
  const [recentProducts, setRecentProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchRecent = async () => {
      setLoading(true);
      try {
        if (isAuthenticated) {
           // Fetch cross-device history from backend
           const { data } = await api.get('/products/recently-viewed?limit=6');
           setRecentProducts(data.data || []);
        } else {
           // Guest logic: local storage
           const ids = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
           if (ids.length === 0) return;
           
           const products = [];
           for (const id of ids.slice(0, 6)) {
             try {
               const { data } = await api.get(`/products/${id}`);
               if (data?.data) products.push(data.data);
             } catch (e) { /* ignore */ }
           }
           setRecentProducts(products);
        }
      } catch (err) {
        console.error("Failed to load recent products");
      } finally {
        setLoading(false);
      }
    };
    fetchRecent();
  }, [isAuthenticated]);

  if (!loading && recentProducts.length === 0) return null;

  return (
    <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm animate-fade-in mt-16">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-bold text-slate-800">Recently Viewed</h2>
        <button onClick={() => { localStorage.removeItem('recentlyViewed'); setRecentProducts([]); }} className="text-xs text-slate-400 hover:text-red-500 font-bold uppercase tracking-widest">Clear All</button>
      </div>
      <div className="flex overflow-x-auto gap-6 pb-2 no-scrollbar">
        {loading ? (
          [...Array(4)].map((_, i) => <div key={i} className="w-40 h-56 bg-slate-50 rounded-2xl shimmer"></div>)
        ) : (
          recentProducts.map(p => (
            <Link key={p._id} to={`/products/${p.slug}`} className="shrink-0 w-40 group">
              <div className="aspect-square bg-slate-50 rounded-2xl overflow-hidden mb-3 border border-slate-100">
                 <img src={p.images?.[0]?.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt={p.name} />
              </div>
              <p className="text-sm font-black text-slate-900">₹{(p.salePrice || p.basePrice).toLocaleString()}</p>
              <h3 className="text-[11px] font-medium text-slate-600 mt-1 line-clamp-1">{p.name}</h3>
            </Link>
          ))
        )}
      </div>
    </section>
  );
};

export default HomePage;
