import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register, verifyOTP, clearError } from '@/features/auth/authSlice';
import { Eye, EyeOff, User, Mail, Lock, Phone, ArrowRight, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const RegisterForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, isOTPSent, error } = useSelector((state) => state.auth);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', phone: '' });
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    const result = await dispatch(register(form));
    if (register.fulfilled.match(result)) {
      toast.success('OTP sent to your email!');
    } else {
      toast.error(result.payload || 'Registration failed');
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const result = await dispatch(verifyOTP({ email: form.email, otp }));
    if (verifyOTP.fulfilled.match(result)) {
      toast.success('Account verified! Welcome!');
      navigate('/');
    } else {
      toast.error(result.payload || 'Invalid OTP');
    }
  };

  if (isOTPSent) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 animate-fade-in">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-500" />
          </div>
          <h2 className="text-xl font-bold">Verify Your Email</h2>
          <p className="text-gray-500 text-sm mt-1">We sent a 6-digit code to <strong>{form.email}</strong></p>
        </div>
        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="text"
            maxLength="6"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            className="input-primary text-center text-2xl tracking-[0.5em] font-mono"
            placeholder="000000"
            required
            id="otp-input"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={isLoading || otp.length !== 6} className="btn-walmart w-full py-3 disabled:opacity-50" id="verify-otp-btn">
            {isLoading ? <span className="loading loading-spinner loading-sm"></span> : 'Verify & Continue'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 animate-fade-in">
      <div className="text-center mb-6">
        <Link to="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-12 h-12 rounded-full bg-walmart-blue flex items-center justify-center">
            <span className="text-white font-bold text-xl">W</span>
          </div>
        </Link>
        <h1 className="text-2xl font-bold">Create Account</h1>
        <p className="text-gray-500 text-sm mt-1">Join millions of happy shoppers</p>
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">First Name</label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="input-primary pl-10" placeholder="John" required />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Last Name</label>
            <input type="text" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="input-primary" placeholder="Doe" required />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
          <div className="relative">
            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-primary pl-10" placeholder="you@example.com" required id="register-email" />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Phone (Optional)</label>
          <div className="relative">
            <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-primary pl-10" placeholder="+91 9876543210" />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Password</label>
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input-primary pl-10 pr-10" placeholder="Min 8 chars, 1 uppercase, 1 number" required id="register-password" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <button type="submit" disabled={isLoading} className="btn-walmart w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50" id="register-submit">
          {isLoading ? <span className="loading loading-spinner loading-sm"></span> : <>Create Account <ArrowRight size={16} /></>}
        </button>
      </form>

      <p className="text-center mt-6 text-sm text-gray-500">
        Already have an account? <Link to="/login" className="text-walmart-blue font-semibold hover:underline">Sign In</Link>
      </p>
    </div>
  );
};

export default RegisterForm;
