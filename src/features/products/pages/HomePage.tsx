import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { ProductCard } from '../components/ProductCard';
import { categoryApi } from '../../categories/services/categoryApi';
import { type Category } from '../../categories/types/category.types';
import api from '../../../services/api';
import { getImageUrl } from '../../../utils/imageUrl';

const CategoryIcon = ({ cat, className = "" }: { cat: Category, className?: string }) => {
  if (cat.image_url) {
    return <img src={getImageUrl(cat.image_url)} className={`object-contain ${className}`} alt={cat.name} />;
  }
  return (
    <div className={className}>
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"/></svg>
    </div>
  );
};

export const HomePage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');

  useEffect(() => {
    categoryApi.getAll().then(res => setCategories(Array.isArray(res.data) ? res.data : res.data.data || []));
    api.get('/provinces').then(res => setProvinces(Array.isArray(res.data) ? res.data : res.data.data || []));
  }, []);

  const { products, loading } = useProducts({ page: 1 });

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('keyword', searchQuery);
    if (selectedProvince) params.set('province_id', selectedProvince);
    navigate(`/products?${params.toString()}`);
  };

  const browseCategory = (id: number) => {
    navigate(`/products?category_id=${id}`);
  };

  const mainCategories = categories.filter(c => !c.parent_id);

  return (
    <div className="min-h-screen bg-[#f1f2f6] text-gray-900 antialiased pb-20 font-sans">
      
      {/* Khmer24 Style Header Search */}
      <div className="bg-white border-b border-gray-200 py-4 sticky top-14 z-40 shadow-sm">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col md:flex-row gap-2">
            <div className="flex-grow relative">
              <input
                type="text"
                placeholder="What are you looking for..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-4 pr-10 py-2.5 border border-[#ced4da] rounded-md focus:border-blue-500 focus:ring-0 outline-none transition placeholder:text-gray-400 font-medium text-sm"
              />
              <button onClick={handleSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </button>
            </div>

            <div className="md:w-56 relative">
              <select
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
                className="w-full px-3 py-2.5 border border-[#ced4da] rounded-md appearance-none bg-white focus:border-blue-500 outline-none transition text-gray-700 font-bold text-sm"
              >
                <option value="">All Cambodia</option>
                {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
              </div>
            </div>

            <button
              onClick={handleSearch}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-md font-bold transition flex items-center justify-center gap-2 shadow-sm uppercase tracking-wider text-xs"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl mt-3">

        {/* Browse By Category Section */}
        <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm">
            <h2 className="text-base font-bold mb-4 text-gray-800">Browse By Category</h2>
            <ul className="text-center grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1.5">
                {mainCategories.map((cat) => (
                    <li key={cat.id}>
                        <button
                            onClick={() => browseCategory(cat.id)}
                            className="block w-full h-full group bg-white rounded cursor-pointer active:opacity-50 p-2.5 transition-all hover:bg-[#f8f9fa]"
                        >
                            <div className="mx-auto bg-[#e9ecef] rounded-full mt-1 group-hover:bg-[#dee2e6] transition-all size-14 flex items-center justify-center p-2.5">
                                <CategoryIcon cat={cat} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300" />
                            </div>
                            <p className="overflow-hidden text-ellipsis mt-2.5 text-[13px] font-medium text-gray-800 group-hover:text-blue-600 leading-tight">
                                {cat.name}
                            </p>
                        </button>
                    </li>
                ))}
            </ul>
        </div>

        {/* Latest Listings */}
        <div className="mt-5">
            <div className="flex items-center justify-between mb-3 px-1 border-b border-gray-200 pb-1.5">
                <h2 className="text-sm font-bold text-gray-800 uppercase tracking-tight">Recent Ads</h2>
                <Link to="/products" className="text-xs font-bold text-blue-600 hover:underline">View All</Link>
            </div>

            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="bg-white border border-gray-200 rounded-md h-72 animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {products.slice(0, 20).map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}
        </div>

      </div>
    </div>
  );
};
