import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { useAlert } from '../../../context/AlertContext';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showAlert } = useAlert();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    const Msg = 'ព័ត៌មាននេះត្រូវបានទាមទារ';

    if (!email.trim()) newErrors.email = Msg;
    if (!password.trim()) newErrors.password = Msg;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      const user = await login(email, password);
      showAlert({
        title: 'ជោគជ័យ!',
        message: 'អ្នកបានចូលប្រើប្រាស់ដោយជោគជ័យ។',
        type: 'success',
        onClose: () => {
          if (user.role === 'admin') {
            navigate('/admin', { replace: true });
          } else {
            navigate('/', { replace: true });
          }
        }
      });
    } catch (err: any) {
      showAlert({
        title: 'បរាជ័យ!',
        message: err.response?.data?.message || 'អ៊ីមែល ឬលេខសម្ងាត់មិនត្រឹមត្រូវឡើយ។',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#08060d] antialiased p-4 transition-colors duration-300">

      {/* Back to Home Link */}
      <Link
        to="/"
        className="mb-8 flex items-center gap-2 text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400 transition-all font-bold text-xs uppercase tracking-widest group"
      >
        <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Home
      </Link>

      {/* Logo Branding */}
      <Link to="/" className="flex items-center gap-2 mb-8 group">
        <div className="bg-blue-600 text-white font-black px-2 py-1 rounded text-2xl italic group-hover:bg-blue-700 transition">
          SABAY
        </div>
        <span className="text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">SHOP</span>
      </Link>

      <div className="max-w-md w-full bg-white dark:bg-[#16171d] border border-gray-200 dark:border-gray-800 rounded-md shadow-sm overflow-hidden">
        <div className="bg-gray-50 dark:bg-[#1f2028]/50 px-8 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase text-center tracking-widest">Login to your account</h2>
        </div>

        <div className="p-5 sm:p-8">
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 tracking-wider">Email Address</label>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                }}
                className={`w-full px-4 py-3 border rounded focus:border-blue-500 outline-none transition text-sm bg-white dark:bg-[#08060d] text-gray-800 dark:text-gray-200 ${errors.email ? 'border-red-300' : 'border-gray-300 dark:border-gray-700'}`}
              />
              {errors.email && <p className="text-red-500 text-[10px] font-bold mt-1.5 ml-1">{errors.email}</p>}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Password</label>
                <Link to="#" className="text-[11px] font-bold text-blue-600 hover:underline">Forgot?</Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                  }}
                  className={`w-full px-4 py-3 pr-10 border rounded focus:border-blue-500 outline-none transition text-sm bg-white dark:bg-[#08060d] text-gray-800 dark:text-gray-200 ${errors.password ? 'border-red-300' : 'border-gray-300 dark:border-gray-700'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-[10px] font-bold mt-1.5 ml-1">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-blue-600/10 active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-center transition-colors">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              New to Sabay Shop?{' '}
              <Link to="/register" className="font-bold text-blue-600 hover:underline">Register Now</Link>
            </p>
          </div>
        </div>
      </div>

      <p className="mt-8 text-xs text-gray-400 dark:text-gray-600">
        &copy; {new Date().getFullYear()} Sabay Shop Marketplace. All rights reserved.
      </p>
    </div>
  );
};