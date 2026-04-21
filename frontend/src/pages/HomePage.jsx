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
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "EVERYTHING YOU NEED.",
      subtitle: "High-quality essentials at prices you won't find anywhere else.",
      image: import.meta.env.VITE_HERO_SLIDE_1 || "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2000&auto=format&fit=crop",
      badge: "Spring Collection",
      color: "bg-[#0071dc]",
      accent: "text-walmart-yellow",
      btnText: "Shop All Products",
      link: "/products"
    },
    {
      title: "TECH THAT WOWS.",
      subtitle: "Upgrade your lifestyle with the latest gadgets and electronics.",
      image: import.meta.env.VITE_HERO_SLIDE_2 || "https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=2000&auto=format&fit=crop",
      badge: "Tech Savings",
      color: "bg-slate-900",
      accent: "text-blue-400",
      btnText: "View Electronics",
      link: "/products?category=electronics"
    },
    {
      title: "STYLE FOR EVERYONE.",
      subtitle: "Discover trending styles and wardrobe essentials for all seasons.",
      image: import.meta.env.VITE_HERO_SLIDE_3 || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2000&auto=format&fit=crop",
      badge: "Fashion Week",
      color: "bg-purple-900",
      accent: "text-pink-400",
      btnText: "Shop Fashion",
      link: "/products?category=fashion"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catsRes, featuredRes, allRes] = await Promise.all([
          api.get('/categories'),
          api.get('/products/featured?limit=8'),
          api.get('/products?limit=12')
        ]);
        setCategories(catsRes.data?.data || []);
        setFeaturedProducts(featuredRes.data?.data || []);
        setAllProducts(allRes.data?.data || []);
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
      <section className="relative h-[500px] md:h-[600px] overflow-hidden">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out transform ${
              index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
            }`}
          >
            {/* Background Image with Overlay */}
            <div className="absolute inset-0">
               <img src={slide.image} className="w-full h-full object-cover" alt={slide.title} />
               <div className={`absolute inset-0 ${slide.color} opacity-60 mix-blend-multiply`}></div>
               <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
                  {/* Content Container */}
            <div className="max-w-7xl mx-auto px-4 h-full flex items-center relative z-10 pt-10 sm:pt-0">
              <div className="max-w-2xl space-y-4 sm:space-y-8 text-center sm:text-left mx-auto sm:ml-0">
                 <div className={`inline-block px-4 py-1 rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest bg-white/20 backdrop-blur-md text-white border border-white/20 animate-slide-up`}>
                    {slide.badge}
                 </div>
                 <div className="space-y-2 sm:space-y-4">
                    <h1 className="text-4xl sm:text-6xl md:text-8xl font-black leading-tight sm:leading-[0.85] tracking-tighter text-white animate-slide-up" style={{ animationDelay: '100ms' }}>
                      {slide.title.split(' ').map((word, i) => (
                        <span key={i} className={i === slide.title.split(' ').length - 1 ? slide.accent : ''}>
                          {word}{' '}
                        </span>
                      ))}
                    </h1>
                    <p className="text-sm sm:text-lg md:text-xl text-white/80 font-medium max-w-sm mx-auto sm:ml-0 animate-slide-up" style={{ animationDelay: '200ms' }}>
                      {slide.subtitle}
                    </p>
                 </div>
                 <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 animate-slide-up justify-center sm:justify-start" style={{ animationDelay: '300ms' }}>
                    <Link 
                      to={slide.link} 
                      className="bg-walmart-yellow text-slate-900 px-8 sm:px-10 py-3 sm:py-4 rounded-full font-black text-xs sm:text-sm uppercase tracking-widest hover:brightness-110 transition-all shadow-xl shadow-black/20 transform hover:-translate-y-1"
                    >
                       {slide.btnText}
                    </Link>
                    <Link 
                      to="/products" 
                      className="bg-white/20 backdrop-blur-md text-white px-8 sm:px-10 py-3 sm:py-4 rounded-full font-black text-xs sm:text-sm uppercase tracking-widest hover:bg-white/30 transition-all"
                    >
                       Explore Deals
                    </Link>
                 </div>
              </div>
            </div>
       </div>
          </div>
        ))}

        {/* Slide Indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === currentSlide ? 'w-12 bg-walmart-yellow' : 'w-4 bg-white/30 hover:bg-white/50'
              }`}
            />
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
          <form className="flex max-w-xl mx-auto gap-2 bg-white p-1.5 rounded-full shadow-2xl" onSubmit={handleSubscribe}>
            <input 
              type="email" 
              placeholder="Enter your email to get started" 
              required
              value={subscriberEmail}
              onChange={(e) => setSubscriberEmail(e.target.value)}
              className="flex-1 px-8 py-3 rounded-full bg-transparent text-slate-900 outline-none font-bold" 
            />
            <button type="submit" disabled={isSubscribing} className="bg-slate-900 text-white px-10 py-3 rounded-full font-black text-xs uppercase tracking-widest hover:bg-walmart-blue hover:-translate-x-1 transition-all disabled:opacity-50">
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
