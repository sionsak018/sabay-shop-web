import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.password !== formData.password_confirmation) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await register(formData);
      navigate('/', { replace: true });
    } catch (err: any) {
      if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        const firstError = Object.values(errors)[0]?.[0];
        setError(firstError || 'Registration failed');
      } else {
        setError(err.response?.data?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 antialiased p-4 py-12">

      {/* Logo Branding */}
      <Link to="/" className="flex items-center gap-2 mb-8 group">
        <div className="bg-blue-600 text-white font-black px-2 py-1 rounded text-2xl italic group-hover:bg-blue-700 transition">
          SABAY
        </div>
        <span className="text-2xl font-bold text-gray-800 tracking-tight">SHOP</span>
      </Link>

      <div className="max-w-md w-full bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-8 py-4 border-b border-gray-200">
          <h2 className="text-sm font-bold text-gray-700 uppercase text-center tracking-widest">Create your account</h2>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded text-xs font-bold animate-in fade-in slide-in-from-top-1">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Full Name</label>
              <input
                name="name"
                type="text"
                required
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded focus:border-blue-500 outline-none transition text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Email Address</label>
              <input
                name="email"
                type="email"
                required
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded focus:border-blue-500 outline-none transition text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Phone Number</label>
              <input
                name="phone"
                type="tel"
                placeholder="012 345 678"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded focus:border-blue-500 outline-none transition text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Password</label>
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded focus:border-blue-500 outline-none transition text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Confirm</label>
                <input
                  name="password_confirmation"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.password_confirmation}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded focus:border-blue-500 outline-none transition text-sm"
                />
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

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-blue-600 hover:underline">Login</Link>
            </p>
          </div>
        </div>
      </div>

      <p className="mt-8 text-xs text-gray-400">
        &copy; {new Date().getFullYear()} Sabay Shop Marketplace. All rights reserved.
      </p>
    </div>
  );
};