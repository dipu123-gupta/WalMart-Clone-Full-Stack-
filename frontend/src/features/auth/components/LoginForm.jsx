import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearError } from '@/features/auth/authSlice';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const LoginForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state) => state.auth);
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    const result = await dispatch(login(form));
    if (login.fulfilled.match(result)) {
      toast.success('Welcome back!');
      navigate('/');
    } else {
      toast.error(result.payload || 'Login failed');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <Link to="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-12 h-12 rounded-full bg-walmart-blue flex items-center justify-center">
            <span className="text-white font-bold text-xl">W</span>
          </div>
        </Link>
        <h1 className="text-2xl font-bold">Welcome Back</h1>
        <p className="text-gray-500 text-sm mt-1">Sign in to continue shopping</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
          <div className="relative">
            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value.trim() })}
              className="input-primary pl-10"
              placeholder="you@example.com"
              required
              id="login-email"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-sm font-medium text-gray-700">Password</label>
            <Link to="/forgot-password" className="text-xs text-walmart-blue hover:underline">Forgot?</Link>
          </div>
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input-primary pl-10 pr-10"
              placeholder="••••••••"
              required
              id="login-password"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <button
          type="submit"
          disabled={isLoading}
          className="btn-walmart w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50"
          id="login-submit"
        >
          {isLoading ? (
            <span className="loading loading-spinner loading-sm"></span>
          ) : (
            <>Sign In <ArrowRight size={16} /></>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-6">
        <hr className="flex-1" />
        <span className="text-xs text-gray-400">OR</span>
        <hr className="flex-1" />
      </div>

      {/* Google */}
      <button className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 rounded-full py-2.5 hover:bg-gray-50 transition-colors text-sm font-medium" id="google-login">
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path fill="#4285F4" d="m23.7 12.3-.1-2.3H12.2v4.5h6.5c-.3 1.5-1.2 2.8-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8Z"/>
          <path fill="#34A853" d="M12.2 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.1-4 1.1-3.1 0-5.7-2.1-6.6-4.9H1.6v3.1C3.5 21.3 7.6 24 12.2 24Z"/>
          <path fill="#FBBC05" d="M5.6 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3V6.6H1.6A11.8 11.8 0 0 0 .2 12c0 1.9.5 3.7 1.4 5.4l4-3.1Z"/>
          <path fill="#EA4335" d="M12.2 4.8c1.7 0 3.3.6 4.5 1.8l3.4-3.4C18.1 1.2 15.4 0 12.2 0 7.6 0 3.5 2.7 1.6 6.6l4 3.1c.9-2.8 3.5-4.9 6.6-4.9Z"/>
        </svg>
        Continue with Google
      </button>

      <p className="text-center mt-6 text-sm text-gray-500">
        Don't have an account?{' '}
        <Link to="/register" className="text-walmart-blue font-semibold hover:underline">Create one</Link>
      </p>
    </div>
  );
};

export default LoginForm;
