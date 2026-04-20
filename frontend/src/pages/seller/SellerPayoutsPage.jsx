import { useEffect, useState } from 'react';
import { 
  Banknote, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import api from '@/services/api';
import { formatCurrency, formatDate } from '@/utils/helpers';
import toast from 'react-hot-toast';

const SellerPayoutsPage = () => {
  const [payouts, setPayouts] = useState([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    paidAmount: 0,
    pendingBalance: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [payoutsRes, statsRes] = await Promise.all([
        api.get('/payouts/my-payouts'),
        api.get('/seller/dashboard') 
      ]);
      
      setPayouts(payoutsRes.data?.data || []);
      
      // The dashboard endpoint returns { seller, stats, recentOrders }
      const sellerData = statsRes.data?.data?.seller || {};
      const totalRev = sellerData.totalRevenue || 0;
      const paidAmt = sellerData.paidAmount || 0;

      setStats({
        totalRevenue: totalRev,
        paidAmount: paidAmt,
        pendingBalance: Math.max(0, totalRev - paidAmt)
      });
    } catch (err) {
      toast.error('Failed to load payouts history');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      completed: 'bg-green-100 text-green-700',
      pending: 'bg-amber-100 text-amber-700',
      processing: 'bg-blue-100 text-blue-700',
      failed: 'bg-red-100 text-red-700'
    };
    return <span className={`px-2.5 py-1 text-xs rounded-full font-bold uppercase tracking-wider ${map[status]}`}>{status}</span>;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Earnings & Settlements</h1>
          <p className="text-slate-500 font-medium mt-1">Track your revenue distribution and payment history.</p>
        </div>
        <div className="bg-walmart-blue text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-100">
           <TrendingUp size={18} />
           <span className="text-sm font-bold">Revenue Dashboard</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Lifetime Earnings</p>
           <h3 className="text-2xl font-black text-slate-800">{formatCurrency(stats.totalRevenue)}</h3>
           <p className="text-[10px] text-slate-400 mt-2">Gross revenue before cancellations</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-2xl shadow-xl shadow-slate-200 relative overflow-hidden">
           <div className="absolute right-0 top-0 opacity-10"><CreditCard size={100} /></div>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Withdrawable Balance</p>
           <h3 className="text-2xl font-black text-white">{formatCurrency(stats.pendingBalance)}</h3>
           <p className="text-[10px] text-white/50 mt-2">Settled amount available for payout</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Total Settled</p>
           <h3 className="text-2xl font-black text-green-600">{formatCurrency(stats.paidAmount)}</h3>
           <p className="text-[10px] text-slate-400 mt-2">Paid to your primary bank account</p>
        </div>
      </div>

      {/* Payout History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
           <h3 className="font-bold text-slate-800 flex items-center gap-2"><Clock size={18} /> Payout History</h3>
           <button className="text-xs font-bold text-walmart-blue hover:underline flex items-center gap-1">
             <HelpCircle size={14} /> Settlement Policy
           </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
              <tr>
                <th className="px-6 py-4">Transaction ID</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Processed Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan="5" className="px-6 py-12 text-center"><span className="loading loading-spinner text-walmart-blue"></span></td></tr>
              ) : payouts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400 italic">
                    <Banknote size={48} className="mx-auto mb-4 opacity-10" />
                    No payout records found. Settlements happen every 7 days.
                  </td>
                </tr>
              ) : (
                payouts.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                      {p.transactionId || '---'}
                    </td>
                    <td className="px-6 py-4 font-black text-slate-800">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="px-6 py-4 text-slate-600 capitalize">
                      {p.paymentMethod.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(p.status)}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-500 font-medium">
                      {p.processedAt ? formatDate(p.processedAt) : 'Pending'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3">
         <AlertCircle className="text-amber-600 shrink-0" size={20} />
         <div>
            <p className="text-sm font-bold text-amber-900">Important Note on Settlements</p>
            <p className="text-xs text-amber-700 mt-1">Settlements are processed weekly for all "Delivered" orders that have completed the 7-day return window. Minimum payout threshold is ₹500.</p>
         </div>
      </div>
    </div>
  );
};

export default SellerPayoutsPage;
