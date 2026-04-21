import { useState, useCallback, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Search, 
  ShoppingCart, 
  Heart, 
  User, 
  Bell, 
  Menu, 
  X, 
  ChevronDown, 
  LogOut, 
  Package, 
  Settings, 
  MapPin,
  History,
  TrendingUp,
  Store,
  GitCompare,
  Truck
} from 'lucide-react';
import { logout } from '@/features/auth/authSlice';
import { setQuery, setSuggestions, clearSearch, addRecentSearch, setSearchOpen } from '@/features/search/searchSlice';
import api from '@/services/api';
import Logo from './Logo';

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { items: cartItems } = useSelector((state) => state.cart);
  const { unreadCount } = useSelector((state) => state.notifications);
  const { query, suggestions, recentSearches, isOpen } = useSelector((state) => state.search);
  const { items: compareItems } = useSelector((state) => state.compare);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Handle scroll for glass effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Search with debounce
  const handleSearch = useCallback((e) => {
    const value = e.target.value;
    dispatch(setQuery(value));

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.length >= 2) {
      debounceRef.current = setTimeout(async () => {
        try {
          const { data } = await api.get('/products/suggestions', { params: { q: value } });
          dispatch(setSuggestions(data.data || []));
        } catch (err) {
          // ignore
        }
      }, 300);
    } else {
      dispatch(setSuggestions([]));
    }
  }, [dispatch]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      dispatch(addRecentSearch(query.trim()));
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      dispatch(clearSearch());
    }
  };

  const handleRecentClick = (q) => {
    dispatch(setQuery(q));
    dispatch(addRecentSearch(q));
    navigate(`/search?q=${encodeURIComponent(q)}`);
    dispatch(clearSearch());
  };

  const TRENDING = ['Electronics', 'Home Decor', 'Laptops', 'Fashion', 'Gaming Consoles'];

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
    setProfileOpen(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        dispatch(setSuggestions([]));
      }
      if (!e.target.closest('.profile-dropdown')) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dispatch]);

  return (
    <header className={`sticky top-0 z-[100] transition-all duration-300 ${scrolled ? 'py-1 shadow-2xl' : 'py-0'}`}>
      {/* Dynamic Background */}
      <div className={`absolute inset-0 transition-opacity duration-300 ${scrolled ? 'glass' : 'bg-white border-b'}`} />

      {/* Top Banner - Sleek & Narrow */}
      {!scrolled && (
        <div className="relative gradient-primary text-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 py-1.5 flex justify-between items-center text-[11px] font-bold uppercase tracking-wider">
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-1.5 opacity-90"><MapPin size={12} className="text-walmart-yellow" /> Delivery to Mumbai 400001</span>
              <span className="w-1 h-1 bg-white/30 rounded-full hidden sm:block"></span>
              <Link to="/products" className="hover:text-walmart-yellow transition-colors hidden sm:block">Flash Sale Live</Link>
            </div>
            <div className="flex items-center gap-6">
              <Link to="/seller/register" className="flex items-center gap-1.5 hover:text-walmart-yellow transition-colors group">
                <Store size={12} className="group-hover:scale-110 transition-transform" /> 
                Become a Seller
              </Link>
              <span className="w-1 h-1 bg-white/30 rounded-full"></span>
              <span className="opacity-90">Help Center</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Bar */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-3 md:py-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8 lg:gap-12">
          {/* Top Row: Logo + Mobile Actions */}
          <div className="flex items-center justify-between w-full md:w-auto shrink-0">
            {/* Brand Logo */}
            <Link to="/" className="shrink-0 group transform hover:scale-105 transition-all duration-300">
               <Logo className="h-7 sm:h-9" />
            </Link>

            {/* Mobile-only Icons (visible only < 768px) */}
            <div className="flex items-center gap-1 md:hidden">
               {/* Cart */}
               <Link to="/cart" className="relative p-2.5 text-gray-700 hover:bg-gray-100 rounded-xl transition-all">
                 <ShoppingCart size={22} />
                 {cartCount > 0 && (
                   <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-walmart-blue border-2 border-white text-white text-[8px] rounded-full flex items-center justify-center font-black">
                     {cartCount > 9 ? '9+' : cartCount}
                   </span>
                 )}
               </Link>
               
               {/* Account/User - if authenticated, show avatar */}
               {isAuthenticated && (
                  <Link to="/profile" className="p-2.5 text-gray-700 hover:bg-gray-100 rounded-xl transition-all">
                     <User size={22} />
                  </Link>
               )}

               {/* Mobile Toggle */}
               <button 
                 onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
                 className="p-2.5 text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
               >
                 {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
               </button>
            </div>
          </div>

          {/* Search Container - Full width on mobile, flexible on desktop */}
          <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative order-last md:order-none" ref={searchRef}>
            <div className="group flex items-center bg-gray-100 rounded-xl sm:rounded-2xl border-2 border-transparent focus-within:border-walmart-blue focus-within:bg-white transition-all duration-300 shadow-sm focus-within:shadow-md">
              <div className="pl-4 text-gray-400 group-focus-within:text-walmart-blue">
                <Search size={18} />
              </div>
              <input
                type="text"
                value={query}
                onChange={handleSearch}
                onFocus={() => dispatch(setSearchOpen(true))}
                placeholder="Search everything at WalMart..."
                className="w-full px-3 py-2.5 sm:py-3 bg-transparent outline-none text-xs sm:text-sm font-medium text-gray-800 placeholder-gray-500"
              />
              <button
                type="submit"
                className="mr-1 mx-1 px-3 sm:px-6 py-1.5 sm:py-2 bg-walmart-yellow text-gray-900 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm hover:brightness-110 transition-all active:scale-95 shadow-sm"
              >
                <span className="hidden sm:inline">Search</span>
                <span className="sm:hidden"><Search size={16}/></span>
              </button>
            </div>

            {/* Advanced Search Dropdown */}
            {isOpen && (
              <div className="absolute top-[calc(100%+10px)] left-0 right-0 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[110] animate-fade-in divide-y w-full">
                {query.length < 2 ? (
                  <>
                    {recentSearches.length > 0 && (
                      <div className="py-2">
                        <div className="px-4 py-2 flex items-center gap-2">
                          <History size={14} className="text-gray-400" />
                          <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Recent Searches</span>
                        </div>
                        {recentSearches.map((q, i) => (
                          <button key={i} onClick={() => handleRecentClick(q)} className="w-full flex items-center px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700 font-medium text-left">
                            {q}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="py-2">
                      <div className="px-4 py-2 flex items-center gap-2">
                        <TrendingUp size={14} className="text-walmart-blue" />
                        <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Trending Now</span>
                      </div>
                      <div className="flex flex-wrap gap-2 p-4 pt-1">
                        {TRENDING.map((t, i) => (
                          <button key={i} onClick={() => handleRecentClick(t)} className="px-3 py-1.5 rounded-full bg-blue-50 text-walmart-blue text-xs font-bold hover:bg-walmart-blue hover:text-white transition-colors">
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  suggestions.map((s) => (
                    <Link
                      key={s._id}
                      to={`/products/${s.slug}`}
                      className="flex items-center gap-4 px-4 py-3 hover:bg-blue-50 transition-colors group"
                      onClick={() => dispatch(clearSearch())}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-xl overflow-hidden shadow-inner group-hover:scale-110 transition-transform">
                         <img src={s.images?.[0]?.url} alt={s.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm font-semibold text-gray-800 group-hover:text-walmart-blue transition-colors line-clamp-1">{s.name}</p>
                        <div className="flex items-center gap-2">
                           <span className="text-xs font-bold text-walmart-blue">₹{(s.salePrice || s.basePrice).toLocaleString()}</span>
                           {s.salePrice && <span className="text-[10px] text-gray-400 line-through">₹{s.basePrice.toLocaleString()}</span>}
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}
          </form>

          {/* Desktop-only Action Icons (hidden < 768px) */}
          <div className="hidden md:flex items-center gap-1 lg:gap-3 shrink-0">
            {/* Wishlist */}
            <Link to="/wishlist" className="p-3 text-gray-700 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all hidden lg:flex group">
              <Heart size={24} className="group-hover:fill-current transition-all" />
            </Link>

            {/* Compare */}
            <Link to="/compare" className="relative p-3 text-gray-700 hover:text-walmart-blue hover:bg-blue-50 rounded-2xl transition-all group">
              <GitCompare size={24} className="group-hover:rotate-12 transition-transform" />
              {compareItems.length > 0 && (
                <span className="absolute top-2.5 right-2.5 w-5 h-5 bg-orange-500 border-2 border-white text-white text-[9px] rounded-full flex items-center justify-center font-black">
                  {compareItems.length}
                </span>
              )}
            </Link>

            {/* Notifications */}
            {isAuthenticated && (
              <Link to="/notifications" className="relative p-3 text-gray-700 hover:text-walmart-blue hover:bg-blue-50 rounded-2xl transition-all group">
                <Bell size={24} className="group-hover:rotate-12 transition-transform" />
                {unreadCount > 0 && (
                  <span className="absolute top-2.5 right-2.5 w-5 h-5 bg-red-600 border-2 border-white text-white text-[9px] rounded-full flex items-center justify-center font-black">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            )}

            {/* Cart with dynamic counter */}
            <Link to="/cart" className="relative p-3 text-gray-700 hover:text-walmart-blue hover:bg-blue-50 rounded-2xl transition-all group">
              <ShoppingCart size={24} className="group-hover:-translate-y-0.5 transition-transform" />
              {cartCount > 0 && (
                <span className="absolute top-2.5 right-2.5 w-5 h-5 bg-walmart-blue border-2 border-white text-white text-[9px] rounded-full flex items-center justify-center font-black">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>

            {/* Separation if authenticated */}
            {isAuthenticated && <div className="w-[1px] h-8 bg-gray-200 mx-2 hidden md:block"></div>}

            {/* Account Entry */}
            {isAuthenticated ? (
              <div className="relative profile-dropdown">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full border border-transparent hover:border-gray-200 hover:bg-white transition-all shadow-sm active:scale-95"
                  id="nav-profile"
                >
                  <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-walmart-blue ring-2 ring-blue-50">
                    {user?.avatar?.url ? (
                      <img src={user.avatar.url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full gradient-primary text-white flex items-center justify-center text-sm font-bold">
                        {user?.firstName?.[0]}
                      </div>
                    )}
                  </div>
                  <div className="hidden md:block text-left mr-1">
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter leading-none">Hi, {user?.firstName}</p>
                     <p className="text-xs font-bold text-gray-800 flex items-center gap-0.5">Account <ChevronDown size={10} /></p>
                  </div>
                </button>

                {/* Account Menu - High End */}
                {profileOpen && (
                  <div className="absolute right-0 top-[calc(100%+12px)] w-64 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 py-3 z-[150] animate-fade-in origin-top-right">
                    <div className="px-6 py-4 mb-2 border-b bg-gray-50/50">
                      <p className="font-black text-gray-900">{user?.firstName} {user?.lastName}</p>
                      <p className="text-[11px] font-medium text-gray-500 truncate">{user?.email}</p>
                    </div>
                    <div className="px-2 space-y-0.5">
                      <MenuItem to="/profile" icon={<User size={16}/>} label="My Profile" onClick={() => setProfileOpen(false)} />
                      <MenuItem to="/orders" icon={<Package size={16}/>} label="Purchase History" onClick={() => setProfileOpen(false)} />
                      <MenuItem to="/wishlist" icon={<Heart size={16}/>} label="Saved Items" onClick={() => setProfileOpen(false)} />
                      
                      {/* Merchant Portals */}
                      {(user?.role === 'seller' || user?.role === 'admin') && <div className="h-px bg-gray-100 my-2 mx-4" />}
                      {user?.role === 'seller' && (
                        <MenuItem to="/seller/dashboard" icon={<Settings size={16} className="text-walmart-blue"/>} label="Seller Hub" onClick={() => setProfileOpen(false)} />
                      )}
                      {user?.role === 'admin' && (
                        <MenuItem to="/admin/dashboard" icon={<Settings size={16} className="text-red-500"/>} label="Admin Core" onClick={() => setProfileOpen(false)} />
                      )}
                      {user?.role === 'delivery_agent' && (
                        <MenuItem to="/delivery/dashboard" icon={<Truck size={16} className="text-green-600"/>} label="Delivery Tasks" onClick={() => setProfileOpen(false)} />
                      )}
                    </div>
                    <div className="mt-3 pt-3 border-t px-2">
                       <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-all">
                         <LogOut size={16} /> Termination Session
                       </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn-walmart whitespace-nowrap ml-2 shadow-lg hover:shadow-walmart-blue/20" id="nav-login">
                Sign In
              </Link>
            )}

            {/* Mobile Toggle */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="p-3 text-gray-700 md:hidden hover:bg-gray-100 rounded-2xl transition-all"
            >
              {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      <div className={`md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100 z-[90]' : 'opacity-0 pointer-events-none'}`} onClick={() => setMobileMenuOpen(false)} />
      
      {/* Mobile Navigation Drawer */}
      <div className={`md:hidden fixed top-0 left-0 bottom-0 w-4/5 max-w-sm bg-white z-[101] shadow-2xl transition-transform duration-500 ease-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
         <div className="p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-10">
               <Logo className="h-8" />
               <button onClick={() => setMobileMenuOpen(false)} className="p-2 bg-gray-100 rounded-full"><X size={20}/></button>
            </div>
            
            <nav className="flex-1 space-y-2">
               <MobileLink to="/" label="Home" onClick={() => setMobileMenuOpen(false)} />
               <MobileLink to="/products" label="Shop All" onClick={() => setMobileMenuOpen(false)} />
               <MobileLink to="/wishlist" label="My Wishlist" onClick={() => setMobileMenuOpen(false)} />
               <MobileLink to="/orders" label="My Orders" onClick={() => setMobileMenuOpen(false)} />
            </nav>

            {!isAuthenticated && (
              <Link to="/login" className="mt-auto w-full py-4 gradient-primary text-white rounded-2xl font-black text-center shadow-lg" onClick={() => setMobileMenuOpen(false)}>
                 SIGN IN / REGISTER
              </Link>
            )}
         </div>
      </div>
    </header>
  );
};

// Sub-components for cleaner code
const MenuItem = ({ to, icon, label, onClick }) => (
  <Link to={to} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-blue-50 text-sm font-bold text-gray-700 transition-all group" onClick={onClick}>
    <span className="text-gray-400 group-hover:text-walmart-blue transition-colors">{icon}</span>
    {label}
  </Link>
);

const MobileLink = ({ to, label, onClick }) => (
  <Link to={to} className="block py-4 text-xl font-black border-b border-gray-50 hover:text-walmart-blue transition-colors" onClick={onClick}>
    {label}
  </Link>
);

const ArrowRight = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M5 12h14m-7-7 7 7-7 7"/>
  </svg>
);

export default Navbar;
