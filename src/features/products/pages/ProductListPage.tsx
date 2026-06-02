import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useProducts, type ProductFilters } from '../hooks/useProducts';
import { ProductCard } from '../components/ProductCard';
import { ProductSkeleton } from '../components/ProductSkeleton';
import { categoryApi } from '../../categories/services/categoryApi';
import { type Category } from '../../categories/types/category.types';
import api from '../../../services/api';
import { getImageUrl } from '../../../utils/imageUrl';
import { LocationPickerModal } from '../../../components/common/LocationPickerModal';

interface LocalFilters {
  min_price: string;
  max_price: string;
  province_id: string;
  district_id: string;
  [key: string]: string;
}

const CategoryIcon = ({ cat, className = "" }: { cat: Category, className?: string }) => {
  if (cat.image_url) {
    return <img src={getImageUrl(cat.image_url)} className={`w-full h-full object-cover ${className}`} alt={cat.name} />;
  }
  return (
    <div className={className}>
       <svg className="w-full h-full text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"/></svg>
    </div>
  );
};

export const ProductListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const categoryId = searchParams.get('category_id') || '';
  const keyword = searchParams.get('keyword') || '';
  const provinceIdParam = searchParams.get('province_id') || '';
  const districtIdParam = searchParams.get('district_id') || '';
  const sortParam = searchParams.get('sort') || 'latest';

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [dynamicAttributes, setDynamicAttributes] = useState<any[]>([]);
  const [loadingAttributes, setLoadingAttributes] = useState(false);
  const [page, setPage] = useState(1);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [districtName, setDistrictName] = useState('');

  const [localFilters, setLocalFilters] = useState<LocalFilters>(() => {
      const initial: LocalFilters = {
          min_price: searchParams.get('min_price') || '',
          max_price: searchParams.get('max_price') || '',
          province_id: provinceIdParam,
          district_id: districtIdParam,
          sort: sortParam,
      };
      searchParams.forEach((val, key) => {
          if (key.startsWith('attr_')) initial[key] = val;
      });
      return initial;
  });

  const [localSearchTerm, setLocalSearchTerm] = useState(keyword);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [expandedAttrs, setExpandedAttrs] = useState<Record<number, boolean>>({});
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalSearchTerm(keyword);
  }, [keyword]);

  const handleSearchButtonClick = () => {
    const params = new URLSearchParams(searchParams);
    if (localSearchTerm.trim()) {
      params.set('keyword', localSearchTerm);
    } else {
      params.delete('keyword');
    }
    setSearchParams(params);
    setPage(1);
  };

  // Sync localFilters with searchParams (Crucial for Breadcrumb Back navigation)
  useEffect(() => {
    const updated: LocalFilters = {
        min_price: searchParams.get('min_price') || '',
        max_price: searchParams.get('max_price') || '',
        province_id: searchParams.get('province_id') || '',
        district_id: searchParams.get('district_id') || '',
        sort: searchParams.get('sort') || 'latest',
    };
    searchParams.forEach((val, key) => {
        if (key.startsWith('attr_')) updated[key] = val;
    });
    setLocalFilters(updated);
    setLocalSearchTerm(searchParams.get('keyword') || '');
  }, [searchParams]);

  useEffect(() => {
    setLoadingCategories(true);
    categoryApi.getAll()
      .then(res => setCategories(Array.isArray(res.data) ? res.data : res.data.data || []))
      .finally(() => setLoadingCategories(false));
    api.get('/provinces').then(res => setProvinces(Array.isArray(res.data) ? res.data : res.data.data || []));
  }, []);

  useEffect(() => {
    if (districtIdParam && provinceIdParam) {
        api.get(`/districts?province_id=${provinceIdParam}`).then(res => {
            const list = Array.isArray(res.data) ? res.data : res.data.data || [];
            const found = list.find((d: any) => String(d.id) === districtIdParam);
            if (found) setDistrictName(found.name);
        });
    } else {
        setDistrictName('');
    }
  }, [districtIdParam, provinceIdParam]);

  useEffect(() => {
    if (categoryId) {
      setLoadingAttributes(true);
      api.get(`/category-attributes/${categoryId}`)
        .then(res => setDynamicAttributes(res.data))
        .finally(() => setLoadingAttributes(false));
    } else {
      setDynamicAttributes([]);
      setLoadingAttributes(false);
    }
  }, [categoryId]);

  const productFilters: ProductFilters = {
    keyword: keyword || undefined,
    category_id: categoryId || undefined,
    min_price: searchParams.get('min_price') || undefined,
    max_price: searchParams.get('max_price') || undefined,
    province_id: searchParams.get('province_id') || undefined,
    district_id: searchParams.get('district_id') || undefined,
    sort: sortParam || undefined,
    page,
  };

  searchParams.forEach((val, key) => {
      if (key.startsWith('attr_')) {
          (productFilters as any)[key] = val;
      }
  });

  const { products, loading, pagination } = useProducts(productFilters);

  const applyFilters = (overrides?: Partial<LocalFilters>) => {
    const filters = { ...localFilters, ...overrides };
    const newParams = new URLSearchParams();
    if (keyword) newParams.set('keyword', keyword);
    if (categoryId) newParams.set('category_id', categoryId);

    if (filters.min_price) newParams.set('min_price', filters.min_price);
    if (filters.max_price) newParams.set('max_price', filters.max_price);
    if (filters.province_id) newParams.set('province_id', filters.province_id);
    if (filters.district_id) newParams.set('district_id', filters.district_id);
    if (filters.sort) newParams.set('sort', filters.sort);

    dynamicAttributes.forEach(attr => {
        const val = filters[`attr_${attr.id}`];
        if (val) newParams.set(`attr_${attr.id}`, val);
    });

    setSearchParams(newParams);
    setPage(1);
    if (overrides) setLocalFilters(prev => ({ ...prev, ...overrides }));
  };

  const setCategory = (id: string) => {
    const newParams = new URLSearchParams();
    if (id) newParams.set('category_id', id);
    if (keyword) newParams.set('keyword', keyword);
    if (provinceIdParam) newParams.set('province_id', provinceIdParam);
    if (sortParam) newParams.set('sort', sortParam);
    setSearchParams(newParams);
    setPage(1);
  };

  const goToPage = (newPage: number) => {
    setPage(newPage);
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const selectedCategory = categories.find(c => String(c.id) === categoryId);
  const mainCategory = selectedCategory?.parent_id ? categories.find(c => c.id === selectedCategory.parent_id) : selectedCategory;
  const subCategories = mainCategory ? categories.filter(c => c.parent_id === mainCategory.id) : [];
  const isSubCategorySelected = selectedCategory && selectedCategory.parent_id;

  const brandAttr = dynamicAttributes.find(a => a.name === 'Brand');

  const provinceName = provinces.find(p => String(p.id) === searchParams.get('province_id'))?.name || 'Cambodia';
  const fullLocationName = districtName ? `${districtName}, ${provinceName}` : provinceName;

  return (
    <div ref={topRef} className="min-h-screen bg-[#f1f2f6] dark:bg-[#08060d] text-gray-900 dark:text-gray-100 pb-20 text-left antialiased font-sans relative transition-colors duration-300">

      {/* Search Bar - Khmer24 Style */}
      <div className="bg-white dark:bg-[#16171d] border-b border-gray-200 dark:border-gray-800 py-3 shadow-sm transition-colors">
        <div className="container mx-auto px-4 max-w-7xl flex gap-2">
             <div className="relative flex-1">
                <input
                    type="text"
                    value={localSearchTerm}
                    onChange={e => setLocalSearchTerm(e.target.value)}
                    placeholder="Search in all categories..."
                    className="w-full bg-[#f8f9fa] dark:bg-[#1f2028] border border-[#dee2e6] dark:border-gray-700 px-4 py-2 rounded focus:bg-white focus:border-blue-500 outline-none text-sm font-medium text-gray-700 dark:text-gray-200 transition-all"
                    onKeyDown={e => {
                        if (e.key === 'Enter') {
                            handleSearchButtonClick();
                        }
                    }}
                />
                <svg className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
             </div>

             <button
                onClick={handleSearchButtonClick}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-8 py-2 rounded font-bold transition flex items-center justify-center shadow-sm uppercase tracking-wider text-[11px] sm:text-xs shrink-0"
             >
                Search
             </button>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl">
        <div className="py-2.5">
          <nav className="flex text-[10px] sm:text-xs font-bold text-gray-400 gap-1.5 items-center overflow-x-auto whitespace-nowrap scrollbar-hide pb-0.5">
            <Link to="/" className="hover:text-blue-600 transition-colors shrink-0">Home</Link>
            {mainCategory && (
              <>
                <svg className="w-2.5 h-2.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
                <button
                    onClick={() => {
                        const params = new URLSearchParams(searchParams);
                        params.set('category_id', String(mainCategory.id));
                        // Clear all attributes when going back to main category
                        Array.from(params.keys()).forEach(key => {
                            if (key.startsWith('attr_')) params.delete(key);
                        });
                        setSearchParams(params);
                    }}
                    className="hover:text-blue-600 truncate max-w-[120px] shrink-0 font-bold"
                >
                    {mainCategory.name}
                </button>
              </>
            )}
            {selectedCategory && selectedCategory.parent_id && (
              <>
                <svg className="w-2.5 h-2.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
                <button
                    onClick={() => {
                        const params = new URLSearchParams(searchParams);
                        // Reset to just the subcategory (clear attributes)
                        Array.from(params.keys()).forEach(key => {
                            if (key.startsWith('attr_')) params.delete(key);
                        });
                        setSearchParams(params);
                    }}
                    className={`truncate max-w-[120px] shrink-0 font-bold ${!Object.keys(localFilters).some(k => k.startsWith('attr_')) ? 'text-gray-500' : 'text-blue-600 hover:underline'}`}
                >
                    {selectedCategory.name}
                </button>
              </>
            )}
            {/* Khmer24 Style Attribute Breadcrumbs - Fixed for Back Navigation */}
            {(() => {
                // Logical Display Order for Breadcrumb: Brand -> Model -> Year -> Body Type -> Others
                const sortedAttrs = [...dynamicAttributes].sort((a, b) => {
                    const order = ['Brand', 'Model', 'Year', 'Condition', 'Body Type'];
                    const idxA = order.indexOf(a.name);
                    const idxB = order.indexOf(b.name);
                    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                    if (idxA !== -1) return -1;
                    if (idxB !== -1) return 1;
                    return 0;
                });

                return sortedAttrs.map((attr, idx) => {
                    const val = localFilters[`attr_${attr.id}`];
                    if (!val) return null;
                    return (
                        <div key={attr.id} className="flex items-center gap-1.5 shrink-0">
                            <svg className="w-2.5 h-2.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
                            <button
                                onClick={() => {
                                    const params = new URLSearchParams(searchParams);
                                    // Back to this level: remove this attribute and all subsequent ones in the logical sequence
                                    for (let i = idx; i < sortedAttrs.length; i++) {
                                        params.delete(`attr_${sortedAttrs[i].id}`);
                                    }
                                    setSearchParams(params);
                                }}
                                className="text-blue-600 font-bold hover:underline"
                            >
                                {val}
                            </button>
                        </div>
                    );
                });
            })()}
            <svg className="w-2.5 h-2.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
            <span className="text-gray-500 shrink-0">in {fullLocationName}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl">
        {/* Category Header Box (Khmer24 Style) */}
        <div className="bg-white dark:bg-[#1f2028] border border-gray-200 dark:border-gray-800 rounded mb-3 shadow-sm transition-colors">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <h1 className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-100">
                    {selectedCategory ? `${selectedCategory.name} in ${fullLocationName}` :
                     keyword ? `Search results for "${keyword}"` :
                     `Latest Classifieds in ${fullLocationName}`}
                </h1>
            </div>

            {/* Filter Bar */}
            <div className="px-4 flex items-center bg-white dark:bg-[#16171d] border-b border-gray-50 dark:border-gray-800 overflow-hidden transition-colors">
                <div className="flex-1 overflow-x-auto scrollbar-hide flex items-center gap-1.5 py-2">
                    <button
                        onClick={() => setIsLocationModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f8f9fa] dark:bg-gray-800 hover:bg-[#e9ecef] dark:hover:bg-gray-700 rounded border border-[#dee2e6] dark:border-gray-700 text-[11px] font-bold text-gray-700 dark:text-gray-300 transition whitespace-nowrap"
                    >
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        {localFilters.province_id ? (districtName ? `${districtName}, ${provinces.find(p => String(p.id) === localFilters.province_id)?.name}` : (provinces.find(p => String(p.id) === localFilters.province_id)?.name || 'Location')) : 'Location: All'}
                    </button>

                    <div className="relative">
                        <select
                            value={localFilters.sort}
                            onChange={e => applyFilters({ sort: e.target.value })}
                            className="appearance-none flex items-center gap-1.5 px-3 py-1.5 bg-[#f8f9fa] dark:bg-gray-800 hover:bg-[#e9ecef] dark:hover:bg-gray-700 rounded border border-[#dee2e6] dark:border-gray-700 text-[11px] font-bold text-gray-700 dark:text-gray-300 transition outline-none cursor-pointer pr-7"
                        >
                            <option value="latest">Sort: Newest</option>
                            <option value="price_low">Price: Low</option>
                            <option value="price_high">Price: High</option>
                        </select>
                        <svg className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                    </div>

                    <button
                        onClick={() => setIsMobileFilterOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f8f9fa] dark:bg-gray-800 hover:bg-[#e9ecef] dark:hover:bg-gray-700 rounded border border-[#dee2e6] dark:border-gray-700 text-[11px] font-bold text-gray-700 dark:text-gray-300 transition whitespace-nowrap"
                    >
                        Price
                    </button>
                    <button
                        onClick={() => setIsMobileFilterOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f8f9fa] dark:bg-gray-800 hover:bg-[#e9ecef] dark:hover:bg-gray-700 rounded border border-[#dee2e6] dark:border-gray-700 text-[11px] font-bold text-gray-700 dark:text-gray-300 transition whitespace-nowrap"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>
                        More Filters
                    </button>
                </div>

                <div className="flex items-center shrink-0 ml-3 border-l border-gray-100 dark:border-gray-800 pl-3 py-2">
                    <button
                        onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                        className="p-1.5 rounded text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex items-center justify-center w-9 h-9"
                    >
                        {viewMode === 'grid' ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
                        ) : (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M7 11h-2c-1.105 0-2 .895-2 2v2c0 1.105.895 2 2 2h2c1.105 0 2-.895 2-2v-2c0-1.105-.895-2-2-2zm0-6h-2c-1.105 0-2 .895-2 2v2c0 1.105.895 2 2 2h2c1.105 0 2-.895 2-2v-2c0-1.105-.895-2-2-2zm6 0h-2c-1.105 0-2 .895-2 2v2c0 1.105.895 2 2 2h2c1.105 0 2-.895 2-2v-2c0-1.105-.895-2-2-2zm0 6h-2c-1.105 0-2 .895-2 2v2c0 1.105.895 2 2 2h2c1.105 0 2-.895 2-2v-2c0-1.105-.895-2-2-2zm6-6h-2c-1.105 0-2 .895-2 2v2c0 1.105.895 2 2 2h2c1.105 0 2-.895 2-2v-2c0-1.105-.895-2-2-2zm0 6h-2c-1.105 0-2 .895-2 2v2c0 1.105.895 2 2 2h2c1.105 0 2-.895 2-2v-2c0-1.105-.895-2-2-2zm-6 6h-2c-1.105 0-2 .895-2 2v2c0 1.105.895 2 2 2h2c1.105 0 2-.895 2-2v-2c0-1.105-.895-2-2-2zm6 0h-2c-1.105 0-2 .895-2 2v2c0 1.105.895 2 2 2h2c1.105 0 2-.895 2-2v-2c0-1.105-.895-2-2-2z"/></svg>
                        )}
                    </button>
                </div>
            </div>
        </div>

        {/* Browse By Category Section - Khmer24 Style Flow */}
        {loadingCategories ? (
            !isSubCategorySelected && (
                <div className="bg-white dark:bg-[#1f2028] border border-gray-200 dark:border-gray-800 rounded mb-3 shadow-sm animate-pulse p-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/4 mb-6" />
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-4">
                        {[...Array(7)].map((_, i) => (
                            <div key={i} className="flex flex-col items-center gap-2">
                                <div className="size-10 sm:size-14 bg-gray-200 dark:bg-gray-800 rounded-full" />
                                <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded w-full" />
                            </div>
                        ))}
                    </div>
                </div>
            )
        ) : !isSubCategorySelected && (
            <div className="bg-white dark:bg-[#1f2028] border border-gray-200 dark:border-gray-800 rounded mb-3 shadow-sm overflow-hidden transition-colors">
                <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-800">
                    <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 uppercase tracking-tight">
                        {selectedCategory ? `Browse in ${selectedCategory.name}` : 'Browse By Category'}
                    </h2>
                </div>
                <ul className="text-center grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-1 sm:gap-2 p-3">
                    {(selectedCategory ? subCategories : categories.filter(c => !c.parent_id)).map((cat) => (
                        <li key={cat.id}>
                            <button
                                onClick={() => setCategory(String(cat.id))}
                                className={`block w-full h-full group bg-white dark:bg-[#1f2028] rounded cursor-pointer active:opacity-50 p-1.5 sm:p-2.5 transition-all hover:bg-[#f8f9fa] dark:hover:bg-[#16171d] ${categoryId === String(cat.id) ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/10' : ''}`}
                            >
                                <div className={`mx-auto rounded-full mt-1 transition-all size-10 sm:size-14 flex items-center justify-center overflow-hidden ${categoryId === String(cat.id) ? 'bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500' : 'bg-[#e9ecef] dark:bg-gray-800 group-hover:bg-[#dee2e6] dark:group-hover:bg-gray-700'}`}>
                                    <CategoryIcon cat={cat} className="w-full h-full group-hover:scale-110 transition-transform duration-300" />
                                </div>
                                <p className={`overflow-hidden text-ellipsis mt-1.5 sm:mt-2.5 text-[10px] sm:text-[11.5px] font-bold leading-tight ${categoryId === String(cat.id) ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 group-hover:text-blue-600'}`}>
                                    {cat.name}
                                </p>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        )}

        {/* Khmer24 Step-by-Step Selection UI */}
        {loadingAttributes ? (
            <div className="flex flex-col gap-3 mb-3 animate-pulse">
                {/* Surgical Skeleton: Only show 1 block if brand isn't selected, or 2 if it is */}
                {[...Array(brandAttr && localFilters[`attr_${brandAttr.id}`] ? 2 : 1)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-[#1f2028] border border-gray-200 dark:border-gray-800 rounded shadow-sm">
                        <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-800">
                             <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-20" />
                        </div>
                        <div className="p-4 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
                            {[...Array(8)].map((_, j) => (
                                <div key={j} className="flex flex-col items-center gap-2">
                                    <div className="size-12 sm:size-14 bg-gray-200 dark:bg-gray-800 rounded-full" />
                                    <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded w-full" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        ) : (() => {
            if (dynamicAttributes.length === 0) return null;

            // Define Logical Order: Brand -> Model -> Others -> Body Type
            const sortedAttrs = [...dynamicAttributes].sort((a, b) => {
                const order = ['Brand', 'Model', 'Year', 'Condition'];
                if (a.name === 'Body Type') return 1;
                if (b.name === 'Body Type') return -1;
                const idxA = order.indexOf(a.name);
                const idxB = order.indexOf(b.name);
                if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                if (idxA !== -1) return -1;
                if (idxB !== -1) return 1;
                return 0;
            });

            // Step 1: Check if Brand is picked
            const brandAttr = dynamicAttributes.find(a => a.name === 'Brand');
            const isBrandSelected = brandAttr ? !!localFilters[`attr_${brandAttr.id}`] : true;

            let displayAttrs = [];
            if (!isBrandSelected) {
                // Stage 1: Only show Brand
                if (brandAttr) displayAttrs.push(brandAttr);
            } else {
                // Stage 2: Brand hidden, show Model and Body Type
                const modelAttr = dynamicAttributes.find(a => a.name === 'Model');
                const bodyTypeAttr = dynamicAttributes.find(a => a.name === 'Body Type');

                if (modelAttr) displayAttrs.push(modelAttr);
                if (bodyTypeAttr) displayAttrs.push(bodyTypeAttr);

                // Show any other select attributes that aren't picked yet
                const others = dynamicAttributes.filter(a =>
                    a.type === 'select' &&
                    !['Brand', 'Model', 'Body Type'].includes(a.name) &&
                    !localFilters[`attr_${a.id}`]
                );
                displayAttrs.push(...others);
            }

            // Body Type always at bottom
            displayAttrs.sort((a, b) => {
                if (a.name === 'Body Type') return 1;
                if (b.name === 'Body Type') return -1;
                return 0;
            });

            if (displayAttrs.length === 0) return null;

            return displayAttrs.map(attr => {
                const isExpanded = expandedAttrs[attr.id] || false;
                const options = attr.options || [];
                const visibleOptions = isExpanded ? options : options.slice(0, 12);
                const hasMore = options.length > 12;
                const isCircleStyle = ['Brand', 'Body Type', 'Make', 'Model'].includes(attr.name);

                return (
                    <div key={attr.id} className="bg-white dark:bg-[#1f2028] border border-gray-200 dark:border-gray-800 rounded mb-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-500 transition-colors">
                        <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-800">
                            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 uppercase tracking-tight">{attr.name}</h2>
                        </div>
                        <div className="p-4">
                            <div className={`grid gap-x-2 gap-y-4 ${isCircleStyle ? 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'}`}>
                                {visibleOptions.map((opt: any) => {
                                    const isActive = localFilters[`attr_${attr.id}`] === opt.value;
                                    return (
                                        <button
                                            key={opt.id}
                                            onClick={() => {
                                                applyFilters({ [`attr_${attr.id}`]: isActive ? '' : opt.value });
                                            }}
                                            className="group flex flex-col items-center gap-2 transition-all active:scale-95"
                                        >
                                            {isCircleStyle ? (
                                                <div className={`size-12 sm:size-14 rounded-full flex items-center justify-center border transition-all overflow-hidden ${isActive ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 ring-2 ring-blue-500/20' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 group-hover:border-blue-200 dark:group-hover:border-blue-800 group-hover:bg-blue-50/30 dark:group-hover:bg-blue-900/10'}`}>
                                                    {opt.image_url ? (
                                                        <img src={getImageUrl(opt.image_url)} className="w-full h-full object-cover" alt={opt.value} />
                                                    ) : (
                                                        <div className="text-[10px] font-black text-gray-300 dark:text-gray-600 uppercase truncate px-1">{opt.value.substring(0, 3)}</div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className={`w-full py-2.5 px-3 rounded border text-center transition-all ${isActive ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 border-blue-500 text-blue-600 dark:text-blue-400 font-bold shadow-sm' : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 group-hover:bg-blue-50 dark:group-hover:bg-gray-700 group-hover:border-blue-200 dark:group-hover:border-blue-800 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:font-bold shadow-sm'}`}>
                                                    <span className="text-[11px] truncate block">{opt.value}</span>
                                                </div>
                                            )}
                                            {isCircleStyle && (
                                                <span className={`text-[10px] sm:text-[11px] font-bold text-center leading-tight truncate px-1 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}>
                                                    {opt.value}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {hasMore && (
                                <button
                                    onClick={() => setExpandedAttrs(prev => ({ ...prev, [attr.id]: !isExpanded }))}
                                    className="w-full mt-6 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 text-[11px] font-bold uppercase tracking-widest rounded transition-colors flex items-center justify-center gap-1.5"
                                >
                                    {isExpanded ? 'Show Less' : 'Show More'}
                                    <svg className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"/></svg>
                                </button>
                            )}
                        </div>
                    </div>
                );
            });
        })()}

        <div className="flex flex-col gap-4 sm:gap-5">

          {/* Filter Modal */}
          {isMobileFilterOpen && (
            <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
              <div className="h-14 flex items-center justify-between px-4 border-b border-gray-200 sticky top-0 bg-white">
                <h2 className="font-bold text-gray-800">Filter & Sort</h2>
                <button onClick={() => setIsMobileFilterOpen(false)} className="p-2 text-gray-400 hover:text-red-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-8">
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Categories</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.filter(c => !c.parent_id).map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => { setCategory(String(cat.id)); setIsMobileFilterOpen(false); }}
                        className={`flex items-center gap-2 p-3 rounded-lg border transition ${categoryId === String(cat.id) ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-100 bg-gray-50'}`}
                      >
                        <CategoryIcon cat={cat} className="w-5 h-5 shrink-0" />
                        <span className="text-[11px] font-bold truncate">{cat.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Price Range ($)</h3>
                  <div className="flex gap-4">
                    <input
                      type="number"
                      placeholder="Min"
                      value={localFilters.min_price}
                      onChange={e => setLocalFilters({...localFilters, min_price: e.target.value})}
                      className="flex-1 bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition-all font-bold"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={localFilters.max_price}
                      onChange={e => setLocalFilters({...localFilters, max_price: e.target.value})}
                      className="flex-1 bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition-all font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-4 pb-10">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Location</h3>
                  <button
                    onClick={() => setIsLocationModalOpen(true)}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm text-gray-700"
                  >
                    <span>{localFilters.province_id ? (districtName ? `${districtName}, ${provinces.find(p => String(p.id) === localFilters.province_id)?.name}` : (provinces.find(p => String(p.id) === localFilters.province_id)?.name || 'Select Location')) : 'All Cambodia'}</span>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"/></svg>
                  </button>
                </div>
              </div>
              <div className="p-4 border-t border-gray-100 bg-white sticky bottom-0">
                <button
                  onClick={() => { applyFilters(); setIsMobileFilterOpen(false); }}
                  className="w-full bg-blue-600 text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-xl shadow-blue-600/30 active:scale-[0.98] transition-all"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}

          {/* Product Grid Area */}
          <div className="flex-grow">
             {/* Results count */}
             <div id="results-count" className="mb-3 px-1 flex justify-between items-center">
                <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase">
                    {pagination.total} ads found
                </span>
             </div>

             {loading && products.length === 0 ? (
                <div className={viewMode === 'grid'
                    ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3"
                    : "flex flex-col gap-3"
                }>
                  {[...Array(12)].map((_, i) => (
                    <ProductSkeleton key={i} variant={viewMode} />
                  ))}
                </div>
             ) : products.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-md p-10 sm:p-20 text-center shadow-sm">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 uppercase">No results matched</h3>
                    <p className="text-gray-500 text-xs sm:text-sm mb-6 sm:mb-8 font-medium">Try different keywords or filters.</p>
                    <button onClick={() => navigate('/')} className="bg-blue-600 text-white px-8 py-2 rounded font-bold text-xs uppercase shadow-md transition active:scale-95">Reset Search</button>
                </div>
             ) : (
                <div className={viewMode === 'grid'
                    ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3"
                    : "flex flex-col gap-3"
                }>
                   {products.map(p => <ProductCard key={p.id} product={p} variant={viewMode} />)}
                </div>
             )}

             {/* Pagination */}
             {pagination.lastPage > 1 && (
                <div className="mt-12 sm:mt-16 flex justify-center">
                    <nav className="flex items-center gap-0.5 sm:gap-1">
                      <button
                        onClick={() => goToPage(page - 1)}
                        disabled={page === 1}
                        className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30 rounded transition"
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
                      </button>

                      <div className="flex gap-0.5 sm:gap-1 mx-1 sm:mx-2">
                        {[...Array(pagination.lastPage)].map((_, i) => {
                            const p = i + 1;
                            if (p === 1 || p === pagination.lastPage || (p >= page - 1 && p <= page + 1)) {
                                return (
                                    <button
                                        key={p}
                                        onClick={() => goToPage(p)}
                                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded border text-[11px] sm:text-[13px] font-bold transition ${page === p ? 'bg-blue-600 border-blue-600 text-white shadow-md z-10' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        {p}
                                    </button>
                                );
                            }
                            if (p === 2 || p === pagination.lastPage - 1) return <span key={p} className="px-0.5 sm:px-1 text-gray-300 self-end font-bold">...</span>;
                            return null;
                        })}
                      </div>

                      <button
                        onClick={() => goToPage(page + 1)}
                        disabled={page === pagination.lastPage}
                        className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30 rounded transition"
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                      </button>
                    </nav>
                </div>
             )}
          </div>
        </div>
      </div>
      <LocationPickerModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSelect={(data) => {
            applyFilters({
                province_id: data.province_id,
                district_id: data.district_id
            });
        }}
      />
    </div>
  );
};
