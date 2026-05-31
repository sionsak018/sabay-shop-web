import { Outlet, Link } from 'react-router-dom';
import { Header } from './Header';

export const Layout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100 text-gray-900 antialiased font-sans">
      
      {/* Khmer24 Style Global Header */}
      <Header />
      
      {/* Main Content Area */}
      <main className="flex-grow w-full">
        <Outlet />
      </main>
      
      {/* Comprehensive Khmer24 Style Footer */}
      <footer className="w-full bg-white border-t border-gray-200 mt-auto">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            
            {/* Branding & Mission */}
            <div className="space-y-4">
              <Link to="/" className="flex items-center gap-2 group">
                <div className="bg-blue-600 text-white font-black px-2 py-1 rounded text-xl italic group-hover:bg-blue-700 transition">
                  SABAY
                </div>
                <span className="text-xl font-bold text-gray-800 tracking-tight">SHOP</span>
              </Link>
              <p className="text-sm text-gray-500 leading-relaxed">
                Sabay Shop is the leading free classifieds website in Cambodia. We connect buyers and sellers in a simple, fast, and secure way.
              </p>
            </div>

            {/* Help & Support */}
            <div>
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-6">Help & Support</h3>
              <ul className="space-y-3 text-sm font-bold text-gray-500">
                <li><Link to="#" className="hover:text-blue-600 transition">How to sell on Sabay Shop</Link></li>
                <li><Link to="#" className="hover:text-blue-600 transition">Safety Tips</Link></li>
                <li><Link to="#" className="hover:text-blue-600 transition">Contact Us</Link></li>
                <li><Link to="#" className="hover:text-blue-600 transition">FAQ</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-6">Company</h3>
              <ul className="space-y-3 text-sm font-bold text-gray-500">
                <li><Link to="#" className="hover:text-blue-600 transition">About Us</Link></li>
                <li><Link to="#" className="hover:text-blue-600 transition">Terms & Conditions</Link></li>
                <li><Link to="#" className="hover:text-blue-600 transition">Privacy Policy</Link></li>
                <li><Link to="#" className="hover:text-blue-600 transition">Advertising</Link></li>
              </ul>
            </div>

            {/* Connect with Us */}
            <div>
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-6">Connect with Us</h3>
              <div className="flex gap-4 mb-6">
                <a href="#" className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition shadow-sm">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="#" className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center text-white hover:bg-pink-700 transition shadow-sm">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
              </div>
              <p className="text-xs font-bold text-gray-800 uppercase tracking-widest mb-4">Download Our App</p>
              <div className="flex flex-col gap-2">
                 <div className="bg-black text-white px-4 py-2 rounded-md flex items-center gap-3 w-44 cursor-pointer hover:bg-gray-900 transition border border-gray-800">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.523 15.341c-.551 0-1.002.451-1.002 1.002 0 .553.451 1.002 1.002 1.002.553 0 1.002-.449 1.002-1.002 0-.551-.449-1.002-1.002-1.002zm3.743-3.155c-.246-.221-.58-.316-.9-.251l-10.435 2.145c-.321.066-.574.305-.66.621l-2.124 7.641c-.085.313.012.646.251.867.164.152.375.231.594.231.107 0 .217-.021.318-.061l10.434-4.145c.31-.122.529-.408.57-.738l1.373-10.31c.045-.33-.081-.662-.326-.882zm-4.143 5.378c-.773 0-1.4-.627-1.4-1.4s.627-1.4 1.4-1.4 1.4.627 1.4 1.4-.627 1.4-1.4 1.4zM22.5 12c0-5.799-4.701-10.5-10.5-10.5S1.5 6.201 1.5 12 6.201 22.5 12 22.5 22.5 17.799 22.5 12zM12 21c-4.963 0-9-4.037-9-9s4.037-9 9-9 9 4.037 9 9-4.037 9-9 9z"/></svg>
                    <div>
                      <p className="text-[10px] uppercase leading-none">Download on</p>
                      <p className="text-sm font-bold leading-tight">App Store</p>
                    </div>
                 </div>
                 <div className="bg-black text-white px-4 py-2 rounded-md flex items-center gap-3 w-44 cursor-pointer hover:bg-gray-900 transition border border-gray-800">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M3.609 1.814L13.792 12 3.609 22.186c-.18.18-.309.43-.309.727 0 .58.47.1.47.1l.006.006 10.183-5.88 4.398 4.398c.371.371.973.371 1.344 0l4.398-4.398-14.58-8.418L3.3 1.087s-.47-.48-.47.1c0 .297.129.547.309.727z"/></svg>
                    <div>
                      <p className="text-[10px] uppercase leading-none">Get it on</p>
                      <p className="text-sm font-bold leading-tight">Google Play</p>
                    </div>
                 </div>
              </div>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 font-bold text-gray-400 text-xs">
              <span>&copy; {new Date().getFullYear()} Sabay Shop</span>
              <span className="text-gray-200 select-none">&bull;</span>
              <span className="text-[10px] tracking-widest bg-gray-50 text-gray-400 px-2 py-0.5 rounded border border-gray-100">CAMBODIA'S #1 MARKETPLACE</span>
            </div>

            <div className="flex items-center gap-6 text-[11px] font-bold text-gray-400 uppercase tracking-tighter">
              <Link to="#" className="hover:text-blue-600 transition">Sitemap</Link>
              <Link to="#" className="hover:text-blue-600 transition">Mobile View</Link>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
};
