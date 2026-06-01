import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';

export const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
    navigate('/', { replace: true });
    await logout();
  };

  const isActive = (path: string) => location.pathname === path;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node) && !(event.target as HTMLElement).closest('.mobile-menu-trigger')) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on path change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 h-14 flex items-center">
      <div className="container mx-auto px-4 max-w-7xl flex justify-between items-center">
        
        <div className="flex items-center gap-4">
          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="mobile-menu-trigger p-2 -ml-2 text-gray-500 hover:text-blue-600 md:hidden transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"}/>
            </svg>
          </button>

          {/* Khmer24 Style Logo */}
          <Link
            to="/"
            className="flex items-center gap-1.5 group"
          >
            <div className="bg-blue-600 text-white font-black px-1.5 py-0.5 rounded text-lg italic group-hover:bg-blue-700 transition leading-tight">
              SABAY
            </div>
            <span className="text-lg font-bold text-gray-800 tracking-tight hidden xs:block">SHOP</span>
          </Link>
        </div>

        {/* Action Area */}
        <div className="flex items-center gap-2 sm:gap-5">
          <nav className="hidden md:flex items-center gap-5">
            <Link to="/" className={`text-xs font-bold ${isActive('/') ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'} transition uppercase tracking-widest`}>
              HOME
            </Link>
            <Link to="/products" className={`text-xs font-bold ${isActive('/products') ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'} transition uppercase tracking-widest`}>
              MARKETPLACE
            </Link>
          </nav>

          <div className="h-5 w-px bg-gray-200 hidden md:block" />

          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 hover:bg-gray-50 p-1 pr-1.5 rounded-full transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-black border-2 border-white shadow-sm overflow-hidden shrink-0">
                    {user.avatar ? (
                      <img src={user.avatar.startsWith('http') ? user.avatar : `http://127.0.0.1:8000/storage/${user.avatar}`} className="w-full h-full object-cover" />
                    ) : (
                      user.name?.charAt(0)?.toUpperCase() || '?'
                    )}
                  </div>
                  <div className="hidden lg:block text-left max-w-[100px]">
                    <p className="text-[12px] font-bold text-gray-800 leading-none mb-0.5 truncate">{user.name || 'User'}</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">My Account</p>
                  </div>
                  <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform hidden sm:block ${isProfileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>

                {/* Khmer24 Style Dropdown */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-100 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150 origin-top-right">
                    <div className="px-4 py-3 border-b border-gray-50 mb-1">
                      <p className="text-sm font-black text-gray-800 uppercase tracking-tight">{user.name}</p>
                      <p className="text-xs text-gray-400 font-medium truncate">{user.email}</p>
                    </div>

                    <Link to="/profile" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                      <svg className="w-5 h-5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                      My Dashboard
                    </Link>

                    <Link to="/profile?tab=ads" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                      <svg className="w-5 h-5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                      My Ads Management
                    </Link>

                    <Link to="/inbox" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                      <svg className="w-5 h-5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
                      Messages
                    </Link>

                    {user.role === 'admin' && (
                      <Link to="/admin" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors border-y border-blue-100/50 my-1">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                        Admin Dashboard
                      </Link>
                    )}

                    <div className="h-px bg-gray-50 my-1" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 01-3-3h4a3 3 0 013 3v1"/></svg>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-4 mr-1 sm:mr-0">
                <Link to="/login" className="text-[11px] sm:text-xs font-black text-gray-600 hover:text-blue-600 transition uppercase tracking-widest">
                  LOGIN
                </Link>
                <div className="h-4 w-px bg-gray-200 hidden xs:block" />
                <Link to="/register" className="text-[11px] sm:text-xs font-black text-gray-600 hover:text-blue-600 transition uppercase tracking-widest hidden xs:block">
                  REGISTER
                </Link>
              </div>
            )}

            <Link
              to="/sell"
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-md font-black text-[10px] sm:text-[11px] shadow-lg shadow-blue-600/20 transition active:scale-95 flex items-center gap-1.5 uppercase tracking-widest"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
              <span className="hidden xs:inline">POST AD</span>
              <span className="xs:hidden">SELL</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] md:hidden animate-in fade-in duration-200" onClick={() => setIsMobileMenuOpen(false)} />
          <div
            ref={mobileMenuRef}
            className="fixed inset-y-0 left-0 w-[280px] bg-white z-[70] md:hidden flex flex-col shadow-2xl animate-in slide-in-from-left duration-300"
          >
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-blue-600 text-white">
              <div className="flex items-center gap-2 italic font-black text-lg">
                SABAY SHOP
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 -mr-2 text-white/80 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-2">
              <div className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Main Menu</div>
              <Link to="/" className={`flex items-center gap-3 px-6 py-3.5 font-bold text-sm ${isActive('/') ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' : 'text-gray-600'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                Home
              </Link>
              <Link to="/products" className={`flex items-center gap-3 px-6 py-3.5 font-bold text-sm ${isActive('/products') ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' : 'text-gray-600'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h12l1 12H4L5 9z"/></svg>
                Marketplace
              </Link>

              {user ? (
                <>
                  <div className="px-4 mt-6 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">My Account</div>
                  <Link to="/profile" className={`flex items-center gap-3 px-6 py-3.5 font-bold text-sm ${isActive('/profile') ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' : 'text-gray-600'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                    My Dashboard
                  </Link>
                  <Link to="/profile?tab=ads" className="flex items-center gap-3 px-6 py-3.5 font-bold text-sm text-gray-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                    Manage My Ads
                  </Link>
                  <Link to="/inbox" className={`flex items-center gap-3 px-6 py-3.5 font-bold text-sm ${isActive('/inbox') ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' : 'text-gray-600'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
                    Messages
                  </Link>
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-6 py-3.5 font-bold text-sm text-red-500 mt-4">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 01-3-3h4a3 3 0 013 3v1"/></svg>
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="px-6 py-6 space-y-3">
                  <Link to="/login" className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg font-bold shadow-lg shadow-blue-600/20">Login</Link>
                  <Link to="/register" className="block w-full border border-gray-200 text-gray-700 text-center py-3 rounded-lg font-bold">Register</Link>
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 mt-auto">
              <p className="text-[10px] font-black text-gray-400 uppercase text-center tracking-widest">&copy; 2026 SABAY SHOP. ALL RIGHTS RESERVED.</p>
            </div>
          </div>
        </>
      )}
    </header>
  );
};
