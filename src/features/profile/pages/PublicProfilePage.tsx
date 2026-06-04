import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { profileApi } from '../services/profileApi';
import { type Product } from '../../products/types/product.types';
import { ProductCard } from '../../products/components/ProductCard';
import { useAuth } from '../../auth/hooks/useAuth';
import { getImageUrl } from '../../../utils/imageUrl';

export const PublicProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'about' | 'followers' | 'following'>('home');

  // Filters for store home
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('latest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [socialLoading, setSocialLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProfile();
    }
  }, [id, currentUser]);

  useEffect(() => {
    if (id && (activeTab === 'followers' || activeTab === 'following')) {
      fetchSocialData();
    }
  }, [id, activeTab]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await profileApi.getPublicProfile(parseInt(id!));
      setProfileData(res.data);
      setIsFollowing(res.data.is_following);
    } catch (error) {
      console.error('Failed to load profile', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSocialData = async () => {
    setSocialLoading(true);
    try {
      if (activeTab === 'followers') {
        const res = await profileApi.getFollowers(parseInt(id!));
        setFollowers(res.data);
      } else {
        const res = await profileApi.getFollowing(parseInt(id!));
        setFollowing(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch social data', error);
    } finally {
      setSocialLoading(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setFollowLoading(true);
    try {
      await profileApi.toggleFollow(parseInt(id!));
      setIsFollowing(!isFollowing);
      // Update stats locally
      setProfileData((prev: any) => ({
        ...prev,
        stats: {
          ...prev.stats,
          followers_count: isFollowing ? prev.stats.followers_count - 1 : prev.stats.followers_count + 1
        }
      }));
    } catch (error) {
      alert('Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) return <div className="p-20 text-center text-gray-400 font-bold uppercase animate-pulse">Loading Profile...</div>;
  if (!profileData) return <div className="p-20 text-center text-gray-500">Profile not found.</div>;

  const { user, stats, products } = profileData;
  const isOwnProfile = currentUser?.id === user.id;

  // Filter and Sort Logic
  const filteredProducts = products.filter((p: any) => {
    if (selectedCategory && String(p.category_id) !== selectedCategory) return false;
    return true;
  }).sort((a: any, b: any) => {
    if (sortBy === 'price_low') return a.price - b.price;
    if (sortBy === 'price_high') return b.price - a.price;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const categories = Array.from(new Set(products.map((p: any) => JSON.stringify({ id: p.category_id, name: p.category?.name }))))
    .map((s: any) => JSON.parse(s));

  return (
    <div className="bg-[#f1f2f6] dark:bg-[#08060d] min-h-screen antialiased pb-20 text-left transition-colors duration-300">
      {/* Profile Banner */}
      <div className="bg-white dark:bg-[#16171d] border-b border-gray-200 dark:border-gray-800 transition-colors">
        <div className="relative h-48 md:h-64 bg-gray-100 dark:bg-gray-800 group">
          <img
            src={getImageUrl(user.cover_photo, 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000')}
            className="w-full h-full object-cover"
            alt="Cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000';
            }}
          />
        </div>

        <div className="container mx-auto px-4 max-w-6xl relative">
          <div className="flex flex-col md:flex-row items-center md:items-center gap-5 -mt-10 pb-6">
            <div className="w-32 h-32 md:w-36 md:h-36 rounded-full bg-blue-600 flex items-center justify-center text-white text-5xl font-black border-[6px] border-white dark:border-[#16171d] shadow-xl overflow-hidden relative">
              {user.avatar ? (
                <img
                  src={getImageUrl(user.avatar)}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://placehold.co/200x200?text=' + user.name.charAt(0).toUpperCase();
                  }}
                />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>

            <div className="flex-1 text-center md:text-left pt-6 md:pt-10">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 mb-2">
                <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight">{user.name}</h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[9px] font-black uppercase rounded border border-blue-100 dark:border-blue-900/30 self-center md:self-auto">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/></svg>
                  Verified Ad Poster
                </span>
              </div>
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">
                <p className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    Phnom Penh, Cambodia
                </p>
                <div className="w-1 h-1 bg-gray-300 dark:bg-gray-700 rounded-full" />
                <p className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    Member since {new Date(user.created_at).getFullYear()}
                </p>
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium text-xs max-w-2xl">
                {user.about_me || "This user prefers to keep their bio a mystery."}
              </p>
            </div>

            <div className="flex flex-col items-center md:items-end gap-4 pb-2 pt-6 md:pt-10">
                <div className="flex gap-6">
                    <button onClick={() => setActiveTab('home')} className={`text-center group transition-colors ${activeTab === 'home' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'}`}>
                        <p className="text-xl font-black leading-none">{stats.ads_count}</p>
                        <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Ads</p>
                    </button>
                    <div className="w-px h-8 bg-gray-100 dark:bg-gray-800 self-center" />
                    <button onClick={() => setActiveTab('followers')} className={`text-center group transition-colors ${activeTab === 'followers' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'}`}>
                        <p className="text-xl font-black leading-none">{stats.followers_count}</p>
                        <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Followers</p>
                    </button>
                    <div className="w-px h-8 bg-gray-100 dark:bg-gray-800 self-center" />
                    <button onClick={() => setActiveTab('following')} className={`text-center group transition-colors ${activeTab === 'following' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'}`}>
                        <p className="text-xl font-black leading-none">{stats.following_count}</p>
                        <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Following</p>
                    </button>
                </div>

                {!isOwnProfile && (
                    <div className="flex gap-2">
                        <button
                            onClick={handleToggleFollow}
                            disabled={followLoading}
                            className={`px-8 py-2 rounded-full font-black text-[11px] uppercase tracking-widest transition shadow-lg ${
                                isFollowing
                                ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                : 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 shadow-blue-600/20'
                            }`}
                        >
                            {isFollowing ? 'Following' : 'Follow'}
                        </button>
                        <button
                            onClick={() => navigate('/inbox')}
                            className="bg-white dark:bg-[#16171d] border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-full font-black text-[11px] uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                        >
                            Message
                        </button>
                    </div>
                )}
            </div>
          </div>
        </div>

        {/* Store Tabs */}
        <div className="bg-gray-50 dark:bg-[#08060d] border-t border-gray-200 dark:border-gray-800 transition-colors">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="flex gap-8">
                    {[
                        { id: 'home', label: 'STORE HOME' },
                        { id: 'about', label: 'ABOUT' },
                        { id: 'followers', label: 'FOLLOWERS' },
                        { id: 'following', label: 'FOLLOWING' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${
                                activeTab === tab.id
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                                : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl py-8">

        {activeTab === 'home' && (
            <div className="animate-in fade-in duration-300">
                {/* Horizontal Filter Bar - Style same as Product List */}
                <div className="bg-white dark:bg-[#16171d] border border-gray-200 dark:border-gray-800 rounded mb-4 shadow-sm transition-colors">
                    <div className="px-4 flex items-center overflow-hidden">
                        <div className="flex-1 overflow-x-auto scrollbar-hide flex items-center gap-1.5 py-2">
                            <div className="relative">
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="appearance-none flex items-center gap-1.5 px-3 py-1.5 bg-[#f8f9fa] dark:bg-gray-800 hover:bg-[#e9ecef] dark:hover:bg-gray-700 rounded border border-[#dee2e6] dark:border-gray-700 text-[11px] font-bold text-gray-700 dark:text-gray-300 transition outline-none cursor-pointer pr-7"
                                >
                                    <option value="">All Categories</option>
                                    {categories.map((cat: any) => (
                                        <option key={cat.id} value={String(cat.id)}>{cat.name}</option>
                                    ))}
                                </select>
                                <svg className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                            </div>

                            <div className="relative">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="appearance-none flex items-center gap-1.5 px-3 py-1.5 bg-[#f8f9fa] dark:bg-gray-800 hover:bg-[#e9ecef] dark:hover:bg-gray-700 rounded border border-[#dee2e6] dark:border-gray-700 text-[11px] font-bold text-gray-700 dark:text-gray-300 transition outline-none cursor-pointer pr-7"
                                >
                                    <option value="latest">Sort: Newest</option>
                                    <option value="price_low">Price: Low</option>
                                    <option value="price_high">Price: High</option>
                                </select>
                                <svg className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                            </div>
                        </div>

                        <div className="flex items-center shrink-0 ml-3 border-l border-gray-100 dark:border-gray-800 pl-3 py-2">
                            <button
                                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                                className="p-1.5 rounded text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex items-center justify-center w-9 h-9"
                            >
                                {viewMode === 'grid' ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M7 11h-2c-1.105 0-2 .895-2 2v2c0 1.105.895 2 2 2h2c1.105 0 2-.895 2-2v-2c0-1.105-.895-2-2-2zm0-6h-2c-1.105 0-2 .895-2 2v2c0 1.105.895 2 2 2h2c1.105 0 2-.895 2-2v-2c0-1.105-.895-2-2-2zm6 0h-2c-1.105 0-2 .895-2 2v2c0 1.105.895 2 2 2h2c1.105 0 2-.895 2-2v-2c0-1.105-.895-2-2-2zm0 6h-2c-1.105 0-2 .895-2 2v2c0 1.105.895 2 2 2h2c1.105 0 2-.895 2-2v-2c0-1.105-.895-2-2-2zm6-6h-2c-1.105 0-2 .895-2 2v2c0 1.105.895 2 2 2h2c1.105 0 2-.895 2-2v-2c0-1.105-.895-2-2-2zm0 6h-2c-1.105 0-2 .895-2 2v2c0 1.105.895 2 2 2h2c1.105 0 2-.895 2-2v-2c0-1.105-.895-2-2-2zm-6 6h-2c-1.105 0-2 .895-2 2v2c0 1.105.895 2 2 2h2c1.105 0 2-.895 2-2v-2c0-1.105-.895-2-2-2zm6 0h-2c-1.105 0-2 .895-2 2v2c0 1.105.895 2 2 2h2c1.105 0 2-.895 2-2v-2c0-1.105-.895-2-2-2z"/></svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Listing Area */}
                <div className="flex-1">
                    <div className="mb-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2 transition-colors px-1">
                        <h2 className="text-[11px] font-black text-gray-800 dark:text-gray-200 uppercase tracking-widest">Store Listings ({filteredProducts.length})</h2>
                    </div>

                    {filteredProducts.length === 0 ? (
                        <div className="py-20 text-center bg-white dark:bg-[#16171d] rounded-2xl border border-gray-100 dark:border-gray-800 transition-colors">
                            <p className="text-gray-400 dark:text-gray-600 font-bold text-xs uppercase tracking-widest">No matching items found</p>
                        </div>
                    ) : (
                        <div className={viewMode === 'grid'
                            ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3"
                            : "flex flex-col gap-3"
                        }>
                            {filteredProducts.map((p: any) => (
                                <ProductCard key={p.id} product={p} onToggleFavorite={fetchProfile} variant={viewMode} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )}

        {activeTab === 'about' && (
            <div className="max-w-3xl mx-auto bg-white dark:bg-[#16171d] border border-gray-200 dark:border-gray-800 rounded-2xl p-10 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300 transition-colors">
                <h2 className="text-sm font-black text-gray-800 dark:text-gray-100 uppercase tracking-widest mb-6 pb-2 border-b border-gray-100 dark:border-gray-800">About {user.name}</h2>
                <div className="space-y-6">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 leading-none">Biography</p>
                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed italic">
                            {user.about_me || "This user hasn't written a biography yet."}
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-8 pt-6 border-t border-gray-50 dark:border-gray-800">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 leading-none">Store ID</p>
                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">#SID-{user.id}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 leading-none">Location</p>
                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{user.phone ? "Phnom Penh" : "Cambodia"}</p>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {(activeTab === 'followers' || activeTab === 'following') && (
            <div className="max-w-2xl mx-auto bg-white dark:bg-[#16171d] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden animate-in fade-in duration-300 transition-colors">
                <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                    <h2 className="text-[10px] font-black text-gray-800 dark:text-gray-200 uppercase tracking-widest">{activeTab}</h2>
                </div>
                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                    {socialLoading ? (
                        [...Array(3)].map((_, i) => (
                            <div key={i} className="p-6 flex items-center gap-4 animate-pulse">
                                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-1/3" />
                                    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/4" />
                                </div>
                            </div>
                        ))
                    ) : (
                        <>
                            {(activeTab === 'followers' ? followers : following).map((u: any) => (
                                <div key={u.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer" onClick={() => navigate(`/u/${u.id}`)}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-black overflow-hidden border border-gray-100 dark:border-gray-800">
                                            {u.avatar ? (
                                              <img
                                                src={getImageUrl(u.avatar)}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                  (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=' + u.name.charAt(0).toUpperCase();
                                                }}
                                              />
                                            ) : (
                                              u.name.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">{u.name}</p>
                                            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">Verified Poster</p>
                                        </div>
                                    </div>
                                    <svg className="w-5 h-5 text-gray-300 dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7-7"/></svg>
                                </div>
                            ))}
                            {(activeTab === 'followers' ? followers : following).length === 0 && (
                                <div className="p-20 text-center flex flex-col items-center gap-4">
                                    <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center text-gray-200 dark:text-gray-700">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 8.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                                    </div>
                                    <p className="text-gray-400 dark:text-gray-500 font-bold text-xs uppercase tracking-widest">No {activeTab} yet</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
