import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, 
  ShoppingBag, 
  TrendingUp, 
  AlertCircle,
  Package 
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import api from '../../services/api';
import { formatCurrency } from '../../utils/helpers';

const StatCard = ({ title, value, subtext, icon: Icon, trend }) => (
  <div className="bg-white p-6 rounded-2xl border shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg ${trend === 'up' ? 'bg-green-100 text-green-600' : trend === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
        <Icon size={24} />
      </div>
    </div>
    <div className="flex items-center text-sm">
      <TrendingUp size={16} className={`mr-1 ${trend === 'up' ? 'text-green-500' : 'text-slate-400'}`} />
      <span className={trend === 'up' ? 'text-green-500 font-medium' : 'text-slate-500'}>{subtext}</span>
    </div>
  </div>
);

const SellerDashboardPage = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeOrders: 0,
    totalProducts: 0,
    lowStock: 0,
  });
  
  const [revenueData, setRevenueData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardState = async () => {
      try {
        const [dashRes, analyticsRes] = await Promise.all([
          api.get('/seller/dashboard'),
          api.get('/seller/analytics?period=7d')
        ]);
        
        const dashData = dashRes.data?.data || {};
        setStats({
          totalRevenue: dashData.stats?.totalRevenue || 0,
          activeOrders: dashData.stats?.totalOrders || 0,
          totalProducts: dashData.stats?.totalProducts || 0,
          lowStock: dashData.stats?.lowStock || 0,
          lowStockProducts: dashData.stats?.lowStockProducts || [],
        });

        const revData = (analyticsRes.data?.data || []).map(item => ({
          name: new Date(item._id).toLocaleDateString('en-US', { weekday: 'short' }),
          revenue: Math.round(item.revenue)
        }));

        setRevenueData(revData.length > 0 ? revData : [
          { name: 'Mon', revenue: 0 },
          { name: 'Tue', revenue: 0 },
          { name: 'Wed', revenue: 0 },
          { name: 'Thu', revenue: 0 },
          { name: 'Fri', revenue: 0 },
          { name: 'Sat', revenue: 0 },
          { name: 'Sun', revenue: 0 },
        ]);
      } catch (err) {
        console.error("Dashboard mount error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardState();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg text-walmart-blue"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Store Overview</h1>
          <p className="text-slate-500 mt-1">Here's what is happening with your store today.</p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Revenue (All Time)" 
          value={formatCurrency(stats.totalRevenue)} 
          subtext="Net proceeds"
          icon={DollarSign}
          trend="up"
        />
        <StatCard 
          title="Total Orders" 
          value={stats.activeOrders} 
          subtext="Includes all history"
          icon={ShoppingBag}
          trend="neutral"
        />
        <StatCard 
          title="Total Products" 
          value={stats.totalProducts} 
          subtext="Live on store"
          icon={Package}
          trend="neutral"
        />
        <StatCard 
          title="Low Stock Alerts" 
          value={stats.lowStock} 
          subtext="Update inventory"
          icon={AlertCircle}
          trend="warning"
        />
      </div>

      {/* Analytics Chart */}
      <div className="bg-white p-6 rounded-2xl border shadow-sm mt-8">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Revenue Trend (Last 7 Days)</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0071dc" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0071dc" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} dx={-10} tickFormatter={(val) => `₹${val/1000}k`} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value) => [formatCurrency(value), 'Revenue']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#0071dc" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Actionable Low Stock List */}
      <div className="bg-white rounded-2xl border shadow-sm p-6 overflow-hidden">
         <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
               <AlertCircle className="text-red-500" /> Action Required: Low Stock
            </h3>
            <Link to="/seller/products" className="text-walmart-blue text-xs font-black uppercase hover:underline">Manage All Inventory</Link>
         </div>
         
         <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
               <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                  <tr>
                     <th className="px-4 py-3">Product Name</th>
                     <th className="px-4 py-3 text-center">In Stock</th>
                     <th className="px-4 py-3 text-center">Status</th>
                     <th className="px-4 py-3 text-right">Action</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {stats.lowStockProducts?.length > 0 ? stats.lowStockProducts.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50/50 transition-colors">
                       <td className="px-4 py-3 font-semibold text-slate-800">{p.name}</td>
                       <td className="px-4 py-3 text-center font-bold text-red-500">{p.inventory?.quantity}</td>
                       <td className="px-4 py-3 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-black uppercase">Low</span>
                       </td>
                       <td className="px-4 py-3 text-right">
                          <Link to={`/seller/products`} className="text-walmart-blue hover:underline font-bold text-xs">Update</Link>
                       </td>
                    </tr>
                  )) : (
                    <tr>
                       <td colSpan="4" className="px-4 py-12 text-center text-slate-400">
                          <Package className="mx-auto mb-2 opacity-20" size={32} />
                          All products are sufficiently stocked.
                       </td>
                    </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default SellerDashboardPage;
