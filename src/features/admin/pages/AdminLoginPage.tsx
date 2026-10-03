import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth/context/AuthContext';
import { isConsoleUser } from '../../auth/utils/roles';
import { useAlert } from '../../../context/AlertContext';

export const AdminLoginPage = () => {
  const { t } = useTranslation();
  const { login, logout } = useAuth();
  const { showAlert } = useAlert();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    const required = t('validation.required');
    if (!email.trim()) newErrors.email = required;
    if (!password.trim()) newErrors.password = required;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      const account = await login(email, password);
      const isAdmin = isConsoleUser(account);

      if (!isAdmin) {
        await logout();
        showAlert({
          title: t('admin.restricted'),
          message: t('admin.no_admin_access'),
          type: 'error'
        });
        return;
      }

      showAlert({
        title: t('admin.login_success_title'),
        message: t('admin.login_success_message'),
        type: 'success',
        onClose: () => navigate('/admin', { replace: true })
      });
    } catch (err) {
      const apiMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showAlert({
        title: t('admin.restricted'),
        message: apiMessage || t('admin.login_failed'),
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 antialiased p-4">
      <Link
        to="/"
        className="mb-8 flex items-center gap-2 text-gray-500 hover:text-indigo-400 transition-all font-bold text-xs uppercase tracking-widest group"
      >
        <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        {t('admin.back_to_store')}
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="bg-indigo-600 text-white p-2 rounded-lg">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-xl font-black text-white tracking-tight">SABAY ADMIN</span>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">{t('admin.console')}</span>
        </div>
      </div>

      <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-lg shadow-2xl overflow-hidden">
        <div className="px-8 py-4 border-b border-gray-800">
          <h1 className="text-sm font-bold text-gray-200 uppercase text-center tracking-widest">{t('admin.admin_login_title')}</h1>
          <p className="mt-2 text-center text-[11px] text-gray-500">{t('admin.admin_login_subtitle')}</p>
        </div>

        <div className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label htmlFor="admin-email" className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">{t('admin.admin_email')}</label>
              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                placeholder="admin@sabayshop.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                }}
                className={`w-full px-4 py-3 border rounded bg-gray-950 text-gray-100 outline-none transition text-sm focus:border-indigo-500 ${errors.email ? 'border-red-500/60' : 'border-gray-700'}`}
              />
              {errors.email && <p className="text-red-400 text-[10px] font-bold mt-1.5 ml-1">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">{t('admin.password')}</label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                  }}
                  className={`w-full px-4 py-3 pr-12 border rounded bg-gray-950 text-gray-100 outline-none transition text-sm focus:border-indigo-500 ${errors.password ? 'border-red-500/60' : 'border-gray-700'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-[10px] font-bold mt-1.5 ml-1">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3.5 rounded font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
            >
              {loading ? t('admin.signing_in') : t('admin.sign_in')}
            </button>
          </form>

          <p className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-gray-500">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            {t('admin.restricted')}
          </p>
        </div>
      </div>

      <p className="mt-8 text-xs text-gray-600">
        &copy; {new Date().getFullYear()} Sabay Shop Marketplace. All rights reserved.
      </p>
    </div>
  );
};
