import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { getImageUrl } from '../../utils/imageUrl';

export const Header = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
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

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

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
    <header className="bg-white dark:bg-[#16171d] border-b border-gray-200 dark:border-gray-800 h-14 flex items-center transition-colors duration-300">
      <div className="container mx-auto px-4 max-w-7xl flex justify-between items-center">
        
        <div className="flex items-center gap-4">
          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="mobile-menu-trigger p-2 -ml-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 md:hidden transition-colors"
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
            <span className="text-lg font-bold text-gray-800 dark:text-gray-100 tracking-tight hidden xs:block">SHOP</span>
          </Link>
        </div>

        {/* Action Area */}
        <div className="flex items-center gap-2 sm:gap-5">
          <nav className="hidden md:flex items-center gap-5">
            <Link to="/" className={`text-xs font-bold ${isActive('/') ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400 hover:text-blue-600'} transition uppercase tracking-widest`}>
              {t('common.home')}
            </Link>
            <Link to="/products" className={`text-xs font-bold ${isActive('/products') ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400 hover:text-blue-600'} transition uppercase tracking-widest`}>
              {t('common.marketplace')}
            </Link>
          </nav>

          <div className="h-5 w-px bg-gray-200 dark:bg-gray-800 hidden md:block" />

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Dark Mode Toggle - Hidden on Mobile, moved to Sidebar */}
            <button
              onClick={toggleTheme}
              className="relative hidden md:flex items-center h-9 p-1 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-all duration-500 hover:ring-4 hover:ring-blue-500/10 group overflow-hidden w-9 md:hover:w-24 shrink-0"
            >
              <div className={`flex items-center justify-center size-7 rounded-full shadow-md transition-all duration-500 z-10 ${theme === 'dark' ? 'md:group-hover:translate-x-[56px] bg-gray-700 text-yellow-300' : 'translate-x-0 bg-white text-orange-500'}`}>
                {theme === 'light' ? (
                  <svg className="size-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"/></svg>
                ) : (
                  <svg className="size-4" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg>
                )}
              </div>
              <span className={`absolute left-9 text-[10px] font-black uppercase tracking-widest opacity-0 md:group-hover:opacity-100 transition-all duration-300 whitespace-nowrap text-gray-500 dark:text-gray-400 ${theme === 'dark' ? 'md:group-hover:left-3' : 'md:group-hover:left-9'}`}>
                {theme === 'light' ? 'Light' : 'Dark'}
              </span>
            </button>

            {/* Language Switcher - Hidden on Mobile, moved to Sidebar */}
            <div className="hidden md:flex bg-gray-100 dark:bg-gray-800 p-1 rounded-full border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => changeLanguage('km')}
                className={`px-2 py-1 rounded-full text-[10px] font-black transition-all ${i18n.resolvedLanguage === 'km' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
              >
                KH
              </button>
              <button
                onClick={() => changeLanguage('en')}
                className={`px-2 py-1 rounded-full text-[10px] font-black transition-all ${i18n.resolvedLanguage === 'en' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
              >
                EN
              </button>
            </div>

            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 p-1 pr-1.5 rounded-full transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-black border-2 border-white dark:border-gray-800 shadow-sm overflow-hidden shrink-0">
                    {user.avatar ? (
                      <img src={getImageUrl(user.avatar)} className="w-full h-full object-cover" />
                    ) : (
                      user.name?.charAt(0)?.toUpperCase() || '?'
                    )}
                  </div>
                  <div className="hidden lg:block text-left max-w-[100px]">
                    <p className="text-[12px] font-bold text-gray-800 dark:text-gray-100 leading-none mb-0.5 truncate">{user.name || 'User'}</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">My Account</p>
                  </div>
                  <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform hidden sm:block ${isProfileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>

                {/* Style Dropdown */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#1f2028] border border-gray-100 dark:border-gray-800 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150 origin-top-right">
                    <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-800 mb-1">
                      <p className="text-sm font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight">{user.name}</p>
                      <p className="text-xs text-gray-400 font-medium truncate">{user.email}</p>
                    </div>

                    <Link to="/profile" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-gray-800 hover:text-blue-600 transition-colors">
                      <svg className="w-5 h-5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                      {t('common.dashboard')}
                    </Link>

                    <Link to="/profile?tab=ads" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-gray-800 hover:text-blue-600 transition-colors">
                      <svg className="w-5 h-5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                      {t('common.my_ads')}
                    </Link>

                    <Link to="/inbox" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-gray-800 hover:text-blue-600 transition-colors">
                      <svg className="w-5 h-5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
                      {t('common.messages')}
                    </Link>

                    {user.role === 'admin' && (
                      <Link to="/admin" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors border-y border-blue-100/50 dark:border-blue-900/50 my-1">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                        Admin Dashboard
                      </Link>
                    )}

                    <div className="h-px bg-gray-50 dark:bg-gray-800 my-1" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                    >
                      <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 01-3-3h4a3 3 0 013 3v1"/></svg>
                      {t('common.logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-4 mr-1 sm:mr-0">
                <Link to="/login" className="text-[11px] sm:text-xs font-black text-gray-600 dark:text-gray-400 hover:text-blue-600 transition uppercase tracking-widest">
                  {t('common.login')}
                </Link>
                <div className="h-4 w-px bg-gray-200 dark:bg-gray-800 hidden xs:block" />
                <Link to="/register" className="text-[11px] sm:text-xs font-black text-gray-600 dark:text-gray-400 hover:text-blue-600 transition uppercase tracking-widest hidden xs:block">
                  {t('common.register')}
                </Link>
              </div>
            )}

            <Link
              to="/sell"
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-md font-black text-[10px] sm:text-[11px] shadow-lg shadow-blue-600/20 transition active:scale-90 flex items-center gap-1.5 uppercase tracking-widest"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
              <span className="hidden xs:inline">{t('common.post_ad')}</span>
              <span className="xs:hidden">{t('common.sell')}</span>
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
            className="fixed inset-y-0 left-0 w-[280px] bg-white dark:bg-[#16171d] z-[70] md:hidden flex flex-col shadow-2xl animate-in slide-in-from-left duration-300 transition-colors border-r dark:border-gray-800"
          >
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-blue-600 dark:bg-blue-700 text-white">
              <div className="flex items-center gap-2 italic font-black text-lg">
                SABAY SHOP
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 -mr-2 text-white/80 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-2">
              {/* Mobile Quick Toggles (Language & Theme) */}
              <div className="px-4 py-4 flex items-center justify-between border-b border-gray-50 dark:border-gray-800 mb-2">
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => changeLanguage('km')}
                        className={`px-4 py-1.5 rounded-md text-xs font-black transition-all ${i18n.resolvedLanguage === 'km' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400'}`}
                    >
                        KH
                    </button>
                    <button
                        onClick={() => changeLanguage('en')}
                        className={`px-4 py-1.5 rounded-md text-xs font-black transition-all ${i18n.resolvedLanguage === 'en' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400'}`}
                    >
                        EN
                    </button>
                </div>

                <button
                    onClick={toggleTheme}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                >
                    {theme === 'light' ? (
                        <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"/></svg>
                    ) : (
                        <svg className="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg>
                    )}
                    <span className="text-[10px] font-black uppercase tracking-widest">{theme}</span>
                </button>
              </div>
              <div className="px-4 py-2 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Main Menu</div>
              <Link to="/" className={`flex items-center gap-3 px-6 py-3.5 font-bold text-sm transition-colors ${isActive('/') ? 'bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 border-r-4 border-blue-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                {t('common.home')}
              </Link>
              <Link to="/products" className={`flex items-center gap-3 px-6 py-3.5 font-bold text-sm transition-colors ${isActive('/products') ? 'bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 border-r-4 border-blue-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h12l1 12H4L5 9z"/></svg>
                {t('common.marketplace')}
              </Link>

              {user ? (
                <>
                  <div className="px-4 mt-6 py-2 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t('common.account')}</div>
                  <Link to="/profile" className={`flex items-center gap-3 px-6 py-3.5 font-bold text-sm transition-colors ${isActive('/profile') ? 'bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 border-r-4 border-blue-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                    {t('common.dashboard')}
                  </Link>
                  <Link to="/profile?tab=ads" className="flex items-center gap-3 px-6 py-3.5 font-bold text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                    {t('common.my_ads')}
                  </Link>
                  <Link to="/inbox" className={`flex items-center gap-3 px-6 py-3.5 font-bold text-sm transition-colors ${isActive('/inbox') ? 'bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 border-r-4 border-blue-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
                    {t('common.messages')}
                  </Link>
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-6 py-3.5 font-bold text-sm text-red-500 mt-4 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 01-3-3h4a3 3 0 013 3v1"/></svg>
                    {t('common.logout')}
                  </button>
                </>
              ) : (
                <div className="px-6 py-6 space-y-3">
                  <Link to="/login" className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg font-bold shadow-lg shadow-blue-600/20 active:scale-95 transition-transform">{t('common.login')}</Link>
                  <Link to="/register" className="block w-full border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 text-center py-3 rounded-lg font-bold hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 transition-all">{t('common.register')}</Link>
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 mt-auto transition-colors">
              <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase text-center tracking-widest">&copy; 2026 SABAY SHOP. ALL RIGHTS RESERVED.</p>
            </div>
          </div>
        </>
      )}
    </header>
  );
};
