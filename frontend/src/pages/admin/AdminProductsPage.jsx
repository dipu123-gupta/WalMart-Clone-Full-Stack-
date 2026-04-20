import { useEffect, useState } from 'react';
import { Package, CheckCircle, XCircle, Search } from 'lucide-react';
import api from '@/services/api';
import { formatCurrency, formatDate } from '@/utils/helpers';
import toast from 'react-hot-toast';

const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/admin/products/pending');
      setProducts(res.data?.data || []);
    } catch (err) {
      toast.error('Failed to load product moderation list');
    } finally {
      setIsLoading(false);
    }
  };

  const updateProductStatus = async (id, status) => {
    try {
      await api.patch(`/admin/products/${id}/approve`, { status });
      setProducts(products.map(p => p._id === id ? { ...p, status } : p));
      toast.success(`Product marked as ${status}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Moderation action failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Content Moderation</h1>
          <p className="text-slate-500 mt-1">Review and approve seller product listings before they go live.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Product Details</th>
                <th className="px-6 py-4">Seller ID</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    <span className="loading loading-spinner text-red-500 loading-md"></span>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    <Package size={40} className="mx-auto mb-3 opacity-20 text-slate-400" />
                    <p>No products waiting for moderation.</p>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-4">
                      {product.images?.[0]?.url ? (
                        <img src={product.images[0].url} alt={product.name} className="w-12 h-12 rounded object-cover border" />
                      ) : (
                        <div className="w-12 h-12 bg-slate-100 rounded border flex items-center justify-center">📷</div>
                      )}
                      <div>
                        <p className="font-semibold text-slate-800 truncate w-48">{product.name}</p>
                        <p className="text-xs text-slate-500">{product.brand}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700">
                          {product.sellerId?.firstName} {product.sellerId?.lastName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {product.sellerId?._id || 'GENESIS_ADMIN'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">
                      {formatCurrency(product.basePrice)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs rounded-full font-bold uppercase tracking-wider border ${
                        product.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' : 
                        product.status === 'pending' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                        'bg-red-100 text-red-700 border-red-200'
                      }`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        {product.status !== 'active' && (
                           <button onClick={() => updateProductStatus(product._id, 'active')} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-md transition-colors">
                             <CheckCircle size={14} /> Approve
                           </button>
                        )}
                        {product.status !== 'rejected' && (
                           <button onClick={() => updateProductStatus(product._id, 'rejected')} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-md transition-colors">
                             <XCircle size={14} /> Reject
                           </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminProductsPage;
