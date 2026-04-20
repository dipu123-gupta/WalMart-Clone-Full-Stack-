import { useEffect, useState } from 'react';
import { 
  Bell, 
  ShoppingBag, 
  Truck, 
  CreditCard, 
  Tag, 
  AlertCircle,
  MailCheck,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import api from '@/services/api';
import { formatDate } from '@/utils/helpers';
import toast from 'react-hot-toast';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.data || []);
      setUnreadCount(data.meta?.unreadCount || 0);
    } catch (err) {
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      toast.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      await api.patch('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All marked as read');
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  const getIcon = (type) => {
    const props = { size: 20 };
    switch (type) {
      case 'order': return <ShoppingBag className="text-blue-500" {...props} />;
      case 'delivery': return <Truck className="text-amber-500" {...props} />;
      case 'payment': return <CreditCard className="text-green-500" {...props} />;
      case 'promotion': return <Tag className="text-purple-500" {...props} />;
      case 'system': return <AlertCircle className="text-red-500" {...props} />;
      default: return <Bell className="text-slate-400" {...props} />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-walmart-blue/10 rounded-2xl flex items-center justify-center">
            <Bell className="text-walmart-blue" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Notifications</h1>
            <p className="text-slate-500 font-medium">Keep track of your orders, payments and updates.</p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button 
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
          >
            <MailCheck size={18} /> Mark all as read
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <span className="loading loading-spinner loading-lg text-walmart-blue"></span>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Syncing your inbox...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-20 flex flex-col items-center text-center px-6">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
               <Bell size={48} className="text-slate-200" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Your inbox is empty</h3>
            <p className="text-slate-500 max-w-sm">When you get notifications about your orders or account, they'll show up here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {notifications.map((n) => (
              <div 
                key={n._id} 
                onClick={() => !n.isRead && markAsRead(n._id)}
                className={`p-6 flex gap-4 transition-all cursor-pointer group relative ${n.isRead ? 'opacity-70 bg-white' : 'bg-blue-50/30'}`}
              >
                {!n.isRead && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-walmart-blue rounded-r-full"></div>
                )}
                <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${n.isRead ? 'bg-slate-50' : 'bg-white shadow-sm'}`}>
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-4 mb-1">
                    <h4 className={`font-bold text-slate-800 ${n.isRead ? '' : 'text-walmart-blue'}`}>
                      {n.title}
                    </h4>
                    <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap uppercase tracking-wider">
                      {formatDate(n.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                    {n.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
