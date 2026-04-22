import { useEffect, useState } from 'react';
import { 
  Settings, 
  Globe, 
  Shield, 
  Bell, 
  CreditCard, 
  Hash, 
  Link as LinkIcon,
  Save,
  Palette,
  Layout
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/api';

const AdminSettingsPage = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState({
    site_name: 'WalMart Clone',
    support_email: 'support@walmart.com',
    site_description: ''
  });

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data } = await api.get('/admin/settings');
        setConfig(prev => ({ ...prev, ...data.data }));
      } catch (err) {
        console.error('Failed to load platform settings');
      } finally {
        setIsLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.patch('/admin/settings', config);
      toast.success('Platform settings updated successfully');
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'payment', label: 'Payments', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="space-y-8 animate-fade-in text-left">
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Platform Settings</h1>
          <p className="text-slate-500 font-medium mt-1">Manage global configurations and site-wide preferences.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="btn-walmart px-8 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-blue-200"
        >
          {isSaving ? <span className="loading loading-spinner loading-sm"></span> : <Save size={18} />}
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="space-y-2 lg:col-span-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-3xl transition-all font-bold text-sm ${
                activeTab === tab.id 
                  ? 'bg-slate-900 text-white shadow-xl shadow-slate-200 translate-x-2' 
                  : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200 lg:border-transparent lg:hover:border-slate-200'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
             {activeTab === 'general' && (
               <div className="space-y-8 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-3">
                        <label className="text-sm font-black text-slate-800 flex items-center gap-2">
                           <Layout size={16} className="text-blue-500" /> Platform Name
                        </label>
                        <input 
                          type="text" 
                          value={config.site_name || ''}
                          onChange={(e) => setConfig({...config, site_name: e.target.value})}
                          className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-blue-500 focus:bg-white outline-none font-bold text-slate-700 transition-all"
                        />
                     </div>
                     <div className="space-y-3">
                        <label className="text-sm font-black text-slate-800 flex items-center gap-2">
                           <Globe size={16} className="text-green-500" /> Support Email
                        </label>
                        <input 
                          type="email" 
                          value={config.support_email || ''}
                          onChange={(e) => setConfig({...config, support_email: e.target.value})}
                          className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-blue-500 focus:bg-white outline-none font-bold text-slate-700 transition-all"
                        />
                     </div>
                  </div>

                  <div className="space-y-3">
                     <label className="text-sm font-black text-slate-800 flex items-center gap-2">
                        <Hash size={16} className="text-purple-500" /> Site Meta Description
                     </label>
                     <textarea 
                        rows="3"
                        value={config.site_description || ''}
                        onChange={(e) => setConfig({...config, site_description: e.target.value})}
                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-blue-500 focus:bg-white outline-none font-bold text-slate-700 transition-all resize-none"
                     />
                  </div>
               </div>
             )}

             {activeTab === 'appearance' && (
               <div className="space-y-8 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     {['Modern Blue', 'Classic Dark', 'Sunset Gold'].map((theme, i) => (
                       <div 
                        key={theme} 
                        onClick={() => setConfig({...config, active_theme: theme.toLowerCase().replace(' ', '_')})}
                        className={`p-6 rounded-3xl border-2 cursor-pointer transition-all ${config.active_theme === theme.toLowerCase().replace(' ', '_') ? 'border-walmart-blue bg-blue-50' : 'border-slate-100 hover:border-slate-200'}`}
                       >
                          <div className={`w-full h-24 rounded-2xl mb-4 ${i === 0 ? 'bg-walmart-blue shadow-lg shadow-blue-200' : i === 1 ? 'bg-slate-800 shadow-lg shadow-slate-300' : 'bg-orange-400 shadow-lg shadow-orange-200'}`}></div>
                          <p className="font-black text-slate-800 text-center text-sm">{theme}</p>
                       </div>
                     ))}
                  </div>
               </div>
             )}

             {activeTab === 'payment' && (
               <div className="space-y-8 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 space-y-4">
                        <div className="flex justify-between items-center">
                           <h3 className="font-black text-slate-800">Razorpay Payment</h3>
                           <input 
                              type="checkbox" 
                              checked={config.razorpay_enabled === 'true'}
                              onChange={(e) => setConfig({...config, razorpay_enabled: e.target.checked ? 'true' : 'false'})}
                              className="toggle toggle-info toggle-sm" 
                           />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Key ID</label>
                           <input 
                              type="text" 
                              value={config.razorpay_key_id || ''}
                              onChange={(e) => setConfig({...config, razorpay_key_id: e.target.value})}
                              className="w-full px-4 py-2 text-sm rounded-xl border border-slate-200 outline-none focus:border-blue-500" 
                              placeholder="rzp_test_..."
                           />
                        </div>
                     </div>

                     <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 space-y-4">
                        <div className="flex justify-between items-center">
                           <h3 className="font-black text-slate-800">Cash on Delivery</h3>
                           <input 
                              type="checkbox" 
                              checked={config.cod_enabled === 'true'}
                              onChange={(e) => setConfig({...config, cod_enabled: e.target.checked ? 'true' : 'false'})}
                              className="toggle toggle-success toggle-sm" 
                           />
                        </div>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                           Allow customers to pay with cash upon delivery. We recommend only enabling for specific pin codes.
                        </p>
                     </div>
                  </div>
               </div>
             )}

             {activeTab === 'notifications' && (
               <div className="space-y-6 animate-fade-in">
                  {[
                     { id: 'welcome_email', label: 'Welcome Email', desc: 'Send a greetings email to newly registered users.' },
                     { id: 'order_updates', label: 'Order Notifications', desc: 'Notify users about status changes in their orders.' },
                     { id: 'price_alerts', label: 'Price Drop Alerts', desc: 'Automatic notification if a wishlist item drops in price.' }
                  ].map(notify => (
                     <div key={notify.id} className="flex items-center justify-between p-6 bg-white border border-slate-100 rounded-3xl hover:shadow-md transition-all">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500">
                              <Bell size={20} />
                           </div>
                           <div>
                              <p className="font-black text-slate-800">{notify.label}</p>
                              <p className="text-xs text-slate-500 font-medium">{notify.desc}</p>
                           </div>
                        </div>
                        <input 
                           type="checkbox" 
                           checked={config[notify.id] === 'true'}
                           onChange={(e) => setConfig({...config, [notify.id]: e.target.checked ? 'true' : 'false'})}
                           className="toggle toggle-primary" 
                        />
                     </div>
                  ))}
               </div>
             )}

             {activeTab === 'security' && (
               <div className="space-y-8 animate-fade-in">
                  <div className="p-8 rounded-[2.5rem] bg-red-50 border border-red-100 space-y-6">
                     <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-3xl bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-200">
                           <Shield size={28} />
                        </div>
                        <div>
                           <h3 className="text-lg font-black text-slate-800">Critical Access Controls</h3>
                           <p className="text-sm text-slate-500 font-bold">Manage high-level platform safety and access.</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                           <div className="flex justify-between items-center mb-2">
                              <p className="font-black text-slate-800 text-sm">Maintenance Mode</p>
                              <input 
                                 type="checkbox" 
                                 checked={config.maintenance_mode === 'true'}
                                 onChange={(e) => setConfig({...config, maintenance_mode: e.target.checked ? 'true' : 'false'})}
                                 className="toggle toggle-error toggle-sm" 
                              />
                           </div>
                           <p className="text-[10px] text-slate-400 font-bold leading-tight">Restrict store access to admins only. Useful for updates.</p>
                        </div>

                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                           <div className="flex justify-between items-center mb-2">
                              <p className="font-black text-slate-800 text-sm">Public Signups</p>
                              <input 
                                 type="checkbox" 
                                 checked={config.public_signups === 'true'}
                                 onChange={(e) => setConfig({...config, public_signups: e.target.checked ? 'true' : 'false'})}
                                 className="toggle toggle-success toggle-sm" 
                              />
                           </div>
                           <p className="text-[10px] text-slate-400 font-bold leading-tight">Allow new users to create accounts without an invitation.</p>
                        </div>
                     </div>
                  </div>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
