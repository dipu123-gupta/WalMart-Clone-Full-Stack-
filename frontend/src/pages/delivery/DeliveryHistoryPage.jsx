import { useEffect, useState } from 'react';
import { 
  PackageCheck, 
  MapPin, 
  Calendar,
  IndianRupee,
  Search,
  Filter
} from 'lucide-react';
import api from '@/services/api';
import { formatCurrency, formatDate } from '@/utils/helpers';
import toast from 'react-hot-toast';

const DeliveryHistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const { data } = await api.get('/delivery-agent/history');
      setHistory(data.data || []);
    } catch (err) {
      toast.error('Failed to load delivery history');
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter(order => 
    order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.shippingAddress.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex justify-center p-20">
      <span className="loading loading-spinner loading-lg text-walmart-blue"></span>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in text-left">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Delivery History</h1>
          <p className="text-slate-500 font-medium mt-1">Review your completed assignments and performance.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
           <div className="relative flex-1 md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:border-walmart-blue outline-none font-bold text-sm transition-all"
              />
           </div>
           <button className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all">
              <Filter size={18} />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Delivered</p>
            <p className="text-3xl font-black text-slate-800">{history.length}</p>
         </div>
         <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cash Collected</p>
            <p className="text-3xl font-black text-green-600">
               {formatCurrency(history.reduce((acc, curr) => acc + curr.pricing.total, 0))}
            </p>
         </div>
         <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg. Delivery Time</p>
            <p className="text-3xl font-black text-blue-600">42m</p>
         </div>
      </div>

      {filteredHistory.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
           <PackageCheck size={64} className="mx-auto mb-4 text-slate-200" />
           <h3 className="text-xl font-black text-slate-800">No History Found</h3>
           <p className="text-slate-500 mt-2 max-w-xs mx-auto text-sm">Your completed deliveries will appear here once you mark them as delivered.</p>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Details</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Delivered At</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredHistory.map((order) => (
                  <tr key={order._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-800 group-hover:text-walmart-blue transition-colors">#{order.orderNumber}</span>
                        <span className="text-[10px] font-bold text-slate-400 mt-0.5">{order.items.length} Items</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                         <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-500 text-xs">
                            {order.shippingAddress.fullName.charAt(0)}
                         </div>
                         <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700">{order.shippingAddress.fullName}</span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                               <MapPin size={10} /> {order.shippingAddress.city}
                            </span>
                         </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-slate-500 font-medium">
                        <Calendar size={14} />
                        <span className="text-sm">{formatDate(order.deliveredAt)}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-sm font-black text-slate-800">
                      {formatCurrency(order.pricing.total)}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-widest">
                        Delivered
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryHistoryPage;
