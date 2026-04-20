import { useEffect, useState } from 'react';
import { Package, Truck, CheckCircle, Search } from 'lucide-react';
import api from '@/services/api';
import { formatCurrency, formatDate } from '@/utils/helpers';
import toast from 'react-hot-toast';

const SellerOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(o => 
    o._id.toLowerCase().includes(search.toLowerCase()) || 
    o.orderNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const fetchOrders = async () => {
    try {
      const res = await api.get('/seller/orders');
      setOrders(res.data?.data || []);
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.patch(`/seller/orders/${orderId}/status`, { status: newStatus });
      setOrders((prev) => 
        prev.map(o => o._id === orderId ? { ...o, orderStatus: newStatus } : o)
      );
      toast.success(`Order marked as ${newStatus}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      pending: 'bg-amber-100 text-amber-700',
      confirmed: 'bg-sky-100 text-sky-700',
      processing: 'bg-blue-100 text-blue-700',
      shipped: 'bg-purple-100 text-purple-700',
      out_for_delivery: 'bg-orange-100 text-orange-700',
      delivered: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return <span className={`px-2.5 py-1 text-xs rounded-full font-medium capitalize ${map[status] || 'bg-slate-100 text-slate-700'}`}>{status?.replace(/_/g, ' ')}</span>;
  };

  const renderActionButtons = (order) => {
    if (order.orderStatus === 'pending') {
      return <button onClick={() => updateOrderStatus(order._id, 'processing')} className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 border border-blue-200">Accept & Process</button>;
    }
    if (order.orderStatus === 'processing') {
      return <button onClick={() => updateOrderStatus(order._id, 'shipped')} className="text-xs px-3 py-1.5 bg-purple-50 text-purple-600 rounded-md hover:bg-purple-100 border border-purple-200"><Truck size={14} className="inline mr-1" /> Ship Item</button>;
    }
    if (order.orderStatus === 'shipped') {
      return <button onClick={() => updateOrderStatus(order._id, 'delivered')} className="text-xs px-3 py-1.5 bg-green-50 text-green-600 rounded-md hover:bg-green-100 border border-green-200"><CheckCircle size={14} className="inline mr-1" /> Mark Delivered</button>;
    }
    return <span className="text-xs text-slate-400">Completed</span>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Order Management</h1>
          <p className="text-slate-500 mt-1">Fulfill incoming orders and track shipments.</p>
        </div>
        <div className="relative">
           <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
           <input 
            type="text" 
            placeholder="Search order ID..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-full text-sm w-64 focus:outline-none focus:ring-2 focus:ring-walmart-blue/20 focus:border-walmart-blue" 
           />
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Items</th>
                <th className="px-6 py-4">Total Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    <span className="loading loading-spinner loading-md"></span>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    <Package size={40} className="mx-auto mb-3 opacity-20" />
                    <p>No orders matching your search.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-600">
                      #{order._id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4">
                      {order.items?.length || 0} items
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">
                      {formatCurrency(order.pricing?.total)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(order.orderStatus)}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2 items-center">
                        {renderActionButtons(order)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SellerOrdersPage;
