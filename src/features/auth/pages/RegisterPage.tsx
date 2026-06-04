import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAlert } from '../../../context/AlertContext';

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { showAlert } = useAlert();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors(prev => ({ ...prev, [e.target.name]: '' }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    const Msg = 'ព័ត៌មាននេះត្រូវបានទាមទារ';

    if (!formData.name.trim()) newErrors.name = Msg;

    if (!formData.email.trim()) {
      newErrors.email = Msg;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'អាសយដ្ឋានអ៊ីមែលមិនត្រឹមត្រូវ';
    }

    if (!formData.phone.trim()) newErrors.phone = Msg;

    if (!formData.password.trim()) {
      newErrors.password = Msg;
    } else if (formData.password.length < 8) {
      newErrors.password = 'លេខសម្ងាត់ត្រូវមានយ៉ាងតិច ៨ ខ្ទង់';
    }

    if (!formData.password_confirmation.trim()) {
      newErrors.password_confirmation = Msg;
    } else if (formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = 'លេខសម្ងាត់បញ្ជាក់មិនត្រឹមត្រូវ';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      await register(formData);
      showAlert({
        title: 'ជោគជ័យ!',
        message: 'គណនីរបស់អ្នកត្រូវបានបង្កើតដោយជោគជ័យ។',
        type: 'success',
        onClose: () => navigate('/', { replace: true })
      });
    } catch (err: any) {
      if (err.response?.status === 422) {
        const remoteErrors = err.response.data.errors;
        const firstError = Object.values(remoteErrors)[0]?.[0];
        showAlert({ title: 'បរាជ័យ!', message: firstError || 'ការចុះឈ្មោះមិនជោគជ័យឡើយ។', type: 'error' });
      } else {
        showAlert({ title: 'បរាជ័យ!', message: err.response?.data?.message || 'ការចុះឈ្មោះមិនជោគជ័យឡើយ។', type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#08060d] antialiased p-4 py-12 transition-colors duration-300">

      {/* Logo Branding */}
      <Link to="/" className="flex items-center gap-2 mb-8 group">
        <div className="bg-blue-600 text-white font-black px-2 py-1 rounded text-2xl italic group-hover:bg-blue-700 transition">
          SABAY
        </div>
        <span className="text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">SHOP</span>
      </Link>

      <div className="max-w-md w-full bg-white dark:bg-[#16171d] border border-gray-200 dark:border-gray-800 rounded-md shadow-sm overflow-hidden transition-colors">
        <div className="bg-gray-50 dark:bg-[#1f2028]/50 px-8 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase text-center tracking-widest">Create your account</h2>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 tracking-wider">Full Name</label>
              <input
                name="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded focus:border-blue-500 outline-none transition text-sm bg-white dark:bg-[#08060d] text-gray-800 dark:text-gray-200 ${errors.name ? 'border-red-300' : 'border-gray-300 dark:border-gray-700'}`}
              />
              {errors.name && <p className="text-red-500 text-[10px] font-bold mt-1.5 ml-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 tracking-wider">Email Address</label>
              <input
                name="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded focus:border-blue-500 outline-none transition text-sm bg-white dark:bg-[#08060d] text-gray-800 dark:text-gray-200 ${errors.email ? 'border-red-300' : 'border-gray-300 dark:border-gray-700'}`}
              />
              {errors.email && <p className="text-red-500 text-[10px] font-bold mt-1.5 ml-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 tracking-wider">Phone Number</label>
              <input
                name="phone"
                type="tel"
                placeholder="012 345 678"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded focus:border-blue-500 outline-none transition text-sm bg-white dark:bg-[#08060d] text-gray-800 dark:text-gray-200 ${errors.phone ? 'border-red-300' : 'border-gray-300 dark:border-gray-700'}`}
              />
              {errors.phone && <p className="text-red-500 text-[10px] font-bold mt-1.5 ml-1">{errors.phone}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 tracking-wider">Password</label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
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
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 tracking-wider">Confirm</label>
                <div className="relative">
                  <input
                    name="password_confirmation"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password_confirmation}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 pr-10 border rounded focus:border-blue-500 outline-none transition text-sm bg-white dark:bg-[#08060d] text-gray-800 dark:text-gray-200 ${errors.password_confirmation ? 'border-red-300' : 'border-gray-300 dark:border-gray-700'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>
                    )}
                  </button>
                </div>
                {errors.password_confirmation && <p className="text-red-500 text-[10px] font-bold mt-1.5 ml-1">{errors.password_confirmation}</p>}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-blue-600/10 active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Sign up now'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-center transition-colors">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-blue-600 hover:underline">Login</Link>
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