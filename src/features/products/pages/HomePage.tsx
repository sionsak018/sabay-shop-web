import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { HomeSlider } from '../components/HomeSlider';
import { HomeHero } from '../components/home/HomeHero';
import { HomeTrustBar } from '../components/home/HomeTrustBar';
import { HomeCategoryTiles } from '../components/home/HomeCategoryTiles';
import { ProductRail } from '../components/home/ProductRail';
import { categoryApi } from '../../categories/services/categoryApi';
import { type Category } from '../../categories/types/category.types';
import { statsApi, type PublicStats } from '../services/statsApi';
import { LocationPickerModal } from '../../../components/common/LocationPickerModal';
import { useSeo } from '../../../utils/seo';
import { useTranslation } from 'react-i18next';

export const HomePage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [stats, setStats] = useState<PublicStats | null>(null);

  // Filter states
  const [activeCategoryId, setActiveCategoryId] = useState<number | undefined>();
  const [activeProvinceId, setActiveProvinceId] = useState<string>('');
  const [activeDistrictId, setActiveDistrictId] = useState<string>('');
  const [locationName, setLocationName] = useState('');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    // Optimization: show cached categories instantly
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

  useEffect(() => {
    let active = true;
    statsApi.getPublic()
      .then(res => { if (active) setStats(res.data); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  useSeo({
    title: t('seo.home_title'),
    description: t('seo.home_desc'),
    canonical: '/',
  });

  const productFilters = {
    page,
    category_id: activeCategoryId?.toString(),
    province_id: activeProvinceId || undefined,
    district_id: activeDistrictId || undefined,
  };

  const { products, loading, loadingMore, error, pagination, refetch } = useProducts(productFilters, { mode: 'append' });
  const hasMore = pagination.currentPage < pagination.lastPage;

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
    setPage(1);
  };

  const browseCategory = (id: number) => {
    navigate(`/products?category_id=${id}`);
  };

  // Guarantee a 2-level browse view: root categories (no parent, or an
  // orphaned parent) plus their direct children only.
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
  const hasChildren = (id: number) => childrenOf(id).length > 0;

  return (
    <div className="min-h-screen bg-[#f1f2f6] dark:bg-[#08060d] text-gray-900 dark:text-gray-100 antialiased pb-20 font-sans transition-colors duration-300">
      <div className="container mx-auto px-4 max-w-7xl mt-2 sm:mt-3">

        <HomeHero stats={stats} />

        <HomeTrustBar />

        {/* Breadcrumb if category selected */}
        {activeRoot && (
          <div className="mb-3 flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide py-2 px-1">
            <button
              onClick={() => { setActiveCategoryId(undefined); setPage(1); }}
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

        <HomeCategoryTiles
          loading={loadingCategories}
          title={activeRoot ? t('home.browse_in', { name: activeRoot.name }) : t('home.browse_by_category')}
          categories={displayCategories}
          hasChildren={hasChildren}
          activeCategoryId={activeCategoryId}
          onSelect={(cat, child) => {
            setPage(1);
            if (!activeRoot && child) {
              setActiveCategoryId(cat.id);
            } else {
              browseCategory(cat.id);
            }
          }}
        />

        {/* Promotional slider (secondary to hero) */}
        <HomeSlider />

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

          <ProductRail
            products={products}
            loading={loading}
            loadingMore={loadingMore}
            error={error}
            hasMore={hasMore}
            onLoadMore={() => setPage((prev) => prev + 1)}
            onRetry={refetch}
          />
        </div>

      </div>

      <LocationPickerModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSelect={(data) => {
          setActiveProvinceId(data.province_id);
          setActiveDistrictId(data.district_id);
          setLocationName(data.locationName || '');
          setPage(1);
        }}
      />
    </div>
  );
};
