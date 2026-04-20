import { useEffect, useState } from 'react';
import { 
  Store, 
  MapPin, 
  CreditCard, 
  Save, 
  ShieldCheck, 
  Truck
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/api';

const SellerSettingsPage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    storeName: '',
    description: '',
    supportEmail: '',
    payoutDetails: {
      accountName: '',
      accountNumber: '',
      ifscCode: ''
    }
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/seller/profile');
        setSettings({
          storeName: data.data.storeName || '',
          description: data.data.description || '',
          supportEmail: data.data.supportEmail || '',
          payoutDetails: data.data.payoutDetails || {
            accountName: '',
            accountNumber: '',
            ifscCode: ''
          }
        });
      } catch (err) {
        console.error('Failed to load seller settings');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.patch('/seller/profile', settings);
      toast.success('Store settings updated successfully');
    } catch (err) {
      toast.error('Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Store Profile', icon: Store },
    { id: 'business', label: 'Business Details', icon: ShieldCheck },
    { id: 'payout', label: 'Payout Settings', icon: CreditCard },
    { id: 'shipping', label: 'Shipping & Returns', icon: Truck },
  ];

  if (isLoading) return (
    <div className="flex items-center justify-center py-40">
      <span className="loading loading-spinner loading-lg text-walmart-blue"></span>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in text-left">
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Store Settings</h1>
          <p className="text-slate-500 font-medium mt-1">Manage your storefront presence, billing, and operational policies.</p>
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
        {/* Navigation Sidebar */}
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

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
             {activeTab === 'profile' && (
               <div className="space-y-8 animate-fade-in">
                  <div className="flex items-center gap-6 pb-8 border-b border-slate-100">
                     <div className="w-24 h-24 rounded-[2rem] bg-blue-50 border-2 border-dashed border-walmart-blue flex items-center justify-center text-walmart-blue cursor-pointer hover:bg-blue-100 transition-colors">
                        <Store size={32} />
                     </div>
                     <div>
                        <h3 className="font-bold text-lg text-slate-800">Store Logo</h3>
                        <p className="text-slate-500 text-sm mb-3">500x500px recommended. Max 2MB.</p>
                        <button className="px-5 py-2 rounded-xl bg-slate-100 text-sm font-bold text-slate-700 hover:bg-slate-200">Upload Image</button>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-3">
                        <label className="text-sm font-black text-slate-800 flex items-center gap-2">
                           Store Name
                        </label>
                        <input 
                          type="text" 
                          value={settings.storeName}
                          onChange={(e) => setSettings({...settings, storeName: e.target.value})}
                          className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-blue-500 focus:bg-white outline-none font-bold text-slate-700 transition-all"
                        />
                     </div>
                     <div className="space-y-3">
                        <label className="text-sm font-black text-slate-800 flex items-center gap-2">
                           Customer Support Email
                        </label>
                        <input 
                          type="email" 
                          value={settings.supportEmail}
                          onChange={(e) => setSettings({...settings, supportEmail: e.target.value})}
                          className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-blue-500 focus:bg-white outline-none font-bold text-slate-700 transition-all"
                        />
                     </div>
                  </div>

                  <div className="space-y-3">
                     <label className="text-sm font-black text-slate-800 flex items-center gap-2">
                        Store Description
                     </label>
                     <textarea 
                        rows="4"
                        value={settings.description}
                        onChange={(e) => setSettings({...settings, description: e.target.value})}
                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-blue-500 focus:bg-white outline-none font-bold text-slate-700 transition-all resize-none"
                     />
                  </div>
               </div>
             )}

             {activeTab === 'payout' && (
               <div className="space-y-8 animate-fade-in">
                  <div className="p-6 rounded-[2rem] bg-blue-50/50 flex flex-col md:flex-row items-start md:items-center justify-between border border-blue-100 mb-8">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-walmart-blue flex items-center justify-center text-white">
                           <ShieldCheck size={20} />
                        </div>
                        <div>
                           <h4 className="font-bold text-slate-800">Escrow Security</h4>
                           <p className="text-slate-500 text-sm">Payouts are disbursed securely through Razorpay Route.</p>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-3">
                        <label className="text-sm font-black text-slate-800 flex items-center gap-2">
                           Beneficiary Name
                        </label>
                        <input 
                          type="text" 
                          value={settings.payoutDetails.accountName}
                          onChange={(e) => setSettings({
                            ...settings, 
                            payoutDetails: { ...settings.payoutDetails, accountName: e.target.value }
                          })}
                          placeholder="Name on bank account"
                          className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-blue-500 focus:bg-white outline-none font-bold text-slate-700 transition-all"
                        />
                     </div>
                     <div className="space-y-3">
                        <label className="text-sm font-black text-slate-800 flex items-center gap-2">
                           Account Number
                        </label>
                        <input 
                          type="text" 
                          value={settings.payoutDetails.accountNumber}
                          onChange={(e) => setSettings({
                            ...settings, 
                            payoutDetails: { ...settings.payoutDetails, accountNumber: e.target.value }
                          })}
                          placeholder="Account Number"
                          className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-blue-500 focus:bg-white outline-none font-bold text-slate-700 transition-all"
                        />
                     </div>
                     <div className="space-y-3">
                        <label className="text-sm font-black text-slate-800 flex items-center gap-2">
                           IFSC Code
                        </label>
                        <input 
                          type="text" 
                          value={settings.payoutDetails.ifscCode}
                          onChange={(e) => setSettings({
                            ...settings, 
                            payoutDetails: { ...settings.payoutDetails, ifscCode: e.target.value }
                          })}
                          placeholder="e.g. HDFC0001234"
                          className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-blue-500 focus:bg-white outline-none font-bold text-slate-700 transition-all uppercase"
                        />
                     </div>
                  </div>
               </div>
             )}

             {activeTab !== 'profile' && activeTab !== 'payout' && (
                <div className="flex flex-col items-center justify-center py-20 opacity-50">
                   <ShieldCheck size={64} className="mb-4 text-slate-300" />
                   <p className="font-black text-lg text-slate-700">Settings module is active.</p>
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerSettingsPage;
