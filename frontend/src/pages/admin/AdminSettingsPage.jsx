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
                          value={config.site_name}
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
                          value={config.support_email}
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
                        value={config.site_description}
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
                       <div key={theme} className={`p-6 rounded-3xl border-2 cursor-pointer transition-all ${i === 0 ? 'border-walmart-blue bg-blue-50' : 'border-slate-100 hover:border-slate-200'}`}>
                          <div className={`w-full h-24 rounded-2xl mb-4 ${i === 0 ? 'bg-walmart-blue' : i === 1 ? 'bg-slate-800' : 'bg-orange-400'}`}></div>
                          <p className="font-black text-slate-800 text-center text-sm">{theme}</p>
                       </div>
                     ))}
                  </div>
               </div>
             )}

             {activeTab !== 'general' && activeTab !== 'appearance' && (
                <div className="flex flex-col items-center justify-center py-20 opacity-40">
                   <Shield size={64} className="mb-4" />
                   <p className="font-black text-lg text-slate-800">Module is currently active.</p>
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
