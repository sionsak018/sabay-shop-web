import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { ProductCard } from '../components/ProductCard';
import { HomeSlider } from '../components/HomeSlider';
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
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    categoryApi.getAll().then(res => setCategories(Array.isArray(res.data) ? res.data : res.data.data || []));
  }, []);

  const { products, loading } = useProducts({ page: 1 });

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('keyword', searchQuery);
    navigate(`/products?${params.toString()}`);
  };

  const browseCategory = (id: number) => {
    navigate(`/products?category_id=${id}`);
  };

  const mainCategories = categories.filter(c => !c.parent_id);

  return (
    <div className="min-h-screen bg-[#f1f2f6] text-gray-900 antialiased pb-20 font-sans">
      
      {/* Khmer24 Style Header Search */}
      <div className="bg-white border-b border-gray-200 py-3 sm:py-4 sticky top-14 z-40 shadow-sm">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col md:flex-row gap-2">
            <div className="flex-grow relative order-1">
              <input
                type="text"
                placeholder="What are you looking for..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-4 pr-10 py-2 sm:py-2.5 border border-[#ced4da] rounded-md focus:border-blue-500 focus:ring-0 outline-none transition placeholder:text-gray-400 font-medium text-sm"
              />
              <button onClick={handleSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </button>
            </div>

            <div className="flex gap-2 order-2">
              <button
                onClick={handleSearch}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-2 sm:py-2.5 rounded-md font-bold transition flex items-center justify-center gap-2 shadow-sm uppercase tracking-wider text-[11px] sm:text-xs min-w-[100px]"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl mt-2 sm:mt-3">

        {/* Auto Slider */}
        <HomeSlider />

        {/* Browse By Category Section */}
        <div className="bg-white border border-gray-200 rounded-md p-3 sm:p-4 shadow-sm">
            <h2 className="text-sm sm:text-base font-bold mb-3 sm:mb-4 text-gray-800">Browse By Category</h2>
            <ul className="text-center grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-6 gap-1 sm:gap-2">
                {mainCategories.map((cat) => (
                    <li key={cat.id}>
                        <button
                            onClick={() => browseCategory(cat.id)}
                            className="block w-full h-full group bg-white rounded cursor-pointer active:opacity-50 p-1.5 sm:p-2.5 transition-all hover:bg-[#f8f9fa]"
                        >
                            <div className="mx-auto bg-[#e9ecef] rounded-full mt-1 group-hover:bg-[#dee2e6] transition-all size-10 sm:size-14 flex items-center justify-center p-1.5 sm:p-2.5">
                                <CategoryIcon cat={cat} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300" />
                            </div>
                            <p className="overflow-hidden text-ellipsis mt-1.5 sm:mt-2.5 text-[10px] sm:text-[13px] font-bold text-gray-700 group-hover:text-blue-600 leading-tight">
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
