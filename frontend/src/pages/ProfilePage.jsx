import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getProfile } from '@/features/auth/authSlice';
import api from '@/services/api';
import { User, Mail, Phone, Camera, MapPin, Package, Heart, Edit3, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '' });

  // Address State
  const [addresses, setAddresses] = useState([]);
  const [loadingAddress, setLoadingAddress] = useState(true);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({ 
    fullName: '', phone: '', addressLine1: '', city: '', state: '', pincode: '' 
  });

  useEffect(() => {
    if (user) {
      setForm({ firstName: user.firstName, lastName: user.lastName, phone: user.phone || '' });
      fetchAddresses();
    }
  }, [user]);

  const fetchAddresses = async () => {
    try {
      const { data } = await api.get('/users/me/addresses');
      setAddresses(data.data || []);
    } catch (err) { } finally { setLoadingAddress(false); }
  };

  const handleAddAddress = async () => {
    try {
      const { data } = await api.post('/users/me/addresses', addressForm);
      setAddresses([...addresses, data.data]);
      setShowAddAddress(false);
      setAddressForm({ fullName: '', phone: '', addressLine1: '', city: '', state: '', pincode: '' });
      toast.success('Address added');
    } catch (err) {
      toast.error('Failed to add address');
    }
  };

  const deleteAddress = async (id) => {
    if(!confirm('Delete this address?')) return;
    try {
      await api.delete(`/users/me/addresses/${id}`);
      setAddresses(addresses.filter(a => a._id !== id));
      toast.success('Address removed');
    } catch (err) {
      toast.error('Failed to delete address');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.patch('/users/me', form);
      dispatch(getProfile());
      setIsEditing(false);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      await api.patch('/users/me/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      dispatch(getProfile());
      toast.success('Avatar updated');
    } catch (err) {
      toast.error('Upload failed');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>

      <div className="bg-white rounded-2xl border p-6 sm:p-8">
        {/* Avatar */}
        <div className="flex items-center gap-5 mb-8 pb-6 border-b">
          <div className="relative group">
            {user?.avatar?.url ? (
              <img src={user.avatar.url} alt="" className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-walmart-blue to-blue-400 flex items-center justify-center text-2xl font-bold text-white">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
            )}
            <label className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera size={20} className="text-white" />
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </label>
          </div>
          <div>
            <h2 className="text-xl font-bold">{user?.firstName} {user?.lastName}</h2>
            <p className="text-gray-500 text-sm">{user?.email}</p>
            <span className="text-xs bg-walmart-blue/10 text-walmart-blue px-2 py-0.5 rounded-full capitalize mt-1 inline-block">{user?.role}</span>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">First Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} disabled={!isEditing} className="input-primary pl-10 disabled:bg-gray-50" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Last Name</label>
              <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} disabled={!isEditing} className="input-primary disabled:bg-gray-50" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={user?.email || ''} disabled className="input-primary pl-10 bg-gray-50" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Phone</label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} disabled={!isEditing} className="input-primary pl-10 disabled:bg-gray-50" placeholder="Not provided" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            {isEditing ? (
              <>
                <button type="submit" className="btn-walmart flex items-center gap-2"><Save size={16} /> Save Changes</button>
                <button type="button" onClick={() => setIsEditing(false)} className="px-5 py-2 border rounded-full text-sm font-medium hover:bg-gray-50">Cancel</button>
              </>
            ) : (
              <button type="button" onClick={() => setIsEditing(true)} className="btn-walmart flex items-center gap-2"><Edit3 size={16} /> Edit Profile</button>
            )}
          </div>
        </form>
        {/* Address Management Section */}
        <div className="mt-10 pt-10 border-t">
          <div className="flex items-center justify-between mb-6">
             <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800">
               <MapPin size={20} className="text-walmart-blue" /> Saved Addresses
             </h3>
             <button 
               onClick={() => setShowAddAddress(!showAddAddress)}
               className="text-walmart-blue text-sm font-bold hover:underline py-1 px-3 bg-blue-50 rounded-full"
             >
               + Add New
             </button>
          </div>

          {showAddAddress && (
            <div className="bg-slate-50 p-6 rounded-2xl mb-8 border border-slate-200 animate-fade-in animate-slide-up">
              <h4 className="font-bold mb-4 text-sm">Add New Address</h4>
              <div className="grid grid-cols-2 gap-3">
                 <input placeholder="Full Name" value={addressForm.fullName} onChange={e => setAddressForm({...addressForm, fullName: e.target.value})} className="input-primary bg-white" />
                 <input placeholder="Phone" value={addressForm.phone} onChange={e => setAddressForm({...addressForm, phone: e.target.value})} className="input-primary bg-white" />
                 <input placeholder="Line 1" value={addressForm.addressLine1} onChange={e => setAddressForm({...addressForm, addressLine1: e.target.value})} className="input-primary bg-white col-span-2" />
                 <input placeholder="City" value={addressForm.city} onChange={e => setAddressForm({...addressForm, city: e.target.value})} className="input-primary bg-white" />
                 <input placeholder="State" value={addressForm.state} onChange={e => setAddressForm({...addressForm, state: e.target.value})} className="input-primary bg-white" />
                 <input placeholder="Pincode" value={addressForm.pincode} onChange={e => setAddressForm({...addressForm, pincode: e.target.value})} className="input-primary bg-white" />
                 <button onClick={handleAddAddress} className="btn-walmart col-span-2 mt-2">Save Address</button>
              </div>
            </div>
          )}

          <div className="space-y-4">
             {loadingAddress ? (
               <div className="flex justify-center p-4"><span className="loading loading-spinner text-walmart-blue"></span></div>
             ) : addresses.length === 0 ? (
               <p className="text-sm text-slate-400 italic text-center py-4">No addresses saved yet.</p>
             ) : (
               addresses.map(addr => (
                 <div key={addr._id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex items-start gap-4 grow">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                      <MapPin size={18} />
                    </div>
                    <div className="flex-1">
                       <p className="font-bold text-sm text-slate-800">{addr.fullName} <span className="font-normal text-slate-500 ml-2">{addr.phone}</span></p>
                       <p className="text-xs text-slate-500 mt-1">{addr.addressLine1}, {addr.city}, {addr.state} - {addr.pincode}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                       {addr.isDefault && <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full uppercase self-end">Default</span>}
                       <button onClick={() => deleteAddress(addr._id)} className="text-[10px] font-bold text-red-500 hover:underline uppercase self-end">Remove</button>
                    </div>
                 </div>
               ))
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
