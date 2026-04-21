import { useEffect, useState } from 'react';
import { 
  User, 
  MapPin, 
  ShieldCheck, 
  Save, 
  Bell,
  Power
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/api';

import { useSelector, useDispatch } from 'react-redux';
import { fetchAgentProfile, toggleAgentAvailability } from '@/features/delivery/deliverySlice';

const DeliverySettingsPage = () => {
  const { profile, isAvailable, loading } = useSelector((state) => state.delivery);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!profile) {
      dispatch(fetchAgentProfile());
    }
  }, [dispatch, profile]);

  const handleToggleAvailability = () => {
    dispatch(toggleAgentAvailability())
      .unwrap()
      .then((data) => {
        toast.success(`Shift status: ${data.isAvailable ? 'Active' : 'Offline'}`);
      })
      .catch((err) => {
        toast.error(err || 'Failed to update availability');
      });
  };

  if (loading) return (
    <div className="flex justify-center p-20">
      <span className="loading loading-spinner loading-lg text-walmart-blue"></span>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in text-left">
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Partner Settings</h1>
          <p className="text-slate-500 font-medium mt-1">Manage your active status and vehicle documentation.</p>
        </div>
        <button 
          onClick={handleToggleAvailability}
          className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-slate-200 ${
            profile?.isAvailable 
              ? 'bg-green-600 text-white hover:bg-green-700' 
              : 'bg-slate-900 text-white hover:bg-black'
          }`}
        >
          <Power size={20} />
          {profile?.isAvailable ? 'Shift: Active' : 'Shift: Offline'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm text-center">
              <div className="w-24 h-24 rounded-full bg-slate-100 mx-auto mb-4 border-4 border-slate-50 flex items-center justify-center overflow-hidden">
                 {profile?.userId?.avatar ? (
                   <img src={profile.userId.avatar} alt="" className="w-full h-full object-cover" />
                 ) : (
                   <User size={40} className="text-slate-300" />
                 )}
              </div>
              <h3 className="text-xl font-black text-slate-800">{profile?.userId?.firstName} {profile?.userId?.lastName}</h3>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Verified Partner</p>
              <div className="mt-6 pt-6 border-t border-slate-100 flex justify-between text-left">
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Deliveries</p>
                    <p className="text-xl font-black text-slate-800">{profile?.totalDeliveries || 0}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rating</p>
                    <p className="text-xl font-black text-slate-800">4.8 ★</p>
                 </div>
              </div>
           </div>

           <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                 <ShieldCheck className="text-walmart-yellow" size={24} />
                 <h4 className="font-black uppercase tracking-tight">System Status</h4>
              </div>
              <div className="space-y-4">
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400 font-bold">App Version</span>
                    <span className="font-black">v2.4.0</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400 font-bold">GPS Signal</span>
                    <span className="text-green-400 font-black flex items-center gap-2">
                       <MapPin size={14} /> Strong
                    </span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400 font-bold">Payout Status</span>
                    <span className="text-blue-400 font-black">Daily Cycle</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Configuration Tabs */}
        <div className="lg:col-span-2">
           <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
                 <div className="flex items-center gap-3">
                    <Bell className="text-slate-400" size={20} />
                    <h3 className="font-black text-slate-800 uppercase tracking-tight">Notification Settings</h3>
                 </div>
              </div>
              <div className="p-8 space-y-6">
                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <div>
                       <p className="font-bold text-slate-800">Order Alerts</p>
                       <p className="text-xs text-slate-500">Get notified when new orders are assigned to you.</p>
                    </div>
                    <input type="checkbox" defaultChecked className="toggle toggle-info bg-white" />
                 </div>
                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <div>
                       <p className="font-bold text-slate-800">Status Updates</p>
                       <p className="text-xs text-slate-500">Notification when store confirms pickup readiness.</p>
                    </div>
                    <input type="checkbox" defaultChecked className="toggle toggle-info bg-white" />
                 </div>
                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl opacity-50">
                    <div>
                       <p className="font-bold text-slate-800">Email Summaries</p>
                       <p className="text-xs text-slate-500">Weekly Performance and Earnings report.</p>
                    </div>
                    <input type="checkbox" disabled className="toggle toggle-info bg-white" />
                 </div>
              </div>

              <div className="px-8 py-6 border-t border-slate-100 flex justify-end gap-3">
                 <button className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50">Reset</button>
                 <button className="px-8 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-black uppercase tracking-widest flex items-center gap-2">
                    <Save size={16} /> Save Changes
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DeliverySettingsPage;
