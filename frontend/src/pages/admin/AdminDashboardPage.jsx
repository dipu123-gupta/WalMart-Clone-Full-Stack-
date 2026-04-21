import { useEffect, useState } from 'react';
import { 
  Users, 
  ShoppingCart, 
  Activity, 
  Globe,
  PackageSearch
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import api from '@/services/api';
import { formatCurrency } from '@/utils/helpers';

const StatCard = ({ title, value, subtext, icon: Icon }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-red-200 transition-colors">
    <div className="absolute -right-6 -top-6 text-slate-50 group-hover:text-red-50 transition-colors">
      <Icon size={120} />
    </div>
    <div className="relative z-10">
      <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-2">{title}</p>
      <h3 className="text-3xl font-black text-slate-800 tracking-tight">{value}</h3>
      <p className="text-xs text-slate-400 mt-2 font-medium">{subtext}</p>
    </div>
  </div>
);

const AdminDashboardPage = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    platformProfit: 0,
  });

  const [trafficData, setTrafficData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overviewRes, revenueRes] = await Promise.all([
          api.get('/admin/analytics/overview'),
          api.get('/admin/analytics/revenue?period=7d')
        ]);
        
        const overview = overviewRes.data?.data || {};
        setStats({
          totalUsers: overview.totalUsers || 0,
          totalOrders: overview.totalOrders || 0,
          totalRevenue: overview.totalRevenue || 0,
          totalProducts: overview.totalProducts || 0,
          platformProfit: overview.platformProfit || 0,
        });

        // Map revenue analytics to chart
        const revData = (revenueRes.data?.data || []).map(item => ({
          name: new Date(item._id).toLocaleDateString('en-US', { weekday: 'short' }),
          orders: item.orders,
          revenue: Math.round(item.revenue)
        }));
        setTrafficData(revData);
      } catch (err) {
        console.error("Admin dashboard stats error", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return <div className="flex justify-center py-20"><span className="loading loading-spinner loading-lg text-red-500"></span></div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Platform Overview</h1>
        <p className="text-slate-500 font-medium mt-1">Aggregated metrics and system health monitoring.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Platform Net Profit" 
          value={formatCurrency(stats.platformProfit)} 
          subtext="Net earnings from commissions"
          icon={Activity}
        />
        <StatCard 
          title="Registered Users" 
          value={stats.totalUsers.toLocaleString()} 
          subtext="Buyers, Sellers, Agents, Admins"
          icon={Users}
        />
        <StatCard 
          title="Active Products" 
          value={stats.totalProducts.toLocaleString()} 
          subtext="Live on platform"
          icon={PackageSearch || ShoppingCart}
        />
        <StatCard 
          title="Total Orders" 
          value={stats.totalOrders.toLocaleString()} 
          subtext="Executed through the ecosystem"
          icon={ShoppingCart}
        />
        <StatCard 
          title="Platform Uptime" 
          value="99.99%" 
          subtext="Trailing 30 days"
          icon={Globe}
        />
      </div>

      {/* Analytics Graph */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm mt-8">
        <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-800">Traffic & Conversion Vectors</h3>
            <p className="text-sm text-slate-500">User acquisition against total orders confirmed.</p>
        </div>
        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={trafficData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontWeight: 500 }} dy={10} />
              <YAxis yAxisId="left" orientation="left" stroke="#0071dc" axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
              <YAxis yAxisId="right" orientation="right" stroke="#ef4444" axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar yAxisId="left" dataKey="revenue" name="Revenue (₹)" fill="#0071dc" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar yAxisId="right" dataKey="orders" name="Total Orders" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
