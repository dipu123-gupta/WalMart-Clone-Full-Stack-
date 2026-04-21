import { useEffect, useState } from 'react';
import { 
  Truck, 
  UserPlus, 
  MapPin, 
  Clock, 
  ShieldCheck,
  Search,
  Filter,
  Navigation
} from 'lucide-react';
import api from '@/services/api';
import { formatDate, formatCurrency } from '@/utils/helpers';
import toast from 'react-hot-toast';

const AdminLogisticsPage = () => {
  const [orders, setOrders] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, agentsRes] = await Promise.all([
        api.get('/admin/orders?status=confirmed'),
        api.get('/admin/users?role=delivery_agent')
      ]);
      setOrders(ordersRes.data?.data || []);
      setAgents(agentsRes.data?.data?.users || []);
    } catch (err) {
      toast.error('Logistics data load failed');
    } finally {
      setLoading(false);
    }
  };

  const assignAgent = async (orderId, agentId) => {
    try {
      await api.patch(`/orders/${orderId}/assign-agent`, { agentId });
      toast.success('Agent assigned successfully');
      fetchData();
    } catch (err) {
      toast.error('Assignment failed');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Last-Mile Logistics</h1>
          <p className="text-slate-500 font-medium mt-1">Dispatch verified agents to fulfill pending customer shipments.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl border border-slate-200">
           <Search size={16} className="text-slate-400" />
           <input type="text" placeholder="Search orders..." className="bg-transparent border-none outline-none text-sm font-medium w-40" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pending Orders List */}
        <div className="lg:col-span-2 space-y-4">
           <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest pl-2">Pending Dispatch ({orders.length})</h3>
           {loading ? (
             <div className="flex justify-center p-20"><span className="loading loading-spinner text-walmart-blue"></span></div>
           ) : orders.length === 0 ? (
             <div className="bg-white p-12 rounded-3xl border-2 border-dashed border-slate-200 text-center">
                <ShieldCheck size={48} className="mx-auto mb-3 text-slate-300" />
                <p className="text-slate-500 font-bold">All caught up! No orders pending dispatch.</p>
             </div>
           ) : (
             orders.map(order => (
               <div key={order._id} className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-5">
                     <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-walmart-blue shrink-0">
                        <Truck size={28} />
                     </div>
                     <div>
                        <div className="flex items-center gap-2 mb-1">
                           <span className="text-xs font-black text-slate-400 uppercase">#{order.orderNumber}</span>
                           <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                           <span className="text-xs font-bold text-slate-500">{formatDate(order.createdAt)}</span>
                           <span className="text-xs font-bold text-slate-700">{formatCurrency(order.pricing?.total)}</span>
                        </div>
                        <h4 className="font-black text-slate-800 text-lg">{order.shippingAddress.fullName}</h4>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                           <MapPin size={12} />
                           {order.shippingAddress.city}, {order.shippingAddress.pincode}
                        </div>
                     </div>
                  </div>

                  <div className="flex items-center gap-3">
                     <div className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter leading-none mb-1">Assign Partner</p>
                        <select 
                          onChange={(e) => assignAgent(order._id, e.target.value)}
                          className="bg-transparent border-none outline-none text-sm font-bold text-slate-700 cursor-pointer p-0"
                          defaultValue=""
                        >
                           <option value="" disabled>Select Delivery Agent</option>
                           {agents.map(agent => (
                             <option key={agent._id} value={agent._id}>{agent.firstName} {agent.lastName}</option>
                           ))}
                        </select>
                     </div>
                     <button className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-black">
                        <Navigation size={18} />
                     </button>
                  </div>
               </div>
             ))
           )}
        </div>

        {/* Sidebar Agents Status */}
        <div className="space-y-6">
           <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-slate-200">
              <h3 className="font-black text-lg mb-4 flex items-center gap-2">
                 <ShieldCheck className="text-walmart-yellow" /> Agent Fleet
              </h3>
              <div className="space-y-4">
                 {agents.map(agent => (
                   <div key={agent._id} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                            {agent.firstName[0]}{agent.lastName[0]}
                         </div>
                         <div>
                            <p className="text-xs font-bold">{agent.firstName} {agent.lastName}</p>
                            <p className="text-[10px] text-white/40">Vehicle: Bike</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-1.5 bg-green-500/20 px-2 py-0.5 rounded-full border border-green-500/30">
                         <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                         <span className="text-[10px] font-bold text-green-400 uppercase">Idle</span>
                      </div>
                   </div>
                 ))}
              </div>
              <button 
                onClick={() => window.location.href = '/admin/users'}
                className="w-full mt-6 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                 <UserPlus size={14} /> Onboard New Agent
              </button>
           </div>

           <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <h4 className="font-black text-slate-800 flex items-center gap-2 mb-4">
                 <Clock size={18} className="text-blue-500" /> Dispatch Metrics
              </h4>
              <div className="space-y-4">
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Avg. Assignment Time</span>
                    <span className="font-bold text-slate-800">12 mins</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Fleet Availability</span>
                    <span className="font-bold text-green-600">84%</span>
                 </div>
                 <div className="w-full bg-slate-100 rounded-full h-2 mt-4">
                    <div className="bg-walmart-blue h-2 rounded-full" style={{ width: '84%' }}></div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogisticsPage;
