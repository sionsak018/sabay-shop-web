import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useProducts, type ProductFilters } from '../hooks/useProducts';
import { ProductCard } from '../components/ProductCard';
import { categoryApi } from '../../categories/services/categoryApi';
import { type Category } from '../../categories/types/category.types';
import api from '../../../services/api';
import { getImageUrl } from '../../../utils/imageUrl';

interface LocalFilters {
  min_price: string;
  max_price: string;
  province_id: string;
  [key: string]: string;
}

const CategoryIcon = ({ cat, className = "" }: { cat: Category, className?: string }) => {
  if (cat.image_url) {
    return <img src={getImageUrl(cat.image_url)} className={`object-contain ${className}`} alt={cat.name} />;
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
  const sortParam = searchParams.get('sort') || 'latest';

  const [categories, setCategories] = useState<Category[]>([]);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [communes, setCommunes] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);
  const [dynamicAttributes, setDynamicAttributes] = useState<any[]>([]);
  const [page, setPage] = useState(1);

  const [localFilters, setLocalFilters] = useState<LocalFilters>(() => {
      const initial: LocalFilters = {
          min_price: searchParams.get('min_price') || '',
          max_price: searchParams.get('max_price') || '',
          province_id: provinceIdParam,
          sort: sortParam,
      };
      searchParams.forEach((val, key) => {
          if (key.startsWith('attr_')) initial[key] = val;
      });
      return initial;
  });

  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    categoryApi.getAll().then(res => setCategories(Array.isArray(res.data) ? res.data : res.data.data || []));
    api.get('/provinces').then(res => setProvinces(Array.isArray(res.data) ? res.data : res.data.data || []));
  }, []);

  useEffect(() => {
    if (categoryId) {
      api.get(`/category-attributes/${categoryId}`).then(res => setDynamicAttributes(res.data));
    } else {
      setDynamicAttributes([]);
    }
  }, [categoryId]);

  const productFilters: ProductFilters = {
    keyword: keyword || undefined,
    category_id: categoryId || undefined,
    min_price: searchParams.get('min_price') || undefined,
    max_price: searchParams.get('max_price') || undefined,
    province_id: searchParams.get('province_id') || undefined,
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

  const provinceName = provinces.find(p => String(p.id) === searchParams.get('province_id'))?.name || 'Cambodia';

  return (
    <div ref={topRef} className="min-h-screen bg-[#f1f2f6] pb-20 text-left antialiased font-sans">

      {/* Search Bar - Khmer24 Style */}
      <div className="bg-white border-b border-gray-200 py-3 shadow-sm sticky top-16 z-30">
        <div className="container mx-auto px-4 max-w-7xl">
             <div className="relative">
                <input
                    type="text"
                    defaultValue={keyword}
                    placeholder="Search in all categories..."
                    className="w-full bg-[#f8f9fa] border border-[#dee2e6] px-4 py-2.5 rounded focus:bg-white focus:border-blue-500 outline-none text-sm font-medium text-gray-700 transition-all"
                    onKeyDown={e => {
                        if (e.key === 'Enter') {
                            const params = new URLSearchParams(searchParams);
                            params.set('keyword', (e.target as HTMLInputElement).value);
                            setSearchParams(params);
                        }
                    }}
                />
                <svg className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
             </div>
        </div>
      </div>


      {/* Breadcrumbs - Khmer24 Style */}
      <div className="py-3">
        <div className="container mx-auto px-4 max-w-7xl">
          <nav className="flex text-xs font-bold text-gray-400 gap-1.5 items-center">
            <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
            {mainCategory && (
              <>
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
                <button onClick={() => setCategory(String(mainCategory.id))} className="hover:text-blue-600 truncate max-w-[150px]">{mainCategory.name}</button>
              </>
            )}
            {selectedCategory && selectedCategory.parent_id && (
              <>
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
                <span className="text-blue-600 truncate max-w-[150px]">{selectedCategory.name}</span>
              </>
            )}
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
            <span className="text-gray-500">in {provinceName}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-5">

          {/* Sidebar - Hierarchical Tree */}
          <aside className="lg:w-64 space-y-4 flex-shrink-0">

            <div className="bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm">
                <div className="bg-[#f8f9fa] px-4 py-2 border-b border-gray-200">
                    <h2 className="text-xs font-bold text-gray-700 uppercase tracking-tight">Categories</h2>
                </div>
                <div className="p-1">
                    {!mainCategory ? (
                        <div className="space-y-0.5">
                            {categories.filter(c => !c.parent_id).map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setCategory(String(cat.id))}
                                    className="w-full text-left px-3 py-1.5 rounded text-[13px] text-gray-600 hover:bg-[#f1f2f6] flex items-center gap-2 transition"
                                >
                                    <CategoryIcon cat={cat} className="w-5 h-5 opacity-60 grayscale" />
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div>
                            <button
                                onClick={() => setCategory('')}
                                className="w-full text-left px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 flex items-center gap-1 font-bold rounded"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
                                All Categories
                            </button>

                            <div className="mt-2 px-3 py-1.5 text-sm font-bold text-gray-900 bg-[#f1f2f6] border-y border-gray-200 flex items-center gap-2">
                                <CategoryIcon cat={mainCategory} className="w-4 h-4" />
                                {mainCategory.name}
                            </div>

                            <div className="mt-1 space-y-0.5">
                                <button
                                    onClick={() => setCategory(String(mainCategory.id))}
                                    className={`w-full text-left px-4 py-1.5 text-[13px] rounded transition ${categoryId === String(mainCategory.id) ? 'bg-blue-600 text-white font-bold' : 'text-gray-600 hover:bg-[#f1f2f6]'}`}
                                >
                                    All {mainCategory.name}
                                </button>
                                {subCategories.map(sub => (
                                    <button
                                        key={sub.id}
                                        onClick={() => setCategory(String(sub.id))}
                                        className={`w-full text-left px-4 py-1.5 text-[13px] rounded transition flex items-center gap-2 ${categoryId === String(sub.id) ? 'bg-blue-600 text-white font-bold' : 'text-gray-600 hover:bg-[#f1f2f6]'}`}
                                    >
                                        <CategoryIcon cat={sub} className={`w-4 h-4 ${categoryId === String(sub.id) ? '' : 'opacity-60 grayscale'}`} />
                                        {sub.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Price Range Filter */}
            <div className="bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm">
                <div className="bg-[#f8f9fa] px-4 py-2 border-b border-gray-200">
                    <h2 className="text-xs font-bold text-gray-700 uppercase tracking-tight">Price Range</h2>
                </div>
                <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">$</span>
                            <input
                                type="number"
                                placeholder="Min"
                                value={localFilters.min_price}
                                onChange={e => setLocalFilters({...localFilters, min_price: e.target.value})}
                                className="w-full pl-5 pr-2 py-1.5 bg-[#f8f9fa] border border-[#ced4da] rounded text-sm outline-none focus:bg-white focus:border-blue-500"
                            />
                        </div>
                        <span className="text-gray-300">-</span>
                        <div className="relative flex-1">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">$</span>
                            <input
                                type="number"
                                placeholder="Max"
                                value={localFilters.max_price}
                                onChange={e => setLocalFilters({...localFilters, max_price: e.target.value})}
                                className="w-full pl-5 pr-2 py-1.5 bg-[#f8f9fa] border border-[#ced4da] rounded text-sm outline-none focus:bg-white focus:border-blue-500"
                            />
                        </div>
                    </div>
                    <button onClick={applyFilters} className="w-full bg-blue-600 text-white py-1.5 rounded text-xs font-bold hover:bg-blue-700 transition">Apply</button>
                </div>
            </div>

            {/* Dynamic Attributes - ONLY show when category is selected */}
            {dynamicAttributes.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm">
                    <div className="bg-[#f8f9fa] px-4 py-2 border-b border-gray-200">
                        <h2 className="text-xs font-bold text-gray-700 uppercase tracking-tight">Specifications</h2>
                    </div>
                    <div className="p-4 space-y-4">
                        {dynamicAttributes.map(attr => (
                            <div key={attr.id} className="space-y-1">
                                <label className="block text-[11px] font-bold text-gray-500 uppercase">{attr.name}</label>
                                {attr.type === 'select' ? (
                                    <select
                                        value={localFilters[`attr_${attr.id}`] || ''}
                                        onChange={e => setLocalFilters({...localFilters, [`attr_${attr.id}`]: e.target.value})}
                                        className="w-full px-2 py-1.5 bg-[#f8f9fa] border border-[#ced4da] rounded text-sm outline-none focus:bg-white focus:border-blue-500"
                                    >
                                        <option value="">All {attr.name}</option>
                                        {attr.options?.map((o: any) => <option key={o.id} value={o.value}>{o.value}</option>)}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        placeholder={`Search ${attr.name}`}
                                        value={localFilters[`attr_${attr.id}`] || ''}
                                        onChange={e => setLocalFilters({...localFilters, [`attr_${attr.id}`]: e.target.value})}
                                        className="w-full px-2 py-1.5 bg-[#f8f9fa] border border-[#ced4da] rounded text-sm outline-none focus:bg-white focus:border-blue-500"
                                    />
                                )}
                            </div>
                        ))}
                        <button onClick={applyFilters} className="w-full bg-blue-600 text-white py-1.5 rounded text-xs font-bold hover:bg-blue-700 transition">Apply Filter</button>
                    </div>
                </div>
            )}

            {/* Location Selection */}
            <div className="bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm">
                <div className="bg-[#f8f9fa] px-4 py-2 border-b border-gray-200">
                    <h2 className="text-sm font-bold text-gray-800 uppercase tracking-tight">Location</h2>
                </div>
                <div className="p-2 max-h-80 overflow-y-auto custom-scrollbar">
                    <button
                        onClick={() => applyFilters({ province_id: '' })}
                        className={`w-full text-left px-3 py-1.5 text-[13px] rounded transition ${!localFilters.province_id ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600 hover:bg-[#f1f2f6]'}`}
                    >
                        All Cambodia
                    </button>
                    {provinces.map(p => (
                        <button
                            key={p.id}
                            onClick={() => applyFilters({ province_id: String(p.id) })}
                            className={`w-full text-left px-3 py-1.5 text-[13px] rounded transition ${localFilters.province_id === String(p.id) ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600 hover:bg-[#f1f2f6]'}`}
                        >
                            {p.name}
                        </button>
                    ))}
                </div>
            </div>

          </aside>

          {/* Product Grid Area */}
          <div className="flex-grow">

             <div className="mb-4 flex items-center justify-between px-1">
                <h1 className="text-base font-bold text-gray-900 uppercase">
                    {selectedCategory?.name || keyword || 'Latest Classifieds'}
                    <span className="text-xs font-normal text-gray-500 ml-2 normal-case">({pagination.total} ads found)</span>
                </h1>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 uppercase">Sort:</span>
                    <select
                        value={localFilters.sort}
                        onChange={e => applyFilters({ sort: e.target.value })}
                        className="bg-transparent border-none text-xs font-bold text-blue-600 focus:ring-0 cursor-pointer outline-none"
                    >
                        <option value="latest">Newest First</option>
                        <option value="price_low">Price: Low to High</option>
                        <option value="price_high">Price: High to Low</option>
                    </select>
                </div>
             </div>

             {loading && products.length === 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="bg-white border border-gray-200 rounded-md h-72 animate-pulse" />
                  ))}
                </div>
             ) : products.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-md p-20 text-center shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 uppercase">No results matched</h3>
                    <p className="text-gray-500 text-sm mb-8 font-medium">Try different keywords or filters.</p>
                    <button onClick={() => navigate('/')} className="bg-blue-600 text-white px-8 py-2 rounded font-bold text-xs uppercase shadow-md transition active:scale-95">Reset Search</button>
                </div>
             ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                   {products.map(p => <ProductCard key={p.id} product={p} />)}
                </div>
             )}

             {/* Pagination */}
             {pagination.lastPage > 1 && (
                <div className="mt-16 flex justify-center">
                    <nav className="flex items-center gap-1">
                      <button
                        onClick={() => goToPage(page - 1)}
                        disabled={page === 1}
                        className="w-10 h-10 flex items-center justify-center border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30 rounded transition"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
                      </button>

                      <div className="flex gap-1 mx-2">
                        {[...Array(pagination.lastPage)].map((_, i) => {
                            const p = i + 1;
                            if (p === 1 || p === pagination.lastPage || (p >= page - 1 && p <= page + 1)) {
                                return (
                                    <button
                                        key={p}
                                        onClick={() => goToPage(p)}
                                        className={`w-10 h-10 rounded border text-[13px] font-bold transition ${page === p ? 'bg-blue-600 border-blue-600 text-white shadow-md z-10' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        {p}
                                    </button>
                                );
                            }
                            if (p === 2 || p === pagination.lastPage - 1) return <span key={p} className="px-1 text-gray-300 self-end font-bold">...</span>;
                            return null;
                        })}
                      </div>

                      <button
                        onClick={() => goToPage(page + 1)}
                        disabled={page === pagination.lastPage}
                        className="w-10 h-10 flex items-center justify-center border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30 rounded transition"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                      </button>
                    </nav>
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};
