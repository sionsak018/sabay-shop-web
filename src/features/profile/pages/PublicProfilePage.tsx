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
    <div className="bg-[#f8fafc] min-h-screen antialiased pb-20 text-left">
      {/* Profile Banner */}
      <div className="bg-white border-b border-gray-200">
        <div className="relative h-48 md:h-64 bg-gray-100 group">
          <img
            src={getImageUrl(user.cover_photo, 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000')}
            className="w-full h-full object-cover"
            alt="Cover"
          />
        </div>

        <div className="container mx-auto px-4 max-w-6xl relative">
          <div className="flex flex-col md:flex-row items-center md:items-center gap-5 -mt-10 pb-6">
            <div className="w-32 h-32 md:w-36 md:h-36 rounded-full bg-blue-600 flex items-center justify-center text-white text-5xl font-black border-[6px] border-white shadow-xl overflow-hidden relative">
              {user.avatar ? (
                <img src={getImageUrl(user.avatar)} className="w-full h-full object-cover" />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>

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
              <p className="text-gray-500 font-medium text-xs max-w-2xl">
                {user.about_me || "This user prefers to keep their bio a mystery."}
              </p>
            </div>

            <div className="flex flex-col items-center md:items-end gap-4 pb-2 pt-6 md:pt-10">
                <div className="flex gap-6">
                    <button onClick={() => setActiveTab('home')} className={`text-center group transition-colors ${activeTab === 'home' ? 'text-blue-600' : ''}`}>
                        <p className="text-xl font-black leading-none">{stats.ads_count}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Ads</p>
                    </button>
                    <div className="w-px h-8 bg-gray-100 self-center" />
                    <button onClick={() => setActiveTab('followers')} className={`text-center group transition-colors ${activeTab === 'followers' ? 'text-blue-600' : ''}`}>
                        <p className="text-xl font-black leading-none">{stats.followers_count}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Followers</p>
                    </button>
                    <div className="w-px h-8 bg-gray-100 self-center" />
                    <button onClick={() => setActiveTab('following')} className={`text-center group transition-colors ${activeTab === 'following' ? 'text-blue-600' : ''}`}>
                        <p className="text-xl font-black leading-none">{stats.following_count}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Following</p>
                    </button>
                </div>

                {!isOwnProfile && (
                    <div className="flex gap-2">
                        <button
                            onClick={handleToggleFollow}
                            disabled={followLoading}
                            className={`px-8 py-2 rounded-full font-black text-[11px] uppercase tracking-widest transition shadow-lg ${
                                isFollowing
                                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20'
                            }`}
                        >
                            {isFollowing ? 'Following' : 'Follow'}
                        </button>
                        <button
                            onClick={() => navigate('/inbox')}
                            className="bg-white border border-gray-200 text-gray-700 px-6 py-2 rounded-full font-black text-[11px] uppercase tracking-widest hover:bg-gray-50 transition"
                        >
                            Message
                        </button>
                    </div>
                )}
            </div>
          </div>
        </div>

        {/* Store Tabs */}
        <div className="bg-gray-50 border-t border-gray-200">
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
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
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
            <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in duration-300">
                {/* Side Filter */}
                <aside className="lg:w-56 flex-shrink-0 space-y-6">
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                            <h2 className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Categories</h2>
                        </div>
                        <div className="p-1.5 space-y-0.5">
                            <button
                                onClick={() => setSelectedCategory('')}
                                className={`w-full text-left px-3 py-1.5 rounded-md text-xs font-bold transition ${!selectedCategory ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                All Categories
                            </button>
                            {categories.map((cat: any) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(String(cat.id))}
                                    className={`w-full text-left px-3 py-1.5 rounded-md text-xs font-bold transition ${selectedCategory === String(cat.id) ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                            <h2 className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Sort By</h2>
                        </div>
                        <div className="p-3">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-blue-500 transition-all"
                            >
                                <option value="latest">Newest First</option>
                                <option value="price_low">Price: Low to High</option>
                                <option value="price_high">Price: High to Low</option>
                            </select>
                        </div>
                    </div>
                </aside>

                {/* Listing Area */}
                <div className="flex-1">
                    <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-2">
                        <h2 className="text-[11px] font-black text-gray-800 uppercase tracking-widest">Store Listings ({filteredProducts.length})</h2>
                    </div>

                    {filteredProducts.length === 0 ? (
                        <div className="py-20 text-center bg-white rounded-2xl border border-gray-100">
                            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">No matching items found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredProducts.map((p: any) => (
                                <ProductCard key={p.id} product={p} onToggleFavorite={fetchProfile} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )}

        {activeTab === 'about' && (
            <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-2xl p-10 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-6 pb-2 border-b border-gray-100">About {user.name}</h2>
                <div className="space-y-6">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 leading-none">Biography</p>
                        <p className="text-gray-600 text-sm leading-relaxed italic">
                            {user.about_me || "This user hasn't written a biography yet."}
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-8 pt-6 border-t border-gray-50">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-none">Store ID</p>
                            <p className="text-sm font-bold text-gray-800">#SID-{user.id}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-none">Location</p>
                            <p className="text-sm font-bold text-gray-800">{user.phone ? "Phnom Penh" : "Cambodia"}</p>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {(activeTab === 'followers' || activeTab === 'following') && (
            <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in duration-300">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h2 className="text-[10px] font-black text-gray-800 uppercase tracking-widest">{activeTab}</h2>
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
                                            {u.avatar ? <img src={getImageUrl(u.avatar)} className="w-full h-full object-cover" /> : u.name.charAt(0).toUpperCase()}
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
      </div>
    </div>
  );
};
