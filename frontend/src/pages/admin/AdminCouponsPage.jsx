import { useEffect, useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Tag, 
  Calendar, 
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import api from '@/services/api';
import { formatCurrency, formatDate } from '@/utils/helpers';
import toast from 'react-hot-toast';

const AdminCouponsPage = () => {
  const [coupons, setCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: 0,
    minOrderAmount: 0,
    maxDiscountAmount: 0,
    validFrom: new Date().toISOString().split('T')[0],
    validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const res = await api.get('/admin/coupons');
      setCoupons(res.data?.data || []);
    } catch (err) {
      toast.error('Failed to load coupons');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/coupons', newCoupon);
      toast.success('Coupon created successfully');
      setIsModalOpen(false);
      fetchCoupons();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Creation failed');
    }
  };

  const toggleStatus = async (id) => {
    try {
      await api.patch(`/admin/coupons/${id}/toggle`);
      setCoupons(coupons.map(c => c._id === id ? { ...c, isActive: !c.isActive } : c));
      toast.success('Status updated');
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const deleteCoupon = async (id) => {
    if (!window.confirm('Delete this coupon permanently?')) return;
    try {
      await api.delete(`/admin/coupons/${id}`);
      setCoupons(coupons.filter(c => c._id !== id));
      toast.success('Coupon removed');
    } catch (err) {
      toast.error('Deletion failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Promo Coupons</h1>
          <p className="text-slate-500 mt-1">Create and manage discount codes for marketing campaigns.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-walmart px-6 flex items-center gap-2"
        >
          <Plus size={18} /> Create Coupon
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [...Array(3)].map((_, i) => <div key={i} className="h-48 bg-slate-200 animate-pulse rounded-2xl"></div>)
        ) : coupons.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-400">
             <Tag size={48} className="mx-auto mb-4 opacity-20" />
             <p>No coupons found. Create your first one!</p>
          </div>
        ) : coupons.map((coupon) => (
          <div key={coupon._id} className={`bg-white rounded-2xl border p-6 transition-all shadow-sm hover:shadow-md relative overflow-hidden group ${!coupon.isActive && 'opacity-70 grayscale-[0.5]'}`}>
            <div className={`absolute top-0 right-0 p-1.5 text-[10px] font-bold uppercase tracking-widest ${coupon.isActive ? 'bg-green-500 text-white' : 'bg-slate-400 text-white'}`}>
              {coupon.isActive ? 'Active' : 'Inactive'}
            </div>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-red-50 text-red-500">
                <Tag size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 tracking-wider uppercase">{coupon.code}</h3>
                <p className="text-xs text-slate-500 line-clamp-1">{coupon.description || 'Global discount'}</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Discount</span>
                <span className="font-bold text-slate-800">
                  {coupon.discountValue}{coupon.discountType === 'percentage' ? '%' : ' OFF'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Min. Order</span>
                <span className="font-medium text-slate-700">{formatCurrency(coupon.minOrderAmount)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Validity</span>
                <span className="font-medium text-slate-700 flex items-center gap-1">
                  <Clock size={12} /> {new Date(coupon.validTo).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t gap-3">
               <button 
                onClick={() => toggleStatus(coupon._id)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-colors ${coupon.isActive ? 'text-slate-600 bg-white hover:bg-slate-50 border-slate-200' : 'text-white bg-green-600 hover:bg-green-700 border-green-600'}`}
               >
                 {coupon.isActive ? 'Deactivate' : 'Activate'}
               </button>
               <button 
                onClick={() => deleteCoupon(coupon._id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100"
               >
                 <Trash2 size={18} />
               </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Tag className="text-red-500" /> New Campaign Coupon
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Coupon Code</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full px-4 py-3 rounded-xl border focus:border-red-500 outline-none uppercase font-mono"
                    value={newCoupon.code}
                    onChange={e => setNewCoupon({...newCoupon, code: e.target.value})}
                    placeholder="e.g. SAVE50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Type</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border focus:border-red-500 outline-none"
                    value={newCoupon.discountType}
                    onChange={e => setNewCoupon({...newCoupon, discountType: e.target.value})}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Value</label>
                  <input 
                    type="number" 
                    required 
                    className="w-full px-4 py-3 rounded-xl border focus:border-red-500 outline-none"
                    value={newCoupon.discountValue}
                    onChange={e => setNewCoupon({...newCoupon, discountValue: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Min Order (₹)</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-3 rounded-xl border focus:border-red-500 outline-none"
                    value={newCoupon.minOrderAmount}
                    onChange={e => setNewCoupon({...newCoupon, minOrderAmount: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Starts On</label>
                  <input 
                    type="date" 
                    required 
                    className="w-full px-4 py-3 rounded-xl border focus:border-red-500 outline-none"
                    value={newCoupon.validFrom}
                    onChange={e => setNewCoupon({...newCoupon, validFrom: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Ends On</label>
                  <input 
                    type="date" 
                    required 
                    className="w-full px-4 py-3 rounded-xl border focus:border-red-500 outline-none"
                    value={newCoupon.validTo}
                    onChange={e => setNewCoupon({...newCoupon, validTo: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-6 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 font-bold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 shadow-lg shadow-red-500/30"
                >
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCouponsPage;
