import { useEffect, useState } from 'react';
import { 
  Banknote, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight,
  User,
  History
} from 'lucide-react';
import api from '@/services/api';
import { formatCurrency, formatDate } from '@/utils/helpers';
import toast from 'react-hot-toast';

const AdminPayoutsPage = () => {
  const [payouts, setPayouts] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // pending, history

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [payoutsRes, sellersRes, agentsRes] = await Promise.all([
        api.get('/payouts/all'),
        api.get('/admin/users?role=seller'),
        api.get('/admin/users?role=delivery_agent')
      ]);
      setPayouts(payoutsRes.data?.data || []);
      
      const combinedSellers = [
        ...(sellersRes.data?.data?.users || []).map(u => ({ ...u, type: 'seller' })),
        ...(agentsRes.data?.data?.users || []).map(u => ({ ...u, type: 'delivery_agent' }))
      ];
      setSellers(combinedSellers);
    } catch (err) {
      toast.error('Failed to load payout data');
    } finally {
      setIsLoading(false);
    }
  };

  const processPayout = async (payoutId) => {
    const transactionId = prompt('Enter Bank Transaction ID (UTR or Reference):');
    if (!transactionId) return;

    try {
      await api.patch(`/payouts/${payoutId}/finalize`, { transactionId });
      toast.success('Payout finalized and balance updated');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to finalize payout');
    }
  };

  const createPayoutRequest = async (userId, userRole, amount) => {
    if(!confirm(`Manually create payout request for ${formatCurrency(amount)}?`)) return;
    try {
      await api.post('/payouts/create-manual', { userId, userRole, amount, adminNote: 'Admin Disbursal' });
      toast.success('Payout request created');
      fetchData();
    } catch (err) {
      toast.error('Failed to create payout');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Escrow & Settlements</h1>
        <p className="text-slate-500 font-medium mt-1">Manage vendor fund distributions and audit financial logs.</p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-amber-500">
            <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-widest">Pending Settlements</p>
            <h3 className="text-3xl font-black text-slate-800">
              {payouts.filter(p => p.status === 'pending').length}
            </h3>
         </div>
         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-green-500">
            <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-widest">Total Disbursed</p>
            <h3 className="text-3xl font-black text-slate-800">
              {formatCurrency(payouts.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0))}
            </h3>
         </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-200 p-1 rounded-xl w-fit">
         <button onClick={() => setActiveTab('pending')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'pending' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
           Sellers Overview
         </button>
         <button onClick={() => setActiveTab('history')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
           Transaction Log
         </button>
      </div>

      {activeTab === 'pending' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                <tr>
                  <th className="px-6 py-4">Seller/Business</th>
                  <th className="px-6 py-4 text-center">Total Revenue</th>
                  <th className="px-6 py-4 text-center">Total Paid</th>
                  <th className="px-6 py-4 text-center">Current Balance</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sellers.map((s) => {
                  const profile = s.type === 'seller' ? s.sellerProfile : s.deliveryAgentProfile;
                  const balance = profile?.currentBalance || 0;
                  const totalEarned = s.type === 'seller' ? profile?.totalRevenue : profile?.totalEarnings;
                  const totalPaid = profile?.paidAmount || 0;

                  return (
                    <tr key={s._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                             <User size={20} />
                           </div>
                           <div>
                              <p className="font-bold text-slate-800">{profile?.businessName || (s.firstName + ' ' + s.lastName) || 'N/A'}</p>
                              <div className="flex gap-2 items-center mt-1">
                                 <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter ${s.type === 'seller' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                   {s.type.replace('_', ' ')}
                                 </span>
                                 <p className="text-[10px] text-slate-400 italic">{s.email}</p>
                              </div>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-slate-600">
                        {formatCurrency(totalEarned || 0)}
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-green-600">
                        {formatCurrency(totalPaid)}
                      </td>
                      <td className="px-6 py-4 text-center">
                         <span className={`font-black ${balance > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                           {formatCurrency(balance)}
                         </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <button 
                           disabled={balance <= 0}
                           onClick={() => createPayoutRequest(s._id, s.type, balance)}
                           className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-black disabled:opacity-30 transition-all uppercase tracking-tighter"
                         >
                           Release Funds
                         </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
           <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
               <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                 <tr>
                    <th className="px-6 py-4">Seller</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">UTR/Transaction</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {payouts.map(p => (
                    <tr key={p._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800">
                          {p.sellerId?.businessName}
                        </td>
                        <td className="px-6 py-4 font-black">
                          {formatCurrency(p.amount)}
                        </td>
                        <td className="px-6 py-4">
                           <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${p.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                             {p.status}
                           </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-500">
                          {p.transactionId || '---'}
                        </td>
                        <td className="px-6 py-4 text-right">
                           {p.status === 'pending' && (
                             <button onClick={() => processPayout(p._id)} className="text-walmart-blue font-bold hover:underline text-xs uppercase">
                               Finalize Process
                             </button>
                           )}
                           {p.status === 'completed' && (
                             <span className="text-slate-400 text-xs italic">Settled on {formatDate(p.processedAt)}</span>
                           )}
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

export default AdminPayoutsPage;
