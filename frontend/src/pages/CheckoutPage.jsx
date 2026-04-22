import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { placeOrder } from '@/features/orders/orderSlice';
import { fetchCart, applyCoupon } from '@/features/cart/cartSlice';
import api from '@/services/api';
import { MapPin, CreditCard, Banknote, Plus, ChevronDown, Shield, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING_FEE, SITE_NAME } from '@/constants';

const CheckoutPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, couponCode, couponDiscount } = useSelector((state) => state.cart);
  const { isLoading } = useSelector((state) => state.orders);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullName: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', landmark: '',
  });

  useEffect(() => {
    dispatch(fetchCart());
    loadAddresses();
  }, [dispatch]);

  const loadAddresses = async () => {
    try {
      const { data } = await api.get('/users/me/addresses');
      setAddresses(data.data || []);
      const defaultAddr = data.data?.find((a) => a.isDefault);
      if (defaultAddr) setSelectedAddress(defaultAddr._id);
    } catch (err) { /* empty */ }
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
  const total = subtotal + shipping - couponDiscount;

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/users/me/addresses', newAddress);
      setAddresses([...addresses, data.data]);
      setSelectedAddress(data.data._id);
      setShowAddAddress(false);
      toast.success('Address added');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add address');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) return toast.error('Please select a delivery address');

    const result = await dispatch(placeOrder({ addressId: selectedAddress, paymentMethod }));
    if (placeOrder.fulfilled.match(result)) {
      if (paymentMethod === 'razorpay') {
        // Initiate Razorpay payment
        try {
          const { data } = await api.post('/payments/create-order', { orderId: result.payload._id });
          const payData = data.data;

          const options = {
            key: payData.keyId,
            amount: payData.amount,
            currency: payData.currency,
            order_id: payData.razorpayOrderId,
            name: SITE_NAME,
            description: 'Secure Payment for Order',
            image: '/logo-circle.png',
            prefill: {
              name: addresses.find(a => a._id === selectedAddress)?.fullName || '',
              email: JSON.parse(localStorage.getItem('user'))?.email || '',
              contact: addresses.find(a => a._id === selectedAddress)?.phone || '',
            },
            config: {
              display: {
                blocks: {
                  banks: {
                    name: 'Most Used',
                    instruments: [
                      { method: 'upi' },
                      { method: 'card' },
                    ],
                  },
                },
                sequence: ['block.banks', 'method.card', 'method.netbanking', 'method.wallet'],
                preferences: { show_default_blocks: true },
              },
            },
            handler: async (response) => {
              try {
                await api.post('/payments/verify', response);
                toast.success('Payment successful!');
                navigate(`/orders/${result.payload._id}`);
              } catch (err) {
                toast.error('Payment verification failed');
              }
            },
            modal: { ondismiss: () => toast.error('Payment cancelled') },
            theme: { color: '#0071dc' },
          };

          if (window.Razorpay) {
            const rzp = new window.Razorpay(options);
            rzp.open();
          } else {
            toast.error('Payment gateway not loaded');
          }
        } catch (err) {
          toast.error('Failed to create payment');
        }
      } else {
        toast.success('Order placed successfully!');
        navigate(`/orders/${result.payload._id}`);
      }
    } else {
      toast.error(result.payload || 'Failed to place order');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Delivery Address */}
          <div className="bg-white rounded-2xl p-6 border">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><MapPin size={20} className="text-walmart-blue" /> Delivery Address</h3>
            <div className="space-y-3">
              {addresses.map((addr) => (
                <label key={addr._id} className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${selectedAddress === addr._id ? 'border-walmart-blue bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="address" checked={selectedAddress === addr._id} onChange={() => setSelectedAddress(addr._id)} className="radio radio-sm radio-primary mt-1" />
                  <div>
                    <p className="font-semibold text-sm">{addr.fullName} <span className="font-normal text-gray-500">| {addr.phone}</span></p>
                    <p className="text-sm text-gray-600 mt-0.5">{addr.addressLine1}{addr.addressLine2 ? ', ' + addr.addressLine2 : ''}</p>
                    <p className="text-sm text-gray-600">{addr.city}, {addr.state} - {addr.pincode}</p>
                    {addr.isDefault && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full mt-1 inline-block">Default</span>}
                  </div>
                </label>
              ))}
              <button onClick={() => setShowAddAddress(!showAddAddress)} className="flex items-center gap-2 text-walmart-blue text-sm font-medium hover:underline">
                <Plus size={16} /> Add New Address
              </button>

              {showAddAddress && (
                <form onSubmit={handleAddAddress} className="grid grid-cols-2 gap-3 mt-3 p-4 border rounded-xl bg-gray-50">
                  <input required placeholder="Full Name" value={newAddress.fullName} onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })} className="input-primary col-span-1" />
                  <input required placeholder="Phone" value={newAddress.phone} onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })} className="input-primary col-span-1" />
                  <input required placeholder="Address Line 1" value={newAddress.addressLine1} onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })} className="input-primary col-span-2" />
                  <input placeholder="Address Line 2" value={newAddress.addressLine2} onChange={(e) => setNewAddress({ ...newAddress, addressLine2: e.target.value })} className="input-primary col-span-2" />
                  <input required placeholder="City" value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} className="input-primary" />
                  <input required placeholder="State" value={newAddress.state} onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })} className="input-primary" />
                  <input required placeholder="Pincode" value={newAddress.pincode} onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })} className="input-primary" />
                  <input placeholder="Landmark" value={newAddress.landmark} onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })} className="input-primary" />
                  <button type="submit" className="btn-walmart col-span-2">Save Address</button>
                </form>
              )}
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-2xl p-6 border">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><CreditCard size={20} className="text-walmart-blue" /> Payment Method</h3>
            <div className="space-y-3">
              <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${paymentMethod === 'razorpay' ? 'border-walmart-blue bg-blue-50' : 'border-gray-200'}`}>
                <input type="radio" name="payment" checked={paymentMethod === 'razorpay'} onChange={() => setPaymentMethod('razorpay')} className="radio radio-sm radio-primary" />
                <CreditCard size={20} className="text-walmart-blue" />
                <div><p className="font-medium text-sm">Online Payment</p><p className="text-xs text-gray-500">UPI, Cards, Net Banking via Razorpay</p></div>
              </label>
              <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${paymentMethod === 'cod' ? 'border-walmart-blue bg-blue-50' : 'border-gray-200'}`}>
                <input type="radio" name="payment" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="radio radio-sm radio-primary" />
                <Banknote size={20} className="text-green-600" />
                <div><p className="font-medium text-sm">Cash on Delivery</p><p className="text-xs text-gray-500">Pay when you receive</p></div>
              </label>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div>
          <div className="bg-white rounded-2xl p-6 border sticky top-28">
            <h3 className="font-bold text-lg mb-4">Order Summary</h3>
            <div className="space-y-2 text-sm mb-4">
              {items.slice(0, 3).map((item) => (
                <div key={item._id} className="flex justify-between">
                  <span className="text-gray-500 line-clamp-1 flex-1">{item.productId?.name} × {item.quantity}</span>
                  <span className="font-medium ml-2">₹{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
              {items.length > 3 && <p className="text-xs text-gray-400">+{items.length - 3} more items</p>}
            </div>
            <hr className="my-3" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span>{shipping === 0 ? <span className="text-green-600">FREE</span> : `₹${shipping}`}</span></div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-green-600 font-bold">
                   <span>Discount ({couponCode})</span>
                   <span>-₹{couponDiscount.toLocaleString()}</span>
                </div>
              )}
              <hr />
              <div className="flex justify-between text-lg font-bold"><span>Total</span><span>₹{Math.max(0, total).toLocaleString()}</span></div>
            </div>

            {/* Final Coupon Input Area */}
            <div className="mt-6 pt-5 border-t">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Apply Promo Code</p>
               <div className="flex gap-2">
                  <input 
                    type="text" 
                    id="checkout-coupon"
                    placeholder="WMT2026"
                    className="flex-1 px-4 py-2 text-sm rounded-xl border border-slate-200 outline-none focus:border-walmart-blue uppercase font-bold"
                  />
                  <button 
                    onClick={() => {
                      const val = document.getElementById('checkout-coupon').value;
                      if(val) dispatch(applyCoupon(val));
                    }}
                    className="px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-black transition-all"
                  >
                    Apply
                  </button>
               </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={isLoading || !selectedAddress}
              className="btn-walmart w-full py-3.5 mt-5 flex items-center justify-center gap-2 text-base disabled:opacity-50"
              id="place-order"
            >
              {isLoading ? <span className="loading loading-spinner"></span> : <>Place Order <ArrowRight size={16} /></>}
            </button>

            <div className="flex items-center justify-center gap-1 mt-3 text-xs text-gray-400">
              <Shield size={14} /> Secure checkout with 256-bit encryption
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
