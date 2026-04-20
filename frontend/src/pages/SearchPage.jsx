import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { searchProducts } from '@/features/products/productSlice';
import ProductCard from '@/features/products/components/ProductCard';
import ProductCardSkeleton from '@/features/products/components/ProductCardSkeleton';
import { Search as SearchIcon } from 'lucide-react';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { items, isLoading } = useSelector((state) => state.products);
  const query = searchParams.get('q') || '';
  const categoryFilter = searchParams.get('category') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCats = async () => {
      const { data } = await api.get('/public/categories');
      setCategories(data.data || []);
    };
    fetchCats();
  }, []);

  useEffect(() => {
    if (query) {
      dispatch(searchProducts({ 
        q: query, 
        category: categoryFilter,
        minPrice,
        maxPrice
      }));
    }
  }, [dispatch, query, categoryFilter, minPrice, maxPrice]);

  const setFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(key, value);
    else newParams.delete(key);
    setSearchParams(newParams);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in text-left">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 space-y-8 shrink-0">
           <div>
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Filter size={18} /> Filters</h3>
              
              {/* Category Filter */}
              <div className="space-y-3">
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Category</p>
                 <select 
                   value={categoryFilter} 
                   onChange={(e) => setFilter('category', e.target.value)}
                   className="w-full bg-slate-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-walmart-blue outline-none"
                 >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat.slug}>{cat.name}</option>
                    ))}
                 </select>
              </div>

              {/* Price Filter */}
              <div className="space-y-4 mt-8">
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Price Range</p>
                 <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      placeholder="Min" 
                      value={minPrice} 
                      onChange={(e) => setFilter('minPrice', e.target.value)}
                      className="w-full bg-slate-100 border-none rounded-xl px-3 py-2 text-xs" 
                    />
                    <span className="text-slate-300">-</span>
                    <input 
                      type="number" 
                      placeholder="Max" 
                      value={maxPrice} 
                      onChange={(e) => setFilter('maxPrice', e.target.value)}
                      className="w-full bg-slate-100 border-none rounded-xl px-3 py-2 text-xs" 
                    />
                 </div>
              </div>

              {/* Reset */}
              {(categoryFilter || minPrice || maxPrice) && (
                <button 
                  onClick={() => setSearchParams({ q: query })}
                  className="w-full mt-6 text-xs font-bold text-red-500 hover:underline"
                >
                  Clear All Filters
                </button>
              )}
           </div>

           {/* Promo Banner */}
           <div className="bg-gradient-to-br from-walmart-blue to-blue-700 p-6 rounded-2xl text-white">
              <h4 className="font-black text-lg leading-tight mb-2">Free Delivery on ₹500+</h4>
              <p className="text-[10px] opacity-80 uppercase tracking-widest">Limited Time Offer</p>
           </div>
        </aside>

        {/* Results Area */}
        <div className="flex-1">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-800">
                Results for "{query}"
              </h1>
              <p className="text-slate-500 text-sm mt-1">{(items || []).length} items found</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
               SORT BY: 
               <select className="bg-transparent border-none outline-none text-slate-800 font-black cursor-pointer">
                  <option>Relevance</option>
                  <option>Price: Low to High</option>
                  <option>Newest First</option>
               </select>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array(8).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : !items || items.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed">
              <SearchIcon size={48} className="mx-auto mb-4 text-slate-200" />
              <h3 className="text-xl font-bold text-slate-800 mb-2">Uh oh! No matches.</h3>
              <p className="text-slate-500 text-sm">We couldn't find anything for "{query}" with these filters.</p>
              <button 
                onClick={() => setSearchParams({ q: query })}
                className="mt-6 text-walmart-blue font-bold hover:underline"
              >
                Reset all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {items.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
