import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Truck, 
  PackageCheck, 
  MapPin, 
  LogOut, 
  Settings,
  Bell,
  Navigation
} from 'lucide-react';
import { logout } from '@/features/auth/authSlice';
import { fetchAgentProfile } from '@/features/delivery/deliverySlice';
import toast from 'react-hot-toast';

const navItems = [
  { label: 'Upcoming Tasks', path: '/delivery/dashboard', icon: Navigation },
  { label: 'Delivery History', path: '/delivery/history', icon: PackageCheck },
  { label: 'Profile Settings', path: '/delivery/settings', icon: Settings },
];

const DeliveryAgentLayout = () => {
  const { user } = useSelector((state) => state.auth);
  const { isAvailable, loading } = useSelector((state) => state.delivery);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchAgentProfile());
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Safe travels! See you later.');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col transition-all duration-300 shadow-2xl z-20">
        <div className="h-20 flex items-center px-6 border-b border-slate-800 bg-slate-950">
          <span className="text-xl font-black text-white flex items-center gap-2">
            <Truck size={28} className="text-walmart-yellow" />
            PARTNER <span className="text-walmart-yellow">HUB</span>
          </span>
        </div>

        <nav className="flex-1 py-8 px-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 rounded-xl font-bold transition-all ${
                    isActive 
                      ? 'bg-walmart-yellow text-slate-900 shadow-lg' 
                      : 'hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <Icon size={20} strokeWidth={2.5} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-black text-white border-2 border-slate-700">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black">Verified Agent</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex w-full items-center gap-2 text-sm text-slate-400 hover:text-red-400 p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
          >
            <LogOut size={16} /> End Shift
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header Ribbon */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 shadow-sm z-10">
          <h2 className="text-lg font-black text-slate-800">
             Shift Status: {isAvailable ? (
               <span className="text-green-600">Online</span>
             ) : (
               <span className="text-slate-400">Offline</span>
             )}
          </h2>
          <div className="flex items-center gap-5">
            <button className="relative p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-2 w-2 h-2 bg-amber-500 rounded-full"></span>
            </button>
            <div className="flex flex-col items-end">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Availability</span>
                <div className="flex items-center gap-2">
                   <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                   <span className="text-xs font-bold text-slate-700">
                     {isAvailable ? 'Ready for Duty' : 'On Break'}
                   </span>
                </div>
            </div>
          </div>
        </header>

        {/* Dynamic Route View */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default DeliveryAgentLayout;
