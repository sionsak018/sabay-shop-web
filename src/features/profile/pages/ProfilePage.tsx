import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { profileApi } from '../services/profileApi';
import { productApi } from '../../products/services/productApi';
import { type Product } from '../../products/types/product.types';
import { ProductCard } from '../../products/components/ProductCard';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../../services/api';

export const ProfilePage = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State for forms
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [aboutMe, setAboutMe] = useState('');
  const [loading, setLoading] = useState(false);

  // State for navigation
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ads' | 'saved' | 'settings' | 'password' | 'followers' | 'following'>((searchParams.get('tab') as any) || 'dashboard');

  // Update tab when URL changes
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['dashboard', 'ads', 'saved', 'settings', 'password', 'followers', 'following'].includes(tab)) {
      setActiveTab(tab as any);
    }
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
    setActiveTab(tab as any);
  };

  // State for data
  const [userProducts, setUserProducts] = useState<any[]>([]);
  const [savedProducts, setSavedProducts] = useState<Product[]>([]);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [stats, setStats] = useState({ followers_count: 0, following_count: 0, ads_count: 0 });
  const [limitInfo, setLimitInfo] = useState<any>(null);
  const [productsLoading, setProductsLoading] = useState(true);
  const [socialLoading, setSocialLoading] = useState(false);

  // File refs
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setAboutMe(user.about_me || '');
      fetchUserContent();
    }
  }, [user?.id]);

  useEffect(() => {
    if (user && (activeTab === 'followers' || activeTab === 'following')) {
        fetchSocialData();
    }
  }, [activeTab, user?.id]);

  const fetchUserContent = async () => {
    if (!user) return;
    setProductsLoading(true);

    try {
      const [productsRes, savedRes, statsRes, limitRes] = await Promise.allSettled([
        productApi.getMyProducts(),
        profileApi.getFavorites(),
        profileApi.getStats(user.id),
        api.get('/my-products/check-limit')
      ]);

      if (productsRes.status === 'fulfilled') {
          const rawData = productsRes.value.data;
          const actualArray = Array.isArray(rawData) ? rawData : (rawData.data || []);
          setUserProducts(actualArray);
      }

      if (savedRes.status === 'fulfilled') {
          const rawData = savedRes.value.data;
          setSavedProducts(Array.isArray(rawData) ? rawData : (rawData.data || []));
      }

      if (statsRes.status === 'fulfilled') {
          setStats(statsRes.value.data);
      }

      if (limitRes.status === 'fulfilled') {
          setLimitInfo(limitRes.value.data);
      }
    } catch (error) {
      console.error('Error fetching profile content', error);
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchSocialData = async () => {
    if (!user) return;
    setSocialLoading(true);
    try {
        if (activeTab === 'followers') {
            const res = await profileApi.getFollowers(user.id);
            setFollowers(res.data);
        } else {
            const res = await profileApi.getFollowing(user.id);
            setFollowing(res.data);
        }
    } catch (error) {
        console.error('Failed to fetch social data', error);
    } finally {
        setSocialLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover_photo') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append(type, file);

    try {
      const res = await profileApi.update(formData);
      updateUser(res.data);
      fetchUserContent();
    } catch (error) {
      alert('Failed to upload image');
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.append('name', name);
    formData.append('phone', phone);
    formData.append('about_me', aboutMe);

    try {
      const res = await profileApi.update(formData);
      updateUser(res.data);
      alert('Profile updated successfully');
      fetchUserContent();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this ad?')) {
      try {
        await productApi.delete(id);
        fetchUserContent();
      } catch (error) {
        alert('Failed to delete ad');
      }
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      const formData = new FormData();
      formData.append('status', status);
      await productApi.update(id, formData);
      fetchUserContent();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update status');
    }
  };

  if (!user) return null;

  return (
    <div className="bg-[#f8fafc] min-h-screen antialiased pb-20">

      {/* Profile Banner & Header */}
      <div className="bg-white border-b border-gray-200">
        {/* Cover Photo */}
        <div className="relative h-48 md:h-64 bg-gray-100 group">
          <img
            src={user.cover_photo ? `http://127.0.0.1:8000/storage/${user.cover_photo}` : 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000'}
            className="w-full h-full object-cover"
            alt="Cover"
          />
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
          <button
            onClick={() => coverInputRef.current?.click()}
            className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-gray-800 px-3 py-1.5 rounded-md text-[11px] font-bold shadow-lg backdrop-blur-sm transition flex items-center gap-2 border border-gray-200"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            Update Cover
          </button>
          <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'cover_photo')} />
        </div>

        <div className="container mx-auto px-4 max-w-6xl relative">
          <div className="flex flex-col md:flex-row items-center md:items-center gap-5 -mt-10 pb-6">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-32 h-32 md:w-36 md:h-36 rounded-full bg-blue-600 flex items-center justify-center text-white text-5xl font-black border-[6px] border-white shadow-xl overflow-hidden relative">
                {user.avatar ? (
                  <img src={`http://127.0.0.1:8000/storage/${user.avatar}`} className="w-full h-full object-cover" />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
                <button
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                </button>
              </div>
              <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'avatar')} />
            </div>

            {/* User Meta */}
            <div className="flex-1 text-center md:text-left pt-6 md:pt-10">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 mb-2">
                <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{user.name}</h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black uppercase rounded border border-blue-100 self-center md:self-auto">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/></svg>
                  Verified Ad Poster
                </span>
              </div>
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-3">
                <p className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    Phnom Penh, Cambodia
                </p>
                <div className="w-1 h-1 bg-gray-300 rounded-full" />
                <p className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    Member since {new Date(user.created_at).getFullYear()}
                </p>
              </div>
              <p className="text-gray-500 font-medium text-xs mb-4 max-w-2xl leading-relaxed">
                {user.about_me || "Share a bit about yourself with the community."}
              </p>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-6 pb-2 pt-6 md:pt-10">
                <button onClick={() => handleTabChange('ads')} className="text-center group">
                    <p className="text-xl font-black text-gray-900 leading-none group-hover:text-blue-600 transition-colors">{stats.ads_count || userProducts.length}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Total Ads</p>
                </button>
                <div className="w-px h-8 bg-gray-100 self-center" />
                <button onClick={() => handleTabChange('followers')} className="text-center group">
                    <p className="text-xl font-black text-gray-900 leading-none group-hover:text-blue-600 transition-colors">{stats.followers_count}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Followers</p>
                </button>
                <div className="w-px h-8 bg-gray-100 self-center" />
                <button onClick={() => handleTabChange('following')} className="text-center group">
                    <p className="text-xl font-black text-gray-900 leading-none group-hover:text-blue-600 transition-colors">{stats.following_count}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Following</p>
                </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl py-6">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Sidebar Navigation */}
          <aside className="lg:w-64 flex-shrink-0">
            <nav className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm sticky top-24">
              <div className="p-2 space-y-0.5">
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg> },
                  { id: 'ads', label: 'My Ads', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg> },
                  { id: 'saved', label: 'Saved Ads', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.01 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.01 0 00-6.364 0z"/></svg> },
                  { id: 'followers', label: 'Followers', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 8.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg> },
                  { id: 'following', label: 'Following', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg> },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`w-full text-left px-4 py-2.5 text-[13px] font-bold flex items-center gap-3 transition-all rounded-lg ${activeTab === item.id ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'}`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}

                <div className="h-px bg-gray-100 my-2 mx-2" />
                <p className="px-4 py-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Account Settings</p>

                {[
                  { id: 'settings', label: 'Edit Profile', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg> },
                  { id: 'password', label: 'Security', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg> },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`w-full text-left px-4 py-2.5 text-[13px] font-bold flex items-center gap-3 transition-all rounded-lg ${activeTab === item.id ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'}`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>
            </nav>
          </aside>

          {/* Content Area */}
          <div className="flex-1 space-y-6 min-w-0">

            {activeTab === 'dashboard' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-400">
                {/* Limit Warning Alert */}
                {limitInfo?.limit_reached && (
                    <div className="bg-red-50 border border-red-100 p-6 rounded-2xl flex flex-col md:flex-row items-center gap-6 shadow-sm">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 shrink-0">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h3 className="font-black text-red-900 text-sm uppercase tracking-tight mb-1">Ad Limit Reached</h3>
                            <p className="text-red-700 text-xs font-bold">You have used all your active ad slots ({limitInfo.active_count}/{limitInfo.post_limit}).</p>
                            <p className="text-red-600/70 text-[10px] mt-2 leading-relaxed">Delete old items or upgrade to <b>Store Member</b> for unlimited postings.</p>
                        </div>
                        <a
                        href="https://t.me/Sion_Sak"
                            target="_blank"
                            rel="noreferrer"
                            className="bg-red-600 text-white px-6 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition shadow-lg shadow-red-600/20 whitespace-nowrap"
                        >
                            Become a Store Member
                        </a>
                    </div>
                )}

                {/* Promo Card */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl shadow-blue-600/20 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="text-center md:text-left">
                    <h2 className="text-xl font-black uppercase tracking-tight mb-1">Boost Your Sales!</h2>
                    <p className="text-blue-100 text-xs font-medium opacity-90">Reach thousands of buyers instantly by posting your ads today.</p>
                  </div>
                  <Link to="/sell" className="bg-white text-blue-600 px-6 py-2.5 rounded-lg font-black text-[11px] uppercase tracking-widest hover:bg-blue-50 transition active:scale-95 whitespace-nowrap">
                    Create New Listing
                  </Link>
                </div>

                {/* Grid Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Active Ads', val: limitInfo?.active_count || 0, icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Saved Items', val: savedProducts.length, icon: 'M4.318 6.318a4.5 4.01 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.01 0 00-6.364 0z', color: 'text-rose-500', bg: 'bg-rose-50' },
                    { label: 'Posting Limit', val: `${limitInfo?.active_count || 0}/${limitInfo?.post_limit || 0}`, icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-amber-500', bg: 'bg-amber-50' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 hover:border-blue-200 transition-colors">
                      <div className={`w-11 h-11 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={stat.icon}/></svg>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                        <p className="text-xl font-black text-gray-800">{stat.val}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* About Section */}
                    <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">My Bio</h2>
                            <button onClick={() => handleTabChange('settings')} className="text-blue-600 hover:text-blue-700 transition">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M18.364 5.364a2.121 2.121 0 013 3L12 18l-4 1 1-4 9.364-9.364z"/></svg>
                            </button>
                        </div>
                        <p className="text-gray-600 text-[13px] leading-relaxed italic">
                            {user.about_me || "You haven't added a bio yet. Tell people what you're selling!"}
                        </p>
                    </div>

                    {/* Recent Ads Section */}
                    <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-[11px] font-black text-gray-800 uppercase tracking-widest">Recently Posted</h2>
                            <button onClick={() => handleTabChange('ads')} className="text-blue-600 text-[9px] font-black uppercase hover:underline">View All My Ads</button>
                        </div>
                        <div className="p-4 grid grid-cols-2 gap-4">
                            {productsLoading ? (
                                [...Array(2)].map((_, i) => (
                                    <div key={i} className="aspect-[4/3] bg-gray-50 rounded-lg animate-pulse border border-gray-100" />
                                ))
                            ) : (
                                <>
                                    {userProducts.slice(0, 2).map(p => (
                                        <ProductCard key={p.id} product={p} onToggleFavorite={fetchUserContent} />
                                    ))}
                                    {userProducts.length === 0 && (
                                        <div className="col-span-2 py-10 text-center flex flex-col items-center">
                                            <p className="text-gray-300 font-bold text-xs uppercase tracking-widest mb-3">No active listings</p>
                                            <Link to="/sell" className="text-blue-600 text-[10px] font-black uppercase border border-blue-100 px-4 py-1.5 rounded-full hover:bg-blue-50 transition">Post Now</Link>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
              </div>
            )}

            {activeTab === 'ads' && (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden min-h-[500px] animate-in fade-in duration-300">
                <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 z-10 backdrop-blur-md">
                  <h2 className="text-[11px] font-black text-gray-800 uppercase tracking-widest">My Marketplace Listings</h2>
                  {limitInfo && (
                    <span className={`text-[9px] font-black px-3 py-1 rounded-full shadow-lg uppercase ${limitInfo.limit_reached ? 'bg-red-600 text-white shadow-red-600/30' : 'bg-blue-600 text-white shadow-blue-600/30'}`}>
                      Used: {limitInfo.active_count} of {limitInfo.post_limit}
                    </span>
                  )}
                </div>
                {limitInfo?.limit_reached && (
                    <div className="bg-red-50 p-4 border-b border-red-100 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                            <p className="text-xs font-bold text-red-700">Limit reached! Upgrade for unlimited listings.</p>
                        </div>
                        <a href="https://t.me/Sion_Sak" target="_blank" rel="noreferrer" className="text-[10px] font-black text-red-600 hover:underline uppercase tracking-widest">Upgrade Now</a>
                    </div>
                )}
                <div className="divide-y divide-gray-100">
                  {userProducts.map(p => (
                    <div key={p.id} className="p-4 md:p-5 flex flex-col sm:flex-row gap-4 items-center hover:bg-gray-50/50 transition-colors group">
                       <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200 shadow-sm relative">
                            <img
                                src={p.images && p.images.length > 0 ? `http://127.0.0.1:8000/storage/${p.images[0].image_url}` : 'https://via.placeholder.com/100?text=No+Image'}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                alt={p.title}
                            />
                       </div>
                       <div className="flex-1 min-w-0 text-center sm:text-left">
                          <p className="font-bold text-gray-900 text-[13.5px] mb-1 line-clamp-2 leading-tight">{p.title}</p>
                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1">
                            <p className="text-blue-600 font-black text-sm">${Number(p.price).toLocaleString()}</p>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-gray-400 font-bold uppercase">{p.category?.name}</span>
                                <div className="w-1 h-1 bg-gray-300 rounded-full" />
                                <span className="text-[10px] text-gray-400 font-medium tracking-tighter">ID: #{p.id}</span>
                            </div>
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                              p.status === 'active' ? 'bg-green-50 text-green-600 border-green-100' :
                              p.status === 'sold' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-gray-50 text-gray-400 border-gray-200'
                            }`}>
                              {p.status}
                            </span>
                          </div>
                       </div>
                       <div className="flex items-center gap-1.5 flex-wrap justify-center sm:flex-nowrap">
                         {p.status === 'active' ? (
                           <div className="flex gap-1">
                             <button
                               onClick={() => handleUpdateStatus(p.id, 'sold')}
                               className="px-4 py-2 bg-blue-600 text-white rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition shadow-sm flex items-center gap-1.5"
                             >
                               <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
                               Sold
                             </button>
                             <button
                               onClick={() => handleUpdateStatus(p.id, 'inactive')}
                               className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition flex items-center gap-1.5"
                             >
                               <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                               Stop
                             </button>
                           </div>
                         ) : (
                           <button
                             onClick={() => handleUpdateStatus(p.id, 'active')}
                             className="px-6 py-2 bg-green-600 text-white rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition shadow-sm flex items-center gap-1.5 disabled:opacity-30"
                             disabled={limitInfo?.limit_reached}
                           >
                             <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                             Renew
                           </button>
                         )}

                         <div className="w-px h-8 bg-gray-100 mx-1 hidden sm:block" />

                         <div className="flex gap-1">
                            <Link
                                to={`/edit-product/${p.id}`}
                                className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition border border-gray-100 hover:border-blue-100"
                            >
                                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M18.364 5.364a2.121 2.121 0 013 3L12 18l-4 1 1-4 9.364-9.364z"/></svg>
                            </Link>
                            <button
                                onClick={() => handleDeleteProduct(p.id)}
                                className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition border border-gray-100 hover:border-red-100"
                            >
                                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                            </button>
                         </div>
                       </div>
                    </div>
                  ))}
                  {userProducts.length === 0 && (
                    <div className="p-24 text-center flex flex-col items-center gap-4 animate-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-200">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                        </div>
                        <div>
                            <p className="text-gray-900 font-black uppercase text-sm tracking-tight mb-1">Your store is empty</p>
                            <p className="text-gray-400 text-xs font-medium max-w-[240px] mx-auto leading-relaxed">List items you no longer need and start making money today.</p>
                        </div>
                        <Link to="/sell" className="mt-2 bg-blue-600 text-white px-8 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition active:scale-95">Post Your Ad</Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'saved' && (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden min-h-[500px] animate-in fade-in duration-300">
                <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-200 sticky top-0 z-10 backdrop-blur-md">
                    <h2 className="text-[11px] font-black text-gray-800 uppercase tracking-widest">Wishlist Items</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-5">
                  {savedProducts.map(p => (
                    <ProductCard key={p.id} product={p} isFavorited={true} onToggleFavorite={fetchUserContent} />
                  ))}
                  {savedProducts.length === 0 && (
                    <div className="col-span-full p-24 text-center flex flex-col items-center">
                        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-200 mb-4">
                            <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.01 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.01 0 00-6.364 0z"/></svg>
                        </div>
                        <p className="text-gray-900 font-black uppercase text-sm tracking-tight mb-1">Heart something you love</p>
                        <p className="text-gray-400 text-xs font-medium mb-6">Your saved items will appear here for easy access.</p>
                        <Link to="/" className="text-blue-600 font-black text-[11px] uppercase tracking-widest border-b-2 border-blue-100 hover:border-blue-600 transition-all pb-0.5">Explore Marketplace</Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(activeTab === 'followers' || activeTab === 'following') && (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden min-h-[500px] animate-in fade-in duration-300">
                <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-200 sticky top-0 z-10 backdrop-blur-md">
                    <h2 className="text-[11px] font-black text-gray-800 uppercase tracking-widest">{activeTab}</h2>
                </div>
                <div className="divide-y divide-gray-50">
                    {socialLoading ? (
                        [...Array(3)].map((_, i) => (
                            <div key={i} className="p-6 flex items-center gap-4 animate-pulse">
                                <div className="w-12 h-12 bg-gray-100 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-100 rounded w-1/3" />
                                    <div className="h-3 bg-gray-100 rounded w-1/4" />
                                </div>
                            </div>
                        ))
                    ) : (
                        <>
                            {(activeTab === 'followers' ? followers : following).map((u: any) => (
                                <div key={u.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/u/${u.id}`)}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-black overflow-hidden border border-gray-100">
                                            {u.avatar ? <img src={`http://127.0.0.1:8000/storage/${u.avatar}`} className="w-full h-full object-cover" /> : u.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800 text-sm">{u.name}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Verified Poster</p>
                                        </div>
                                    </div>
                                    <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7-7"/></svg>
                                </div>
                            ))}
                            {(activeTab === 'followers' ? followers : following).length === 0 && (
                                <div className="p-20 text-center flex flex-col items-center gap-4">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-200">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 8.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                                    </div>
                                    <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">No {activeTab} yet</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-400">
                <div className="bg-gray-50/80 px-8 py-5 border-b border-gray-100">
                    <h2 className="text-[11px] font-black text-gray-800 uppercase tracking-widest">Update Profile Details</h2>
                </div>
                <div className="p-8 space-y-8 max-w-2xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Account Display Name</label>
                      <input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g. John Doe"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 font-bold transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contact Phone Number</label>
                      <input
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="e.g. 012 345 678"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 font-bold transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Public Biography</label>
                    <textarea
                        value={aboutMe}
                        onChange={e => setAboutMe(e.target.value)}
                        rows={5}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 font-medium text-[13px] transition-all resize-none"
                        placeholder="Share a little bit about what you do or sell..."
                    />
                  </div>
                  <div className="pt-4 border-t border-gray-50">
                    <button
                        onClick={handleUpdate}
                        disabled={loading}
                        className="group bg-blue-600 text-white px-12 py-3.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-3"
                    >
                        {loading ? (
                            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : (
                            <svg className="w-4 h-4 text-blue-200 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
                        )}
                        {loading ? 'Processing...' : 'Sync Changes'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'password' && (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-400">
                <div className="bg-gray-50/80 px-8 py-5 border-b border-gray-100">
                    <h2 className="text-[11px] font-black text-gray-800 uppercase tracking-widest">Update Account Security</h2>
                </div>
                <div className="p-8 space-y-6 max-w-md">
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Current Password</label>
                        <input type="password" placeholder="••••••••" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 font-bold transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">New Password</label>
                        <input type="password" placeholder="••••••••" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 font-bold transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                        <input type="password" placeholder="••••••••" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 font-bold transition-all" />
                    </div>
                    <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition active:scale-95">Update Security</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
