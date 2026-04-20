import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchOrders } from '@/features/orders/orderSlice';
import { Package, ChevronRight, Clock, CheckCircle, XCircle, Truck } from 'lucide-react';

const statusConfig = {
  pending: { color: 'bg-yellow-100 text-yellow-700', icon: <Clock size={14} /> },
  confirmed: { color: 'bg-blue-100 text-blue-700', icon: <CheckCircle size={14} /> },
  processing: { color: 'bg-indigo-100 text-indigo-700', icon: <Package size={14} /> },
  shipped: { color: 'bg-purple-100 text-purple-700', icon: <Truck size={14} /> },
  delivered: { color: 'bg-green-100 text-green-700', icon: <CheckCircle size={14} /> },
  cancelled: { color: 'bg-red-100 text-red-700', icon: <XCircle size={14} /> },
};

const OrdersPage = () => {
  const dispatch = useDispatch();
  const { items: orders, isLoading } = useSelector((state) => state.orders);

  useEffect(() => {
    dispatch(fetchOrders({ sort: 'createdAt:desc' }));
  }, [dispatch]);

  if (!isLoading && (!orders || orders.length === 0)) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
          <Package size={40} className="text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2">No orders yet</h2>
        <p className="text-gray-500 mb-6">Start shopping to see your orders here</p>
        <Link to="/products" className="btn-walmart inline-flex items-center gap-2">
          Browse Products <ChevronRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>

      {isLoading ? (
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border">
              <div className="h-4 w-32 shimmer rounded mb-3"></div>
              <div className="h-6 w-48 shimmer rounded mb-2"></div>
              <div className="h-4 w-24 shimmer rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const sc = statusConfig[order.orderStatus] || statusConfig.pending;
            return (
              <Link
                key={order._id}
                to={`/orders/${order._id}`}
                className="block bg-white rounded-2xl p-5 sm:p-6 border hover:border-walmart-blue hover:shadow-md transition-all group"
                id={`order-${order.orderNumber}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="text-xs text-gray-400 font-medium">ORDER #{order.orderNumber}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <span className={`badge-status ${sc.color}`}>
                    {sc.icon} {order.orderStatus}
                  </span>
                </div>

                {/* Items preview */}
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {order.items?.slice(0, 4).map((item, idx) => (
                    <div key={idx} className="w-16 h-16 rounded-lg overflow-hidden bg-gray-50 shrink-0 border">
                      <img src={item.image || 'https://via.placeholder.com/80'} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                  ))}
                  {order.items?.length > 4 && (
                    <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-500 shrink-0">
                      +{order.items.length - 4}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t">
                  <div className="flex items-center gap-4">
                    <p className="font-bold text-lg">₹{order.pricing?.total?.toLocaleString()}</p>
                    {order.orderStatus === 'delivered' && (
                      <button 
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          try {
                            const { default: api } = await import('@/services/api');
                            const res = await api.get(`/orders/${order._id}/invoice`, { responseType: 'blob' });
                            const url = window.URL.createObjectURL(new Blob([res.data]));
                            const link = document.createElement('a');
                            link.href = url;
                            link.setAttribute('download', `Invoice-${order.orderNumber}.pdf`);
                            document.body.appendChild(link);
                            link.click();
                            link.remove();
                          } catch (err) {
                            toast.error('Failed to download invoice');
                          }
                        }}
                        className="text-xs text-walmart-blue hover:underline flex items-center gap-1"
                      >
                        Download Invoice
                      </button>
                    )}
                  </div>
                  <span className="text-sm text-walmart-blue font-medium group-hover:underline flex items-center gap-1">
                    View Details <ChevronRight size={14} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
