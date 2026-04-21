import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, setFilters } from '@/features/products/productSlice';
import ProductCard from '@/features/products/components/ProductCard';
import ProductCardSkeleton from '@/features/products/components/ProductCardSkeleton';
import { SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

const ProductsPage = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { items, meta, isLoading, filters } = useSelector((state) => state.products);
  const { items: wishlistItems } = useSelector((state) => state.wishlist);
  const [showFilters, setShowFilters] = useState(false);

  const page = parseInt(searchParams.get('page')) || 1;
  const category = searchParams.get('category') || '';

  useEffect(() => {
    const params = {
      page,
      limit: 12,
      ...filters,
      category: category || filters.category,
    };
    // Clean empty params
    Object.keys(params).forEach((k) => { if (!params[k]) delete params[k]; });
    dispatch(fetchProducts(params));
  }, [dispatch, page, filters, category]);

  const handleFilterChange = (key, value) => {
    dispatch(setFilters({ [key]: value }));
    setSearchParams((prev) => {
      prev.set('page', '1');
      return prev;
    });
  };

  const handlePageChange = (newPage) => {
    setSearchParams((prev) => {
      prev.set('page', String(newPage));
      return prev;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const wishlistIds = (wishlistItems || []).map((w) => w.productId?._id || w.productId);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{category ? category.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) : 'All Products'}</h1>
          <p className="text-gray-500 text-sm mt-1">{meta?.total || 0} products found</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-4 py-2 border rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium md:hidden">
            <SlidersHorizontal size={16} /> Filters
          </button>
          <select
            value={filters?.sort || 'createdAt:desc'}
            onChange={(e) => handleFilterChange('sort', e.target.value)}
            className="px-4 py-2 border rounded-xl text-sm outline-none focus:border-walmart-blue flex-1 min-w-[140px]"
            id="sort-select"
          >
            <option value="createdAt:desc">Newest First</option>
            <option value="basePrice:asc">Price: Low to High</option>
            <option value="basePrice:desc">Price: High to Low</option>
            <option value="avgRating:desc">Best Rating</option>
            <option value="totalSold:desc">Best Selling</option>
          </select>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Filters */}
        <aside className={`w-64 shrink-0 ${showFilters ? 'block' : 'hidden'} md:block`}>
          <div className="bg-white rounded-2xl p-5 border sticky top-28 space-y-6">
            <h3 className="font-semibold flex items-center gap-2"><SlidersHorizontal size={16} /> Filters</h3>

            {/* Price Range */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Price Range</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters?.minPrice || ''}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-walmart-blue"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters?.maxPrice || ''}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-walmart-blue"
                />
              </div>
            </div>

            {/* Brand */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Brand</label>
              <input
                type="text"
                placeholder="e.g. Samsung, Apple"
                value={filters?.brand || ''}
                onChange={(e) => handleFilterChange('brand', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-walmart-blue"
              />
            </div>

            {/* Rating */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Min Rating</label>
              <div className="flex gap-1">
                {[4, 3, 2, 1].map((r) => (
                  <button
                    key={r}
                    onClick={() => handleFilterChange('minRating', filters?.minRating === String(r) ? '' : String(r))}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filters?.minRating === String(r)
                        ? 'bg-walmart-blue text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {r}★+
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Products Grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array(12).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : !items || items.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-6xl mb-4">🔍</p>
              <h3 className="text-xl font-bold mb-2">No products found</h3>
              <p className="text-gray-500">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    isWishlisted={wishlistIds.includes(product._id)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {meta && meta.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-10">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1}
                    className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-30"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === meta.totalPages || Math.abs(p - page) <= 2)
                    .map((p, idx, arr) => (
                      <span key={p}>
                        {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-gray-400">...</span>}
                        <button
                          onClick={() => handlePageChange(p)}
                          className={`w-10 h-10 rounded-lg font-medium text-sm transition-colors ${
                            p === page
                              ? 'bg-walmart-blue text-white'
                              : 'border hover:bg-gray-50'
                          }`}
                        >
                          {p}
                        </button>
                      </span>
                    ))}
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= (meta.totalPages || 1)}
                    className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-30"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
