import { useEffect, useState } from 'react';
import { 
  Shield, 
  Trash2, 
  UserX,
  UserCheck,
  Search
} from 'lucide-react';
import api from '@/services/api';
import { formatDate } from '@/utils/helpers';
import toast from 'react-hot-toast';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers(search);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const fetchUsers = async (query = '') => {
    setIsLoading(true);
    try {
      const res = await api.get(`/admin/users?search=${query}`);
      setUsers(res.data?.data?.users || []);
    } catch (err) {
      toast.error('Failed to load user directory');
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
      toast.success(`Role updated to ${newRole}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Role update failed');
    }
  };

  const toggleUserStatus = async (userId, newStatus) => {
    try {
      await api.patch(`/admin/users/${userId}/status`, { isActive: newStatus });
      setUsers(users.map(u => u._id === userId ? { ...u, isActive: newStatus } : u));
      toast.success(`User set to ${newStatus ? 'Active' : 'Suspended'}`);
    } catch (err) {
      toast.error('Status update failed');
    }
  };

  const getRoleBadge = (role) => {
    const map = {
      admin: 'bg-red-100 text-red-700 border-red-200',
      seller: 'bg-purple-100 text-purple-700 border-purple-200',
      customer: 'bg-blue-100 text-blue-700 border-blue-200',
    };
    return (
      <span className={`px-2.5 py-1 text-xs rounded-full font-bold uppercase tracking-wider border ${map[role] || 'bg-slate-100'}`}>
        {role}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">User Directory</h1>
          <p className="text-slate-500 mt-1">Manage platform accounts and administrative privileges.</p>
        </div>
        <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search users by email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-full text-sm w-72 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500" 
            />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Joined Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    <span className="loading loading-spinner text-red-500 loading-md"></span>
                  </td>
                </tr>
              ) : users.map((user) => (
                <tr key={user._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${user.role === 'admin' ? 'bg-red-500' : user.role === 'seller' ? 'bg-purple-500' : 'bg-slate-400'}`}>
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <span className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                       <span className={`text-xs font-semibold ${user.isActive ? 'text-green-600' : 'text-slate-500'}`}>
                         {user.isActive ? 'Active' : 'Suspended'}
                       </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      {user.role !== 'admin' && (
                        <div className="dropdown dropdown-end">
                          <div tabIndex={0} role="button" className="p-2 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border">
                            <Shield size={16} />
                          </div>
                          <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-xl bg-base-100 rounded-box w-40 border mt-1">
                            {user.role !== 'customer' && <li onClick={() => updateUserRole(user._id, 'customer')}><a>Demote to Customer</a></li>}
                            {user.role !== 'seller' && <li onClick={() => updateUserRole(user._id, 'seller')}><a>Promote to Seller</a></li>}
                            <li className="text-red-500" onClick={() => updateUserRole(user._id, 'admin')}><a>Make Admin</a></li>
                          </ul>
                        </div>
                      )}
                      
                      <button 
                        onClick={() => toggleUserStatus(user._id, !user.isActive)} 
                        className={`p-2 rounded-lg transition-colors border ${user.isActive ? 'text-orange-500 bg-orange-50 hover:bg-orange-100 border-orange-100' : 'text-green-600 bg-green-50 hover:bg-green-100 border-green-100'}`}
                        title={user.isActive ? "Suspend User" : "Reactivate User"}
                      >
                        {user.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                      </button>

                      <button className="p-2 text-red-500 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsersPage;
