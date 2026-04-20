import { useEffect, useState } from 'react';
import { PackageOpen, Edit, Trash2, Plus } from 'lucide-react';
import api from '@/services/api';
import { formatCurrency, formatDate } from '@/utils/helpers';
import toast from 'react-hot-toast';

const SellerProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load categories');
    }
  };

  const [previewImage, setPreviewImage] = useState(null);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/seller/products');
      setProducts(res.data?.data?.results || []);
    } catch (err) {
      toast.error('Failed to load catalog');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/seller/products/${id}`);
      setProducts(products.filter(p => p._id !== id));
      toast.success('Product deleted');
    } catch (err) {
      toast.error('Deletion failed');
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.target);

    try {
      const res = await api.post('/seller/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProducts([res.data.data, ...products]);
      setIsModalOpen(false);
      setPreviewImage(null);
      toast.success('Product submitted for approval!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ... previous code remains same ... */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Product Catalog</h1>
          <p className="text-slate-500 mt-1">Manage your inventory and product listings.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-walmart flex items-center gap-2">
          <Plus size={18} /> Add Product
        </button>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden text-left">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left">Product</th>
                <th className="px-6 py-4 text-left">Base Price</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-left">Created Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500 text-left">
                    <span className="loading loading-spinner loading-md"></span>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500 text-left">
                    <PackageOpen size={40} className="mx-auto mb-3 opacity-20" />
                    <p>No products found in your catalog.</p>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-4 text-left">
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
                    <td className="px-6 py-4 font-medium text-slate-700 text-left">
                      {formatCurrency(product.basePrice)}
                    </td>
                    <td className="px-6 py-4 text-left">
                      <span className={`px-2.5 py-1 text-xs rounded-full font-bold uppercase tracking-wider border ${
                        product.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' : 
                        product.status === 'pending_approval' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                        'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {product.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-left">
                      {formatDate(product.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-2 text-slate-400 hover:text-walmart-blue hover:bg-blue-50 rounded-lg transition-colors border">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDelete(product._id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in text-left">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[95vh] overflow-y-auto shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-walmart-blue"></div>
            <div className="p-8 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md z-10">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">List New Product</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleAddProduct} className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-sm font-black text-slate-800">Product Image *</label>
                  <label className="block w-full aspect-video rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer relative overflow-hidden">
                     {previewImage ? (
                        <img src={previewImage} className="w-full h-full object-cover" />
                     ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                           <Plus size={32} className="mb-2" />
                           <span className="text-xs font-bold uppercase tracking-widest">Upload Primary Photo</span>
                        </div>
                     )}
                     <input required name="images" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                </div>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-sm font-black text-slate-800">Product Name *</label>
                    <input required name="name" type="text" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-walmart-blue outline-none font-bold text-slate-700" placeholder="e.g. Sony WH-1000XM5" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-black text-slate-800">Brand Name *</label>
                    <input required name="brand" type="text" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-walmart-blue outline-none font-bold text-slate-700" placeholder="e.g. Sony" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-black text-slate-800">Complete Description *</label>
                <textarea required name="description" rows="4" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-walmart-blue outline-none font-bold text-slate-700 resize-none" placeholder="Provide features, tech specs, or details..."></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <label className="text-sm font-black text-slate-800">Base Price (₹) *</label>
                  <input required name="basePrice" type="number" min="0" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-walmart-blue outline-none font-bold text-slate-700" placeholder="0.00" />
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-black text-slate-800">In-Stock Quantity *</label>
                  <input required name="stock" type="number" min="0" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-walmart-blue outline-none font-bold text-slate-700" placeholder="e.g. 50" />
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-black text-slate-800">Target Category *</label>
                  <select required name="categoryId" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-walmart-blue outline-none font-bold text-slate-700 appearance-none bg-white">
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 bg-slate-50 hover:bg-slate-100 transition-all border border-slate-100"
                >
                  Discard
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="btn-walmart px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 flex items-center gap-2"
                >
                  {isSubmitting ? <span className="loading loading-spinner loading-sm"></span> : 'Submit Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerProductsPage;
