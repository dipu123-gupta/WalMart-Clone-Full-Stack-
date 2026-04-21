import { useEffect, useState } from 'react';
import { 
  Navigation, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Package,
  Calendar,
  IndianRupee
} from 'lucide-react';
import api from '@/services/api';
import { formatCurrency, formatDate } from '@/utils/helpers';
import toast from 'react-hot-toast';

const DeliveryAgentDashboardPage = () => {
  const [tasks, setTasks] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tasksRes, profileRes] = await Promise.all([
        api.get('/delivery-agent/tasks'),
        api.get('/delivery-agent/profile')
      ]);
      setTasks(tasksRes.data?.data || []);
      setProfile(profileRes.data?.data || null);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const requestWithdrawal = async () => {
    if (!profile || profile.currentBalance < 500) {
      return toast.error('Minimum withdrawal amount is ₹500');
    }

    const confirmRequest = window.confirm(`Request payout for ${formatCurrency(profile.currentBalance)}?`);
    if (!confirmRequest) return;

    try {
      setLoading(true);
      await api.post('/payouts/request', {
        amount: profile.currentBalance,
        paymentMethod: 'bank_transfer'
      });
      toast.success('Withdrawal request submitted!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, status) => {
    try {
      await api.patch(`/delivery-agent/tasks/${orderId}/status`, { status });
      toast.success(`Order marked as ${status}`);
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status update failed');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Active Assignments</h1>
          <p className="text-slate-500 font-medium mt-1">Manage your current deliveries and navigate to destinations.</p>
        </div>
        <div className="bg-slate-900 text-white px-5 py-2.5 rounded-2xl flex items-center gap-3 shadow-xl">
           <Navigation size={20} className="text-walmart-yellow animate-pulse" />
           <span className="text-sm font-black uppercase tracking-widest">Live Route Mode</span>
        </div>
      </div>

      {/* Stats Quick Glance */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <div className="bg-white p-5 rounded-2xl border shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
               <Package size={24} />
            </div>
            <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Today's Jobs</p>
               <p className="text-xl font-black text-slate-800">{tasks.length}</p>
            </div>
         </div>
         <div className="bg-white p-5 rounded-2xl border shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
               <Clock size={24} />
            </div>
            <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">In Transit</p>
               <p className="text-xl font-black text-slate-800">{tasks.filter(t => t.orderStatus === 'shipped').length}</p>
            </div>
         </div>
         <div className="bg-white p-5 rounded-2xl border shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
               <CheckCircle2 size={24} />
            </div>
            <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Success Rate</p>
               <p className="text-xl font-black text-slate-800">98.2%</p>
            </div>
         </div>
         <div className="bg-white p-5 rounded-2xl border shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
               <IndianRupee size={24} />
            </div>
            <div className="flex-1">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Withdrawable Balance</p>
               <div className="flex justify-between items-end">
                  <p className="text-xl font-black text-slate-800">{formatCurrency(profile?.currentBalance || 0)}</p>
                  <button 
                    onClick={requestWithdrawal}
                    disabled={!profile || profile.currentBalance < 500}
                    className="text-[10px] font-black text-walmart-blue hover:underline uppercase disabled:opacity-30"
                  >
                    Withdraw
                  </button>
               </div>
            </div>
         </div>
         <div className="bg-white p-5 rounded-2xl border shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
               <CheckCircle2 size={24} />
            </div>
            <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Total Earnings</p>
               <p className="text-xl font-black text-slate-800">{formatCurrency(profile?.totalEarnings || 0)}</p>
            </div>
         </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-20"><span className="loading loading-spinner loading-lg text-walmart-blue"></span></div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200">
           <Truck size={64} className="mx-auto mb-4 text-slate-200" />
           <h3 className="text-xl font-black text-slate-800">No Assignments Yet</h3>
           <p className="text-slate-500 mt-2 max-w-xs mx-auto text-sm">Waiting for dispatcher to assign new orders to your route.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {tasks.map((order) => (
            <div key={order._id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-300">
              <div className="p-6">
                 <div className="flex justify-between items-start mb-6">
                    <div>
                       <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded-md uppercase mb-2 inline-block">Order ID: {order.orderNumber}</span>
                       <h3 className="text-xl font-black text-slate-800">{order.shippingAddress.fullName}</h3>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${order.orderStatus === 'shipped' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                       {order.orderStatus}
                    </div>
                 </div>

                 <div className="space-y-4 mb-8">
                    <div className="flex gap-3">
                       <MapPin className="text-slate-400 shrink-0" size={20} />
                       <div className="text-sm">
                          <p className="font-bold text-slate-700">{order.shippingAddress.addressLine1}</p>
                          <p className="text-slate-500">{order.shippingAddress.city}, {order.shippingAddress.pincode}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-3">
                       <Phone className="text-slate-400 shrink-0" size={20} />
                       <a href={`tel:${order.shippingAddress.phone}`} className="text-sm font-bold text-walmart-blue hover:underline">
                         {order.shippingAddress.phone}
                       </a>
                    </div>
                    <div className="flex items-center gap-3">
                       <IndianRupee className="text-slate-400 shrink-0" size={20} />
                       <span className="text-sm font-bold text-slate-700">Collect: {formatCurrency(order.pricing.total)}</span>
                       {order.paymentMethod === 'cod' && <span className="bg-red-50 text-red-600 text-[10px] font-black px-2 py-0.5 rounded-md border border-red-100 uppercase">Cash on Delivery</span>}
                    </div>
                 </div>

                  <div className="grid grid-cols-2 gap-3 mt-auto">
                     {(order.orderStatus === 'confirmed' || order.orderStatus === 'processing') ? (
                       <button 
                          onClick={() => updateStatus(order._id, 'shipped')}
                          className="col-span-2 bg-slate-900 text-white py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all"
                       >
                          Pickup from Store
                       </button>
                     ) : order.orderStatus === 'shipped' ? (
                       <button 
                          onClick={() => updateStatus(order._id, 'out_for_delivery')}
                          className="col-span-2 bg-walmart-blue text-white py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                       >
                          Start Delivery Run
                       </button>
                     ) : order.orderStatus === 'out_for_delivery' ? (
                       <>
                         <button 
                            onClick={() => updateStatus(order._id, 'delivered')}
                            className="bg-green-600 text-white py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg shadow-green-100"
                         >
                            Mark Delivered
                         </button>
                         <button 
                            className="bg-slate-100 text-slate-800 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all"
                         >
                            Get Support
                         </button>
                       </>
                     ) : null}
                  </div>
              </div>
              
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-slate-400" />
                    <span className="text-xs font-bold text-slate-500">Exp: {formatDate(order.estimatedDelivery)}</span>
                 </div>
                 <div className="flex -space-x-2">
                    {order.items.slice(0, 3).map((item, idx) => (
                      <img key={idx} src={item.image} alt="" className="w-8 h-8 rounded-full border-2 border-white object-cover" />
                    ))}
                    {order.items.length > 3 && <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold">+{order.items.length - 3}</div>}
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Safety Banner */}
      <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl flex gap-5 items-start">
         <AlertCircle className="text-amber-600 shrink-0 mt-1" size={24} />
         <div>
            <h4 className="font-black text-amber-900 uppercase tracking-tight">Partner Safety Protocol</h4>
            <p className="text-sm text-amber-700 mt-1 leading-relaxed">Always wear your helmet and carry your partner ID. For COD orders, verify payment before handing over the package. Use the <strong>Get Support</strong> button for any delivery issues.</p>
         </div>
      </div>
    </div>
  );
};

export default DeliveryAgentDashboardPage;
