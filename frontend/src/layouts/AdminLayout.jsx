import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  LayoutDashboard, 
  Users, 
  PackageSearch, 
  Settings,
  ShieldAlert,
  LogOut,
  ExternalLink,
  Ticket,
  Banknote,
  Truck
} from 'lucide-react';
import { logout } from '@/features/auth/authSlice';
import toast from 'react-hot-toast';

const navItems = [
  { label: 'Overview', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'User Directory', path: '/admin/users', icon: Users },
  { label: 'Product Moderation', path: '/admin/products', icon: PackageSearch },
  { label: 'Order Logistics', path: '/admin/logistics', icon: Truck },
  { label: 'Promo Coupons', path: '/admin/coupons', icon: Ticket },
  { label: 'Financial Payouts', path: '/admin/payouts', icon: Banknote },
  { label: 'Platform Settings', path: '/admin/settings', icon: Settings },
];

const AdminLayout = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Admin session terminated');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans">
      {/* Sidebar - distinct dark teal theme for Admin safety bounds */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col transition-all duration-300 shadow-2xl z-20">
        <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-black/40">
          <span className="text-xl font-bold tracking-widest flex items-center gap-2 text-white">
            <ShieldAlert size={24} className="text-red-500" />
            ADMIN <span className="text-red-500">CORE</span>
          </span>
        </div>

        <nav className="flex-1 py-8 px-4 space-y-1.5 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">Management</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all ${
                    isActive 
                      ? 'bg-red-500/10 text-red-400 shadow-sm border border-red-500/20' 
                      : 'hover:bg-slate-800 hover:text-slate-100'
                  }`
                }
              >
                <Icon size={18} strokeWidth={2.5} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-black/40">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center font-bold text-white shadow-lg">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-[10px] uppercase tracking-widest text-red-400 font-bold">Superuser</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex w-full items-center gap-2 text-sm text-slate-400 hover:text-red-400 p-2 rounded-md hover:bg-slate-800 transition-colors"
          >
            <LogOut size={16} /> Terminate Session
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10">
          <h2 className="text-lg font-bold text-slate-800">System Control</h2>
          <div className="flex items-center gap-4">
             <span className="flex items-center gap-2 text-xs font-medium text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
               System Operational
             </span>
             <a href="/" target="_blank" className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-walmart-blue transition-colors">
               Storefront <ExternalLink size={14} />
             </a>
          </div>
        </header>

        {/* Dynamic Route View */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-[1400px] mx-auto animate-fade-in pb-12">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
