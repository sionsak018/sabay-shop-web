import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { ProductCard } from '../components/ProductCard';
import { ProductSkeleton } from '../components/ProductSkeleton';
import { HomeSlider } from '../components/HomeSlider';
import { categoryApi } from '../../categories/services/categoryApi';
import { type Category } from '../../categories/types/category.types';
import SmartImage from '../../../components/common/SmartImage';
import { LocationPickerModal } from '../../../components/common/LocationPickerModal';
import { useTranslation } from 'react-i18next';

const CategoryIcon = ({ cat, className = "" }: { cat: Category, className?: string }) => {
  if (cat.image_url) {
    return <SmartImage src={cat.image_url} className={`w-full h-full object-cover ${className}`} alt={cat.name} width={160} height={160} widths={[80, 160, 320]} sizes="64px" />;
  }
  return (
    <div className={className}>
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"/></svg>
    </div>
  );
};

export const HomePage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // New Filter States
  const [activeCategoryId, setActiveCategoryId] = useState<number | undefined>();
  const [activeProvinceId, setActiveProvinceId] = useState<string>('');
  const [activeDistrictId, setActiveDistrictId] = useState<string>('');
  const [locationName, setLocationName] = useState('');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  useEffect(() => {
    // Optimization: Check if we already have categories in session storage to show them instantly
    const cachedCats = sessionStorage.getItem('cached_categories');
    if (cachedCats) {
        setCategories(JSON.parse(cachedCats));
        setLoadingCategories(false);
    }

    categoryApi.getAll()
      .then(res => {
          const data = Array.isArray(res.data) ? res.data : res.data.data || [];
          setCategories(data);
          sessionStorage.setItem('cached_categories', JSON.stringify(data));
      })
      .finally(() => setLoadingCategories(false));
  }, []);

  const productFilters = {
    page: 1,
    category_id: activeCategoryId?.toString(),
    province_id: activeProvinceId || undefined,
    district_id: activeDistrictId || undefined,
  };

  const { products, loading, error } = useProducts(productFilters);

  const getResultsTitle = () => {
    if (activeRoot) return t('home.results_in_cat', { name: activeRoot.name });
    if (activeProvinceId !== '') return t('home.results_in_loc', { name: locationName || t('common.all_cambodia') });
    return t('home.recent_ads');
  };

  const clearSearch = () => {
    setActiveCategoryId(undefined);
    setActiveProvinceId('');
    setActiveDistrictId('');
    setLocationName('');
  };

  const browseCategory = (id: number) => {
    navigate(`/products?category_id=${id}`);
  };

  // Guarantee a 2-level browse view: root categories (no parent, or an
  // orphaned parent) plus their direct children only. Anything deeper is
  // never treated as a root or as a root's subcategory.
  const categoryIdSet = new Set(categories.map((c) => c.id));
  const rootCategories = categories.filter(
    (c) => !c.parent_id || !categoryIdSet.has(c.parent_id)
  );
  const childrenOf = (parentId: number) =>
    categories.filter((c) => c.parent_id === parentId);

  const resolveRootId = (id: number): number => {
    const byId = new Map(categories.map((c) => [c.id, c]));
    let currentId = id;
    const visited = new Set<number>();
    while (!visited.has(currentId)) {
      visited.add(currentId);
      const current = byId.get(currentId);
      if (!current || !current.parent_id || !categoryIdSet.has(current.parent_id)) break;
      currentId = current.parent_id;
    }
    return currentId;
  };

  const activeRootId = activeCategoryId ? resolveRootId(activeCategoryId) : undefined;
  const activeRoot = activeRootId !== undefined
    ? rootCategories.find((c) => c.id === activeRootId)
    : undefined;

  const displayCategories = activeRoot ? childrenOf(activeRoot.id) : rootCategories;

  return (
    <div className="min-h-screen bg-[#f1f2f6] dark:bg-[#08060d] text-gray-900 dark:text-gray-100 antialiased pb-20 font-sans transition-colors duration-300">
      
      <div className="container mx-auto px-4 max-w-7xl mt-2 sm:mt-3">

        {/* Auto Slider */}
        <HomeSlider />

        {/* Breadcrumb if category selected */}
        {activeRoot && (
            <div className="mb-3 flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide py-2 px-1">
                <button
                  onClick={() => setActiveCategoryId(undefined)}
                  className="text-sm sm:text-base font-bold text-blue-600 dark:text-blue-400 hover:underline transition-colors"
                >
                  {t('common.all_categories')}
                </button>
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                <span className="text-sm sm:text-base font-bold text-gray-500 dark:text-gray-400">
                  {activeRoot.name}
                </span>
            </div>
        )}

        {/* Browse By Category Section */}
        {loadingCategories ? (
            <div className="bg-white dark:bg-[#16171d] border border-gray-200 dark:border-gray-800 rounded-md p-3 sm:p-4 shadow-sm transition-colors mb-3 animate-pulse">
                <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-1/4 mb-4" />
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex flex-col items-center p-2 gap-2">
                            <div className="size-10 sm:size-14 bg-gray-200 dark:bg-gray-800 rounded-full" />
                            <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-full" />
                        </div>
                    ))}
                </div>
            </div>
        ) : (
            <div className="bg-white dark:bg-[#16171d] border border-gray-200 dark:border-gray-800 rounded-md p-3 sm:p-4 shadow-sm transition-colors mb-3">
                <h2 className="text-[13px] sm:text-base font-bold mb-3 sm:mb-4 text-gray-800 dark:text-gray-100">
                    {activeRoot ? t('home.browse_in', { name: activeRoot.name }) : t('home.browse_by_category')}
                </h2>

                <ul className="text-center grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-6 gap-1 sm:gap-2">
                    {displayCategories.map((cat) => {
                        const hasChildren = childrenOf(cat.id).length > 0;
                        return (
                            <li key={cat.id}>
                                <button
                                    onClick={() => {
                                        if (!activeRoot && hasChildren) {
                                            setActiveCategoryId(cat.id);
                                        } else {
                                            browseCategory(cat.id);
                                        }
                                    }}
                                    className={`block w-full h-full group bg-white dark:bg-[#16171d] rounded cursor-pointer active:opacity-50 p-1.5 sm:p-2.5 transition-all hover:bg-[#f8f9fa] dark:hover:bg-[#1f2028] ${activeCategoryId === cat.id ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/10' : ''}`}
                                >
                                    <div className="mx-auto bg-[#e9ecef] dark:bg-gray-700 group-hover:bg-[#dee2e6] dark:group-hover:bg-gray-600 transition-all size-10 sm:size-14 flex items-center justify-center overflow-hidden rounded-full">
                                        <CategoryIcon cat={cat} className="w-full h-full group-hover:scale-110 transition-transform duration-300" />
                                    </div>
                                    <p className="overflow-hidden text-ellipsis mt-1.5 sm:mt-2.5 text-[10px] sm:text-[13px] font-bold text-gray-700 dark:text-gray-300 group-hover:text-blue-600 leading-tight">
                                        {cat.name}
                                    </p>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </div>
        )}

        {/* Latest Listings */}
        <div className="mt-5">
            <div className="flex items-center justify-between mb-3 px-1 border-b border-gray-200 dark:border-gray-800 pb-1.5 gap-2">
                <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 uppercase tracking-tight truncate flex-1">
                    {getResultsTitle()}
                </h2>
                {(activeCategoryId || activeProvinceId) ? (
                    <button onClick={clearSearch} className="text-xs font-bold text-red-600 hover:underline">{t('common.clear_filters')}</button>
                ) : (
                    <Link to="/products" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">{t('common.view_all')}</Link>
                )}
            </div>

            {error ? (
                <div className="bg-white dark:bg-[#16171d] border border-red-100 dark:border-red-900/30 rounded-md p-6 text-center shadow-sm">
                    <p className="text-red-500 font-bold mb-2">Failed to load products</p>
                    <button onClick={() => navigate(0)} className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline">Try Again</button>
                </div>
            ) : loading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {[...Array(10)].map((_, i) => (
                        <ProductSkeleton key={i} />
                    ))}
                </div>
            ) : products.length === 0 ? (
                <div className="bg-white dark:bg-[#16171d] border border-gray-200 dark:border-gray-800 rounded-md p-10 sm:p-20 text-center shadow-sm transition-colors">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 uppercase">{t('home.no_results')}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mb-6 sm:mb-8 font-medium">{t('home.try_browsing')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {products.slice(0, 20).map((product) => (
                        <ProductCard key={product.id} product={product} priority={products.indexOf(product) < 4} />
                    ))}
                </div>
            )}
        </div>

      </div>

      <LocationPickerModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSelect={(data) => {
            setActiveProvinceId(data.province_id);
            setActiveDistrictId(data.district_id);
            setLocationName(data.locationName || '');
        }}
      />
    </div>
  );
};
