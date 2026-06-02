import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { ProductCard } from '../components/ProductCard';
import { ProductSkeleton } from '../components/ProductSkeleton';
import { HomeSlider } from '../components/HomeSlider';
import { categoryApi } from '../../categories/services/categoryApi';
import { type Category } from '../../categories/types/category.types';
import api from '../../../services/api';
import { getImageUrl } from '../../../utils/imageUrl';

const CategoryIcon = ({ cat, className = "" }: { cat: Category, className?: string }) => {
  if (cat.image_url) {
    return <img src={getImageUrl(cat.image_url)} className={`w-full h-full object-cover ${className}`} alt={cat.name} />;
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
  const [activeKeyword, setActiveKeyword] = useState('');

  useEffect(() => {
    categoryApi.getAll().then(res => setCategories(Array.isArray(res.data) ? res.data : res.data.data || []));
  }, []);

  const { products, loading, error } = useProducts({
    page: 1,
    keyword: activeKeyword || undefined
  });

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setActiveKeyword(searchQuery);
    } else {
      setActiveKeyword('');
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setActiveKeyword('');
  };

  const browseCategory = (id: number) => {
    navigate(`/products?category_id=${id}`);
  };

  const mainCategories = categories.filter(c => !c.parent_id);

  return (
    <div className="min-h-screen bg-[#f1f2f6] dark:bg-[#08060d] text-gray-900 dark:text-gray-100 antialiased pb-20 font-sans transition-colors duration-300">
      
      {/* Khmer24 Style Header Search */}
      <div className="bg-white dark:bg-[#16171d] border-b border-gray-200 dark:border-gray-800 py-3 sm:py-4 sticky top-14 z-40 shadow-sm transition-colors">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-row gap-2">
            <div className="flex-grow relative">
              <input
                type="text"
                placeholder="What are you looking for..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-4 pr-10 py-2 sm:py-2.5 bg-white dark:bg-[#1f2028] border border-[#ced4da] dark:border-gray-700 rounded-md focus:border-blue-500 focus:ring-0 outline-none transition placeholder:text-gray-400 font-medium text-sm text-gray-900 dark:text-gray-100"
              />
              <button onClick={handleSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </button>
            </div>

            <button
              onClick={handleSearch}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-8 py-2 sm:py-2.5 rounded-md font-bold transition flex items-center justify-center gap-2 shadow-sm uppercase tracking-wider text-[11px] sm:text-xs shrink-0"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl mt-2 sm:mt-3">

        {/* Auto Slider */}
        <HomeSlider />

        {/* Browse By Category Section */}
        <div className="bg-white dark:bg-[#1f2028] border border-gray-200 dark:border-gray-800 rounded-md p-3 sm:p-4 shadow-sm transition-colors">
            <h2 className="text-sm sm:text-base font-bold mb-3 sm:mb-4 text-gray-800 dark:text-gray-100">Browse By Category</h2>
            <ul className="text-center grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-6 gap-1 sm:gap-2">
                {mainCategories.map((cat) => (
                    <li key={cat.id}>
                        <button
                            onClick={() => browseCategory(cat.id)}
                            className="block w-full h-full group bg-white dark:bg-[#1f2028] rounded cursor-pointer active:opacity-50 p-1.5 sm:p-2.5 transition-all hover:bg-[#f8f9fa] dark:hover:bg-[#16171d]"
                        >
                            <div className="mx-auto bg-[#e9ecef] dark:bg-gray-800 rounded-full mt-1 group-hover:bg-[#dee2e6] dark:group-hover:bg-gray-700 transition-all size-10 sm:size-14 flex items-center justify-center overflow-hidden">
                                <CategoryIcon cat={cat} className="w-full h-full group-hover:scale-110 transition-transform duration-300" />
                            </div>
                            <p className="overflow-hidden text-ellipsis mt-1.5 sm:mt-2.5 text-[10px] sm:text-[13px] font-bold text-gray-700 dark:text-gray-300 group-hover:text-blue-600 leading-tight">
                                {cat.name}
                            </p>
                        </button>
                    </li>
                ))}
            </ul>
        </div>

        {/* Latest Listings */}
        <div className="mt-5">
            <div className="flex items-center justify-between mb-3 px-1 border-b border-gray-200 dark:border-gray-800 pb-1.5">
                <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 uppercase tracking-tight">
                    {activeKeyword ? `Results for "${activeKeyword}"` : 'Recent Ads'}
                </h2>
                {activeKeyword ? (
                    <button onClick={clearSearch} className="text-xs font-bold text-red-600 hover:underline">Clear Search</button>
                ) : (
                    <Link to="/products" className="text-xs font-bold text-blue-600 hover:underline">View All</Link>
                )}
            </div>

            {error ? (
                <div className="bg-white dark:bg-[#1f2028] border border-red-100 dark:border-red-900/30 rounded-md p-6 text-center shadow-sm">
                    <p className="text-red-500 font-bold mb-2">Failed to load products</p>
                    <button onClick={() => setActiveKeyword(activeKeyword)} className="text-xs text-blue-600 font-bold hover:underline">Try Again</button>
                </div>
            ) : loading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {[...Array(10)].map((_, i) => (
                        <ProductSkeleton key={i} />
                    ))}
                </div>
            ) : products.length === 0 ? (
                <div className="bg-white dark:bg-[#1f2028] border border-gray-200 dark:border-gray-800 rounded-md p-10 sm:p-20 text-center shadow-sm transition-colors">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 uppercase">No results found</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mb-6 sm:mb-8 font-medium">Try different keywords or browse categories.</p>
                    {activeKeyword && (
                        <button onClick={clearSearch} className="bg-blue-600 text-white px-8 py-2 rounded font-bold text-xs uppercase shadow-md transition active:scale-95">Show Recent Ads</button>
                    )}
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
