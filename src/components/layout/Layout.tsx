import { Outlet, Link, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { useAuth } from '../../features/auth/hooks/useAuth';

export const Layout = () => {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex flex-col min-h-screen bg-[#f1f2f6] dark:bg-[#08060d] text-gray-900 dark:text-gray-100 antialiased font-sans pb-16 md:pb-0 transition-colors duration-300">
      
      {/* Khmer24 Style Global Header */}
      <Header />
      
      {/* Main Content Area */}
      <main className="flex-grow w-full">
        <Outlet />
      </main>

      {/* Khmer24 Style Bottom Navigation - Mobile Only */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#16171d] border-t border-gray-200 dark:border-gray-800 z-[100] md:hidden h-16 flex items-center justify-around px-2 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] transition-colors">
        <Link to="/" className={`flex flex-col items-center gap-1 transition-colors ${isActive('/') ? 'text-blue-600' : 'text-gray-400 dark:text-gray-500'}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
          <span className="text-[9px] font-black uppercase tracking-tighter">Home</span>
        </Link>

        <Link to="/products" className={`flex flex-col items-center gap-1 transition-colors ${isActive('/products') ? 'text-blue-600' : 'text-gray-400 dark:text-gray-500'}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <span className="text-[9px] font-black uppercase tracking-tighter">Search</span>
        </Link>

        {/* Center Post Button - Prominent */}
        <Link to="/sell" className="flex flex-col items-center -mt-8">
          <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-blue-600/40 border-4 border-gray-100 dark:border-gray-900 active:scale-90 transition-transform">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
          </div>
          <span className="text-[9px] font-black uppercase tracking-tighter text-blue-600 mt-1">Post Ad</span>
        </Link>

        <Link to="/inbox" className={`flex flex-col items-center gap-1 transition-colors ${isActive('/inbox') ? 'text-blue-600' : 'text-gray-400 dark:text-gray-500'}`}>
          <div className="relative">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
          </div>
          <span className="text-[9px] font-black uppercase tracking-tighter">Chat</span>
        </Link>

        <Link to={user ? "/profile" : "/login"} className={`flex flex-col items-center gap-1 transition-colors ${isActive('/profile') || isActive('/login') ? 'text-blue-600' : 'text-gray-400 dark:text-gray-500'}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
          <span className="text-[9px] font-black uppercase tracking-tighter">Account</span>
        </Link>
      </nav>

      {/* Comprehensive Khmer24 Style Footer */}
      <footer className="w-full bg-white dark:bg-[#16171d] border-t border-gray-200 dark:border-gray-800 mt-auto transition-colors">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            
            {/* Branding & Mission */}
            <div className="space-y-4">
              <Link to="/" className="flex items-center gap-2 group">
                <div className="bg-blue-600 text-white font-black px-2 py-1 rounded text-xl italic group-hover:bg-blue-700 transition">
                  SABAY
                </div>
                <span className="text-xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">SHOP</span>
              </Link>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Sabay Shop is the leading free classifieds website in Cambodia. We connect buyers and sellers in a simple, fast, and secure way.
              </p>
            </div>

            {/* Help & Support */}
            <div>
              <h3 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-widest mb-6">Help & Support</h3>
              <ul className="space-y-3 text-sm font-bold text-gray-500 dark:text-gray-400">
                <li><Link to="#" className="hover:text-blue-600 transition">How to sell on Sabay Shop</Link></li>
                <li><Link to="#" className="hover:text-blue-600 transition">Safety Tips</Link></li>
                <li><Link to="#" className="hover:text-blue-600 transition">Contact Us</Link></li>
                <li><Link to="#" className="hover:text-blue-600 transition">FAQ</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-widest mb-6">Company</h3>
              <ul className="space-y-3 text-sm font-bold text-gray-500 dark:text-gray-400">
                <li><Link to="#" className="hover:text-blue-600 transition">About Us</Link></li>
                <li><Link to="#" className="hover:text-blue-600 transition">Terms & Conditions</Link></li>
                <li><Link to="#" className="hover:text-blue-600 transition">Privacy Policy</Link></li>
                <li><Link to="#" className="hover:text-blue-600 transition">Advertising</Link></li>
              </ul>
            </div>

            {/* Connect with Us */}
            <div>
              <h3 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-widest mb-6">Connect with Us</h3>
              <div className="flex gap-4 mb-6">
                <a href="#" className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition shadow-sm">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
              </div>
              <p className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-widest mb-4">Download Our App</p>
              <div className="flex flex-col gap-2">
                 <div className="bg-black text-white px-4 py-2 rounded-md flex items-center gap-3 w-44 cursor-pointer hover:bg-gray-900 transition border border-gray-800">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.523 15.341c-.551 0-1.002.451-1.002 1.002 0 .553.451 1.002 1.002 1.002.553 0 1.002-.449 1.002-1.002 0-.551-.449-1.002-1.002-1.002zm3.743-3.155c-.246-.221-.58-.316-.9-.251l-10.435 2.145c-.321.066-.574.305-.66.621l-2.124 7.641c-.085.313.012.646.251.867.164.152.375.231.594.231.107 0 .217-.021.318-.061l10.434-4.145c.31-.122.529-.408.57-.738l1.373-10.31c.045-.33-.081-.662-.326-.882zm-4.143 5.378c-.773 0-1.4-.627-1.4-1.4s.627-1.4 1.4-1.4 1.4.627 1.4 1.4-.627 1.4-1.4 1.4zM22.5 12c0-5.799-4.701-10.5-10.5-10.5S1.5 6.201 1.5 12 6.201 22.5 12 22.5 22.5 17.799 22.5 12zM12 21c-4.963 0-9-4.037-9-9s4.037-9 9-9 9 4.037 9 9-4.037 9-9 9z"/></svg>
                    <div>
                      <p className="text-[10px] uppercase leading-none text-gray-300">Download on</p>
                      <p className="text-sm font-bold leading-tight">App Store</p>
                    </div>
                 </div>
                 <div className="bg-black text-white px-4 py-2 rounded-md flex items-center gap-3 w-44 cursor-pointer hover:bg-gray-900 transition border border-gray-800">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M3.609 1.814L13.792 12 3.609 22.186c-.18.18-.309.43-.309.727 0 .58.47.1.47.1l.006.006 10.183-5.88 4.398 4.398c.371.371.973.371 1.344 0l4.398-4.398-14.58-8.418L3.3 1.087s-.47-.48-.47.1c0 .297.129.547.309.727z"/></svg>
                    <div>
                      <p className="text-[10px] uppercase leading-none text-gray-300">Get it on</p>
                      <p className="text-sm font-bold leading-tight">Google Play</p>
                    </div>
                 </div>
              </div>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
            <div className="flex items-center gap-1.5 font-bold text-gray-400 dark:text-gray-500 text-xs">
              <span>&copy; {new Date().getFullYear()} Sabay Shop</span>
              <span className="text-gray-200 dark:text-gray-800 select-none">&bull;</span>
              <span className="text-[10px] tracking-widest bg-gray-50 dark:bg-gray-800 text-gray-400 px-2 py-0.5 rounded border border-gray-100 dark:border-gray-700 uppercase">CAMBODIA'S #1 MARKETPLACE</span>
            </div>

            <div className="flex items-center gap-6 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tighter">
              <Link to="#" className="hover:text-blue-600 transition">Sitemap</Link>
              <Link to="#" className="hover:text-blue-600 transition">Mobile View</Link>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
};
