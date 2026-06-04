import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { useTheme } from '../../../context/ThemeContext';
import { useTranslation } from 'react-i18next';

interface MenuItem {
  path?: string;
  label: string;
  icon: React.ReactNode;
  children?: { path: string; label: string }[];
}

export const AdminLayout = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Categories', 'Custom Fields', 'Locations', 'User Access']);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const menuItems: MenuItem[] = [
    {
      path: '/admin',
      label: t('admin.dashboard'),
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
    },
    {
      label: t('admin.categories'),
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"/></svg>,
      children: [
        { path: '/admin/main-categories', label: t('admin.main_categories') },
        { path: '/admin/sub-categories', label: t('admin.sub_categories') },
      ]
    },
    {
      label: t('admin.custom_fields'),
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>,
      children: [
        { path: '/admin/attributes', label: t('admin.field_list') },
        { path: '/admin/category-fields', label: t('admin.assign_to_category') },
      ]
    },
    {
      path: '/admin/products',
      label: t('admin.all_products'),
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
    },
    {
      label: t('admin.locations'),
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
      children: [
        { path: '/admin/provinces', label: t('admin.provinces') },
        { path: '/admin/districts', label: t('admin.districts') },
        { path: '/admin/communes', label: t('admin.communes') },
        { path: '/admin/villages', label: t('admin.villages') },
      ]
    },
    {
      label: t('admin.user_access'),
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>,
      children: [
        { path: '/admin/users', label: t('admin.users') },
        { path: '/admin/roles', label: t('admin.roles') },
        { path: '/admin/permissions', label: t('admin.permissions') },
      ]
    },
    {
      path: '/admin/sliders',
      label: t('admin.sliders'),
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
    },
    {
      path: '/admin/config',
      label: t('admin.settings'),
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
    },
  ];

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const toggleMenu = (label: string) => {
    setExpandedMenus(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-[#08060d] antialiased">
      {/* Sidebar Overlay for Mobile */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-white dark:bg-[#16171d] border-r border-gray-200 dark:border-gray-800 z-50 transform transition-transform duration-300 lg:relative lg:translate-x-0 flex flex-col
        ${isMobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        <div className="h-14 flex items-center justify-between px-5 border-b border-gray-100 dark:border-gray-800">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-blue-600 text-white font-black px-1.5 py-0.5 rounded text-base italic group-hover:bg-blue-700 transition leading-tight">
              SABAY
            </div>
            <span className="text-base font-bold text-gray-800 dark:text-gray-100 tracking-tight uppercase">{t('common.admin')}</span>
          </Link>
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="p-1 text-gray-400 hover:text-red-500 lg:hidden"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5 custom-scrollbar">
          {/* Quick Toggles for Mobile Sidebar */}
          <div className="lg:hidden flex items-center justify-between px-3 py-4 border-b border-gray-50 dark:border-gray-800 mb-2 gap-4">
              <div className="flex bg-gray-100 dark:bg-gray-800/50 p-1 rounded-lg border border-gray-200 dark:border-gray-700 flex-1">
                  <button
                      onClick={() => changeLanguage('km')}
                      className={`flex-1 py-1.5 rounded-md text-[10px] font-black transition-all ${i18n.resolvedLanguage === 'km' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400'}`}
                  >
                      KH
                  </button>
                  <button
                      onClick={() => changeLanguage('en')}
                      className={`flex-1 py-1.5 rounded-md text-[10px] font-black transition-all ${i18n.resolvedLanguage === 'en' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400'}`}
                  >
                      EN
                  </button>
              </div>

              <button
                  onClick={toggleTheme}
                  className="flex items-center justify-center p-2.5 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
              >
                  {theme === 'light' ? (
                      <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"/></svg>
                  ) : (
                      <svg className="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg>
                  )}
              </button>
          </div>

          {menuItems.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedMenus.includes(item.label);
            const isActive = item.path ? location.pathname === item.path : item.children?.some(c => location.pathname === c.path);

            return (
              <div key={item.label} className="space-y-1">
                {item.path ? (
                  <Link
                    to={item.path}
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                      location.pathname === item.path
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-blue-600 dark:hover:text-blue-400'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={() => toggleMenu(item.label)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                        isActive ? 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {item.icon}
                        {item.label}
                      </div>
                      <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"/>
                      </svg>
                    </button>
                    {isExpanded && (
                      <div className="ml-8 space-y-0.5 animate-in slide-in-from-top-1 duration-200">
                        {item.children?.map(child => (
                          <Link
                            key={child.path}
                            to={child.path}
                            onClick={() => setIsMobileSidebarOpen(false)}
                            className={`block px-3 py-1.5 rounded-md text-[12px] font-bold transition-colors ${
                              location.pathname === child.path
                                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/10'
                                : 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                            }`}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/20">
          {/* Quick Toggles for Desktop Sidebar */}
          <div className="hidden lg:flex items-center justify-between px-2 mb-4 gap-2">
              <div className="flex bg-gray-100 dark:bg-gray-800/50 p-1 rounded-lg border border-gray-200 dark:border-gray-700 flex-1">
                  <button
                      onClick={() => changeLanguage('km')}
                      className={`flex-1 py-1 rounded-md text-[9px] font-black transition-all ${i18n.resolvedLanguage === 'km' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400'}`}
                  >
                      KH
                  </button>
                  <button
                      onClick={() => changeLanguage('en')}
                      className={`flex-1 py-1 rounded-md text-[9px] font-black transition-all ${i18n.resolvedLanguage === 'en' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400'}`}
                  >
                      EN
                  </button>
              </div>

              <button
                  onClick={toggleTheme}
                  className="flex items-center justify-center p-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
              >
                  {theme === 'light' ? (
                      <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"/></svg>
                  ) : (
                      <svg className="w-4 h-4 text-yellow-300" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg>
                  )}
              </button>
          </div>

          <div className="flex items-center gap-2.5 px-3 py-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow-sm border-2 border-white dark:border-gray-800">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">

              <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">{user.name}</p>
              <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">{t('admin.super_admin')}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full mt-1 flex items-center gap-2.5 px-3 py-2 rounded-lg text-[10px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 01-3-3h4a3 3 0 013 3v1"/></svg>
            {t('common.logout')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-[#f8fafc] dark:bg-[#08060d]">
        {/* Mobile Header - Improved for iPhone 14 Pro Max & larger screens */}
        <header className="h-16 bg-white dark:bg-[#16171d] border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 lg:hidden sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2.5 -ml-2 text-blue-600 bg-blue-50 dark:bg-blue-900/20 rounded-lg active:scale-95 transition-all shadow-sm flex items-center justify-center"
              aria-label="Open Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7"/>
              </svg>
            </button>
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-blue-600 text-white font-black px-2 py-0.5 rounded text-lg italic leading-tight shadow-sm">SABAY</div>
              <span className="text-sm font-black text-gray-800 dark:text-gray-100 uppercase tracking-tighter hidden xs:block">{t('common.admin')}</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
             <Link to="/profile" className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-xs border-2 border-white dark:border-gray-800 shadow-md ring-1 ring-blue-100 dark:ring-blue-900/30">
                {user.name.charAt(0).toUpperCase()}
             </Link>
          </div>

        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
