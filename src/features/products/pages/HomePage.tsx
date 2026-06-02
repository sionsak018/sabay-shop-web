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
import { LocationPickerModal } from '../../../components/common/LocationPickerModal';

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
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeKeyword, setActiveKeyword] = useState('');

  // New Filter States
  const [activeCategoryId, setActiveCategoryId] = useState<number | undefined>();
  const [activeProvinceId, setActiveProvinceId] = useState<string>('');
  const [activeDistrictId, setActiveDistrictId] = useState<string>('');
  const [locationName, setLocationName] = useState('All Cambodia');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [dynamicAttributes, setDynamicAttributes] = useState<any[]>([]);
  const [loadingAttributes, setLoadingAttributes] = useState(false);
  const [activeAttributes, setActiveAttributes] = useState<Record<string, string>>({});
  const [expandedAttrs, setExpandedAttrs] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setLoadingCategories(true);
    categoryApi.getAll()
      .then(res => setCategories(Array.isArray(res.data) ? res.data : res.data.data || []))
      .finally(() => setLoadingCategories(false));
  }, []);

  // Fetch dynamic attributes when category changes
  useEffect(() => {
    if (activeCategoryId) {
      setLoadingAttributes(true);
      api.get(`/category-attributes/${activeCategoryId}`)
        .then(res => setDynamicAttributes(res.data))
        .finally(() => setLoadingAttributes(false));
    } else {
      setDynamicAttributes([]);
      setLoadingAttributes(false);
    }
    setActiveAttributes({}); // Reset attributes when category changes
  }, [activeCategoryId]);

  const productFilters = {
    page: 1,
    keyword: activeKeyword || undefined,
    category_id: activeCategoryId?.toString(),
    province_id: activeProvinceId || undefined,
    district_id: activeDistrictId || undefined,
    ...activeAttributes
  };

  const { products, loading, error } = useProducts(productFilters);

  const getResultsTitle = () => {
    if (activeKeyword) return `Results for "${activeKeyword}"`;
    if (activeCategoryId) return `Results in ${selectedCategory?.name}`;
    if (activeProvinceId !== '') return `Results in ${locationName}`;
    return 'Recent Ads';
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('keyword', searchQuery.trim());
    if (activeProvinceId) params.set('province_id', activeProvinceId);
    if (activeDistrictId) params.set('district_id', activeDistrictId);
    navigate(`/products?${params.toString()}`);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setActiveKeyword('');
    setActiveCategoryId(undefined);
    setActiveProvinceId('');
    setActiveDistrictId('');
    setLocationName('All Cambodia');
    setActiveAttributes({});
  };

  const browseCategory = (id: number) => {
    navigate(`/products?category_id=${id}`);
  };

  const handleAttributeClick = (attrId: number, value: string) => {
    const key = `attr_${attrId}`;
    setActiveAttributes(prev => {
        if (prev[key] === value) {
            const next = { ...prev };
            delete next[key];
            return next;
        }
        return { ...prev, [key]: value };
    });
  };

  const selectedCategory = categories.find(c => c.id === activeCategoryId);
  const mainCategory = selectedCategory?.parent_id ? categories.find(c => c.id === selectedCategory.parent_id) : selectedCategory;
  const subCategories = mainCategory ? categories.filter(c => c.parent_id === mainCategory.id) : [];

  const mainCategoriesToDisplay = categories.filter(c => !c.parent_id);

  // Logic for Khmer24 Step-by-Step visibility
  const isSubCategorySelected = selectedCategory && selectedCategory.parent_id;

  const brandAttr = dynamicAttributes.find(a => a.name === 'Brand');
  const modelAttr = dynamicAttributes.find(a => a.name === 'Model');
  const bodyTypeAttr = dynamicAttributes.find(a => a.name === 'Body Type');

  const selectedBrand = brandAttr ? activeAttributes[`attr_${brandAttr.id}`] : null;
  const selectedModel = modelAttr ? activeAttributes[`attr_${modelAttr.id}`] : null;

  return (
    <div className="min-h-screen bg-[#f1f2f6] dark:bg-[#08060d] text-gray-900 dark:text-gray-100 antialiased pb-20 font-sans transition-colors duration-300">
      
      {/* Khmer24 Style Header Search */}
      <div className="bg-white dark:bg-[#16171d] border-b border-gray-200 dark:border-gray-800 py-3 sm:py-4 sticky top-14 z-40 shadow-sm transition-colors">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-grow flex gap-2">
                <button
                    onClick={() => setIsLocationModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 dark:bg-[#1f2028] border border-[#ced4da] dark:border-gray-700 rounded-md text-[11px] sm:text-xs font-bold text-gray-700 dark:text-gray-300 transition shrink-0"
                >
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    <span className="truncate max-w-[80px] sm:max-w-[120px]">{locationName}</span>
                </button>

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

        {/* Breadcrumb if category selected */}
        {activeCategoryId && (
            <div className="mb-3 flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide py-2 px-1">
                <button
                  onClick={() => {
                      setActiveCategoryId(undefined);
                      setActiveAttributes({});
                  }}
                  className="text-sm sm:text-base font-bold text-blue-600 hover:underline transition-colors"
                >
                  All Categories
                </button>
                {mainCategory && (
                    <>
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                        <button
                            onClick={() => {
                                setActiveCategoryId(mainCategory.id);
                                setActiveAttributes({});
                            }}
                            className={`text-sm sm:text-base font-bold transition-colors ${activeCategoryId === mainCategory.id && Object.keys(activeAttributes).length === 0 ? 'text-gray-500 cursor-default' : 'text-blue-600 hover:underline'}`}
                        >
                            {mainCategory.name}
                        </button>
                    </>
                )}
                {selectedCategory && selectedCategory.id !== mainCategory?.id && (
                    <>
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                        {Object.keys(activeAttributes).length > 0 ? (
                            <button
                                onClick={() => setActiveAttributes({})}
                                className="text-sm sm:text-base font-bold text-blue-600 hover:underline transition-colors"
                            >
                                {selectedCategory.name}
                            </button>
                        ) : (
                            <span className="text-sm sm:text-base font-bold text-gray-500">
                              {selectedCategory.name}
                            </span>
                        )}
                    </>
                )}

                {/* Dynamic Attribute Breadcrumbs (Brand, Model, Body Type) */}
                {(() => {
                    const activeAttrList = dynamicAttributes
                        .filter(attr => activeAttributes[`attr_${attr.id}`])
                        .sort((a, b) => {
                            const order = ['Brand', 'Model', 'Year', 'Condition', 'Body Type'];
                            const idxA = order.indexOf(a.name);
                            const idxB = order.indexOf(b.name);
                            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                            if (idxA !== -1) return -1;
                            if (idxB !== -1) return 1;
                            return 0;
                        });

                    return activeAttrList.map((attr, idx) => {
                        const val = activeAttributes[`attr_${attr.id}`];
                        const isLast = idx === activeAttrList.length - 1;

                        return (
                            <div key={attr.id} className="flex items-center gap-2 shrink-0">
                                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                                {isLast ? (
                                    <span className="text-sm sm:text-base font-bold text-gray-500">
                                        {val}
                                    </span>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setActiveAttributes(prev => {
                                                const next = { ...prev };
                                                for (let i = idx; i < activeAttrList.length; i++) {
                                                    delete next[`attr_${activeAttrList[i].id}`];
                                                }
                                                return next;
                                            });
                                        }}
                                        className="text-sm sm:text-base font-bold text-blue-600 hover:underline transition-colors"
                                    >
                                        {val}
                                    </button>
                                )}
                            </div>
                        );
                    });
                })()}
            </div>
        )}

        {/* Browse By Category Section */}
        {loadingCategories ? (
            !isSubCategorySelected && (
                <div className="bg-white dark:bg-[#1f2028] border border-gray-200 dark:border-gray-800 rounded-md p-3 sm:p-4 shadow-sm transition-colors mb-3 animate-pulse">
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
            )
        ) : (!isSubCategorySelected) && (
            <div className="bg-white dark:bg-[#1f2028] border border-gray-200 dark:border-gray-800 rounded-md p-3 sm:p-4 shadow-sm transition-colors mb-3">
                <h2 className="text-sm sm:text-base font-bold mb-3 sm:mb-4 text-gray-800 dark:text-gray-100">
                    {activeCategoryId ? `Browse in ${selectedCategory?.name}` : 'Browse By Category'}
                </h2>

                <ul className="text-center grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-6 gap-1 sm:gap-2">
                    {(activeCategoryId ? subCategories : mainCategoriesToDisplay).map((cat) => (
                        <li key={cat.id}>
                            <button
                                onClick={() => browseCategory(cat.id)}
                                className={`block w-full h-full group bg-white dark:bg-[#1f2028] rounded cursor-pointer active:opacity-50 p-1.5 sm:p-2.5 transition-all hover:bg-[#f8f9fa] dark:hover:bg-[#16171d] ${activeCategoryId === cat.id ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/10' : ''}`}
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
        )}

        {/* Dynamic Attributes (Brand, Model, etc. - Khmer24 Style Flow) */}
        {loadingAttributes ? (
            <div className="flex flex-col gap-3 mb-3">
                {/* Surgical Skeleton: Shows 1 block for brand, or 2 for Model/BodyType based on flow */}
                {[...Array(selectedBrand ? 2 : 1)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-[#1f2028] border border-gray-200 dark:border-gray-800 rounded-md shadow-sm overflow-hidden animate-pulse">
                        <div className="px-4 py-2.5 bg-gray-50/50 dark:bg-gray-800/50 h-8 w-1/4 m-4 rounded" />
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
        ) : activeCategoryId && (
            <div className="flex flex-col gap-3 mb-3">
                {dynamicAttributes.filter(attr => attr.type === 'select').map(attr => {
                    const isBrand = attr.name === 'Brand';
                    const isModel = attr.name === 'Model';
                    const isBodyType = attr.name === 'Body Type';

                    // Khmer24 Hide Logic:
                    // 1. If it's a Brand: hide if a brand is already selected
                    if (isBrand && selectedBrand) return null;

                    // 2. If it's a Model: show ONLY if a brand is selected (Don't hide if model is already selected)
                    if (isModel && !selectedBrand) return null;

                    // 3. Body Type: always show if it exists (as per user request: "stand by forever")

                    // 4. Other select attributes: show only if brand/model are settled or don't exist
                    if (!isBrand && !isModel && !isBodyType) {
                        // If category has Brand/Model, wait until they are picked?
                        // For now, let's keep it simple: show if not Brand/Model/BodyType
                    }

                    const isExpanded = expandedAttrs[attr.id] || false;
                    const options = attr.options || [];
                    const visibleOptions = isExpanded ? options : options.slice(0, 12);
                    const hasMore = options.length > 12;
                    const activeValue = activeAttributes[`attr_${attr.id}`];
                    const isCircleStyle = ['Brand', 'Body Type', 'Make', 'Model'].includes(attr.name);

                    return (
                        <div key={attr.id} className="bg-white dark:bg-[#1f2028] border border-gray-200 dark:border-gray-800 rounded-md shadow-sm transition-colors overflow-hidden animate-in fade-in slide-in-from-top-1 duration-300">
                            <div className="px-4 py-2.5 border-b border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                                <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">{attr.name}</h3>
                            </div>
                            <div className="p-4">
                                <div className={`grid gap-x-2 gap-y-4 ${isCircleStyle ? 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'}`}>
                                    {visibleOptions.map((opt: any) => {
                                        const isActive = activeValue === opt.value;
                                        return (
                                            <button
                                                key={opt.id}
                                                onClick={() => handleAttributeClick(attr.id, opt.value)}
                                                className="group flex flex-col items-center gap-1.5 transition-all active:scale-95"
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
                                                    <div className={`w-full py-2 px-3 rounded border text-center transition-all ${isActive ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-600 dark:text-blue-400 font-bold' : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-400 group-hover:bg-blue-50/30 dark:group-hover:bg-gray-700'}`}>
                                                        <span className="text-[10px] sm:text-[11px] truncate block">{opt.value}</span>
                                                    </div>
                                                )}
                                                {isCircleStyle && (
                                                    <span className={`text-[9px] sm:text-[10px] font-bold text-center leading-tight truncate w-full px-1 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-blue-600'}`}>
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
                                        className="w-full mt-4 py-1.5 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 text-[10px] font-bold uppercase tracking-widest rounded transition-colors"
                                    >
                                        {isExpanded ? 'Show Less' : `Show ${options.length - 12} More`}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        )}

        {/* Latest Listings */}
        <div className="mt-5">
            <div className="flex items-center justify-between mb-3 px-1 border-b border-gray-200 dark:border-gray-800 pb-1.5">
                <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 uppercase tracking-tight">
                    {getResultsTitle()}
                </h2>
                {(activeKeyword || activeCategoryId || activeProvinceId) ? (
                    <button onClick={clearSearch} className="text-xs font-bold text-red-600 hover:underline">Clear Filters</button>
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

      <LocationPickerModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSelect={(data) => {
            setActiveProvinceId(data.province_id);
            setActiveDistrictId(data.district_id);
            setLocationName(data.locationName || 'All Cambodia');
        }}
      />
    </div>
  );
};
