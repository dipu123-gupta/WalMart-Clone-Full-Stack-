import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { removeFromCompare, clearCompare } from '@/features/compare/compareSlice';
import { X, ShoppingCart, ArrowLeft, ArrowRight, Star } from 'lucide-react';
import { addToCart } from '@/features/cart/cartSlice';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/utils/helpers';

const ComparePage = () => {
  const dispatch = useDispatch();
  const { items } = useSelector((state) => state.compare);

  const handleAddToCart = (product) => {
    dispatch(addToCart({ productId: product._id, quantity: 1 }));
    toast.success('Added to cart!');
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
           <ArrowLeft size={40} className="text-slate-300" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">No products to compare</h2>
        <p className="text-slate-500 mt-2 mb-8">Add products from our catalog to compare them side-by-side.</p>
        <Link to="/products" className="btn-walmart inline-flex items-center gap-2">
           Browse Products <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 animate-fade-in text-left">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Compare Products</h1>
          <p className="text-slate-500 font-medium">Analyze features and prices to make the best choice.</p>
        </div>
        <button onClick={() => dispatch(clearCompare())} className="text-sm font-bold text-red-500 hover:underline px-4 py-2 bg-red-50 rounded-xl transition-all">
          Clear All
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full min-w-[800px] border-collapse">
          <thead>
            <tr className="border-b bg-slate-50/50">
              <th className="p-8 w-1/5 font-bold text-slate-400 uppercase tracking-widest text-xs">Feature</th>
              {items.map((product) => (
                <th key={product._id} className="p-8 w-1/4 relative group min-w-[200px]">
                  <button 
                    onClick={() => dispatch(removeFromCompare(product._id))}
                    className="absolute top-4 right-4 p-1.5 bg-white border shadow-sm rounded-full text-slate-400 hover:text-red-500 hover:border-red-200 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <X size={14} />
                  </button>
                  <div className="aspect-square rounded-2xl bg-white border border-slate-100 overflow-hidden mb-4 p-4">
                    <img src={product.images?.[0]?.url} alt="" className="w-full h-full object-contain" />
                  </div>
                  <h3 className="font-bold text-slate-800 line-clamp-2 h-10 mb-2 leading-tight">{product.name}</h3>
                  <p className="text-xl font-black text-walmart-blue">{formatCurrency(product.salePrice || product.basePrice)}</p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
             {/* Rating */}
             <tr>
               <td className="p-6 font-bold text-slate-400 text-xs uppercase tracking-widest bg-slate-50/30">Rating</td>
               {items.map(p => (
                 <td key={p._id} className="p-6">
                    <div className="flex items-center gap-1.5 text-amber-500 font-bold">
                       <Star size={16} fill="currentColor" /> {p.avgRating?.toFixed(1) || 'N/A'}
                       <span className="text-slate-400 font-medium text-xs">({p.totalRatings || 0})</span>
                    </div>
                 </td>
               ))}
             </tr>

             {/* Brand */}
             <tr>
               <td className="p-6 font-bold text-slate-400 text-xs uppercase tracking-widest bg-slate-50/30">Brand</td>
               {items.map(p => (
                 <td key={p._id} className="p-6 font-bold text-slate-700">{p.brand || 'No Brand'}</td>
               ))}
             </tr>

             {/* Description */}
             <tr>
               <td className="p-6 font-bold text-slate-400 text-xs uppercase tracking-widest bg-slate-50/30">Quick Look</td>
               {items.map(p => (
                 <td key={p._id} className="p-6 text-sm text-slate-600 leading-relaxed line-clamp-4 mt-2 h-32 overflow-hidden">{p.description}</td>
               ))}
             </tr>

             {/* Availability */}
             <tr>
               <td className="p-6 font-bold text-slate-400 text-xs uppercase tracking-widest bg-slate-50/30">Availability</td>
               {items.map(p => (
                 <td key={p._id} className="p-6">
                    <span className={`text-xs font-black uppercase px-2 py-1 rounded-md ${p.inventory?.quantity > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                       {p.inventory?.quantity > 0 ? 'In Stock' : 'Out of Stock'}
                    </span>
                 </td>
               ))}
             </tr>

             {/* CTA */}
             <tr className="border-t">
               <td className="p-6 bg-slate-50/30"></td>
               {items.map(p => (
                 <td key={p._id} className="p-6">
                    <button 
                      onClick={() => handleAddToCart(p)}
                      className="w-full btn-walmart flex items-center justify-center gap-2 py-3"
                    >
                      <ShoppingCart size={16} /> Add to Cart
                    </button>
                    <Link to={`/products/${p.slug}`} className="block text-center text-xs font-bold text-walmart-blue mt-4 hover:underline">View Details</Link>
                 </td>
               ))}
             </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComparePage;
