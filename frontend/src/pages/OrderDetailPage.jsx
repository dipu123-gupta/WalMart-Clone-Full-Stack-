import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrderById, cancelOrder } from '@/features/orders/orderSlice';
import { 
  Package, 
  MapPin, 
  CreditCard, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Truck, 
  ArrowLeft,
  Download,
  AlertCircle,
  HelpCircle,
  RefreshCcw,
  IndianRupee
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/helpers';
import toast from 'react-hot-toast';

const statusConfig = {
  pending: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: <Clock size={16} /> },
  confirmed: { color: 'bg-sky-100 text-sky-700 border-sky-200', icon: <CheckCircle size={16} /> },
  processing: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <Package size={16} /> },
  shipped: { color: 'bg-purple-100 text-purple-700 border-purple-200', icon: <Truck size={16} /> },
  out_for_delivery: { color: 'bg-orange-100 text-orange-700 border-orange-200', icon: <Truck size={16} /> },
  delivered: { color: 'bg-green-100 text-green-700 border-green-200', icon: <CheckCircle size={16} /> },
  cancelled: { color: 'bg-red-100 text-red-700 border-red-200', icon: <XCircle size={16} /> },
  return_requested: { color: 'bg-pink-100 text-pink-700 border-pink-200', icon: <RefreshCcw size={16} /> },
};

const OrderDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentOrder: order, isLoading } = useSelector((state) => state.orders);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    dispatch(fetchOrderById(id));
  }, [dispatch, id]);

  const handleCancel = async () => {
    if (!cancelReason) return toast.error('Please provide a reason');
    const res = await dispatch(cancelOrder({ id: order._id, reason: cancelReason }));
    if (cancelOrder.fulfilled.match(res)) {
      toast.success('Order cancelled successfully');
      setShowCancelModal(false);
    } else {
      toast.error(res.payload || 'Failed to cancel order');
    }
  };

  const handlePrintInvoice = () => {
    const printContent = document.getElementById('printable-invoice');
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printContent.innerHTML;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload(); // Restore state
  };

  if (isLoading) return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center animate-pulse">
      <div className="h-8 w-64 bg-gray-200 rounded mx-auto mb-8"></div>
      <div className="h-64 bg-gray-100 rounded-3xl mb-8"></div>
    </div>
  );

  if (!order) return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center">
      <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
      <h2 className="text-2xl font-bold">Order Not Found</h2>
      <p className="text-gray-500 mt-2">The order you're looking for doesn't exist or you don't have access.</p>
      <Link to="/orders" className="btn-walmart mt-6 inline-flex items-center gap-2">
        <ArrowLeft size={16} /> Back to My Orders
      </Link>
    </div>
  );

  const sc = statusConfig[order.orderStatus] || statusConfig.pending;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in text-left">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link to="/orders" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">Order #{order.orderNumber}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border flex items-center gap-1.5 ${sc.color}`}>
                {sc.icon} {order.orderStatus.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-sm text-slate-500 font-medium">Placed on {new Date(order.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {order.paymentStatus === 'paid' && (
            <button 
              onClick={handlePrintInvoice}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg"
            >
              <Download size={16} /> Print Invoice
            </button>
          )}
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-800 border-2 border-slate-100 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
            <HelpCircle size={16} /> Support
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Items and Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items Card */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
              <Package size={18} className="text-slate-400" />
              <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">Order Items ({order.items.length})</h3>
            </div>
            <div className="divide-y divide-slate-100">
               {order.items.map((item, idx) => (
                 <div key={idx} className="p-6 flex gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0">
                       <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                       <h4 className="font-bold text-slate-800 truncate mb-1">{item.name}</h4>
                       <p className="text-xs text-slate-500 mb-2">Seller ID: {item.sellerId?.slice(-6).toUpperCase()}</p>
                       <div className="flex items-center justify-between">
                          <p className="text-sm font-black text-slate-700">{formatCurrency(item.price)} × {item.quantity}</p>
                          <p className="font-black text-slate-800">{formatCurrency(item.price * item.quantity)}</p>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          </div>

          {/* Delivery Timeline Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-8 flex items-center gap-2">
              <Truck size={18} className="text-walmart-blue" />
              Delivery Progress
            </h3>
            
            <div className="relative">
              {/* Vertical Line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-100 z-0"></div>
              
              <div className="space-y-8 relative z-10">
                {[
                  { key: 'ordered', label: 'Order Placed', status: ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'] },
                  { key: 'confirmed', label: 'Order Confirmed', status: ['confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'] },
                  { key: 'processing', label: 'Processing', status: ['processing', 'shipped', 'out_for_delivery', 'delivered'] },
                  { key: 'shipped', label: 'Shipped', status: ['shipped', 'out_for_delivery', 'delivered'] },
                  { key: 'delivered', label: 'Delivered', status: ['delivered'] }
                ].map((step, index) => {
                  const isCompleted = step.status.includes(order.orderStatus);
                  const isCurrent = order.orderStatus === step.key || (index === 0 && order.orderStatus === 'pending');
                  
                  return (
                    <div key={step.key} className="flex items-start gap-6">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-4 transition-all duration-500 ${
                        isCompleted ? 'bg-green-500 border-green-100 text-white' : 
                        isCurrent ? 'bg-white border-walmart-blue text-walmart-blue animate-pulse' : 
                        'bg-white border-slate-100 text-slate-300'
                      }`}>
                        {isCompleted ? <CheckCircle size={14} /> : <div className="w-1.5 h-1.5 rounded-full bg-current"></div>}
                      </div>
                      <div>
                        <p className={`text-sm font-black uppercase tracking-wider ${isCompleted || isCurrent ? 'text-slate-800' : 'text-slate-300'}`}>
                          {step.label}
                        </p>
                        {isCompleted && (
                          <p className="text-[11px] text-slate-500 font-bold mt-1">Successfully completed</p>
                        )}
                        {isCurrent && (
                          <p className="text-[11px] text-walmart-blue font-bold mt-1 flex items-center gap-1">
                            <Clock size={10} /> Currently in progress
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Shipping & Payment Card */}
          <div className="grid md:grid-cols-2 gap-6">
             <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                   <MapPin size={18} className="text-walmart-blue" />
                   <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">Shipping To</h3>
                </div>
                <div className="space-y-1">
                   <p className="font-bold text-slate-800">{order.shippingAddress.fullName}</p>
                   <p className="text-sm text-slate-600">{order.shippingAddress.addressLine1}</p>
                   {order.shippingAddress.addressLine2 && <p className="text-sm text-slate-600">{order.shippingAddress.addressLine2}</p>}
                   <p className="text-sm text-slate-600">{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
                   <p className="text-sm font-bold text-slate-700 mt-2">📞 {order.shippingAddress.phone}</p>
                </div>
             </div>
             <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                   <CreditCard size={18} className="text-green-600" />
                   <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">Payment Info</h3>
                </div>
                <div className="space-y-3">
                   <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Method</p>
                      <p className="text-sm font-bold text-slate-800 uppercase">{order.paymentMethod.replace(/_/g, ' ')}</p>
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Status</p>
                      <span className={`text-xs font-black px-2 py-0.5 rounded-md uppercase ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                         {order.paymentStatus}
                      </span>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Actions */}
        <div className="space-y-6">
           <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm sticky top-24">
              <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-4">Order Summary</h3>
              <div className="space-y-3 text-sm">
                 <div className="flex justify-between text-slate-500">
                    <span>Subtotal</span>
                    <span className="font-bold text-slate-800">{formatCurrency(order.pricing.subtotal)}</span>
                 </div>
                 <div className="flex justify-between text-slate-500">
                    <span>Shipping Fee</span>
                    <span className="font-bold text-green-600">{order.pricing.shippingFee === 0 ? 'FREE' : formatCurrency(order.pricing.shippingFee)}</span>
                 </div>
                 {order.pricing.discount > 0 && (
                   <div className="flex justify-between text-green-600">
                      <span>Discount ({order.pricing.couponCode})</span>
                      <span className="font-bold">-{formatCurrency(order.pricing.discount)}</span>
                   </div>
                 )}
                 <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-slate-800 font-black text-base">Total Amount</span>
                    <span className="text-2xl font-black text-slate-900">{formatCurrency(order.pricing.total)}</span>
                 </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 space-y-3">
                 {['pending', 'confirmed'].includes(order.orderStatus) && (
                   <button 
                     onClick={() => setShowCancelModal(true)}
                     className="w-full py-3.5 bg-red-50 text-red-600 border border-red-100 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-red-100 transition-all"
                   >
                     Cancel Order
                   </button>
                 )}
                 {order.orderStatus === 'delivered' && (
                    <button className="w-full py-3.5 bg-sky-50 text-sky-700 border border-sky-100 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-sky-100 transition-all flex items-center justify-center gap-2">
                       <RefreshCcw size={16} /> Return Items
                    </button>
                 )}
                 <Link 
                   to="/products"
                   className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
                 >
                   Shop Similar Items
                 </Link>
              </div>
           </div>

           {/* Small Notice */}
           <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex gap-3">
              <AlertCircle size={18} className="text-slate-400 shrink-0" />
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                Orders can only be cancelled while in <strong>Pending</strong> or <strong>Confirmed</strong> status. Once shipped, they must be returned after delivery.
              </p>
           </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-red-500"></div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Cancel Order?</h3>
            <p className="text-slate-500 text-sm mb-6">This action cannot be undone. Please tell us why you're cancelling.</p>
            
            <textarea 
              placeholder="Reason for cancellation..."
              className="w-full rounded-2xl border-2 border-slate-100 p-4 text-sm focus:border-red-500 outline-none transition-all h-32 mb-6"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            ></textarea>
            
            <div className="flex gap-4">
              <button 
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-3.5 bg-slate-100 text-slate-800 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Go Back
              </button>
              <button 
                onClick={handleCancel}
                className="flex-1 py-3.5 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-100"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailPage;
