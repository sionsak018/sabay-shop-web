import { useTranslation } from 'react-i18next';
import { type Product } from '../../types/product.types';
import { ProductCard } from '../ProductCard';
import { ProductSkeleton } from '../ProductSkeleton';

interface ProductRailProps {
  products: Product[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  onLoadMore: () => void;
  onRetry: () => void;
}

export const ProductRail = ({
  products,
  loading,
  loadingMore,
  error,
  hasMore,
  onLoadMore,
  onRetry,
}: ProductRailProps) => {
  const { t } = useTranslation();

  if (error) {
    return (
      <div className="rounded-card border border-red-100 bg-white p-6 text-center shadow-card dark:border-red-900/30 dark:bg-[#16171d]">
        <p className="mb-2 font-bold text-red-500">{t('home.load_failed', { defaultValue: 'Failed to load products' })}</p>
        <button onClick={onRetry} className="text-xs font-bold text-blue-600 hover:underline dark:text-blue-400">
          {t('common.try_again', { defaultValue: 'Try Again' })}
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
        {[...Array(10)].map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-card border border-gray-200 bg-white p-10 text-center shadow-card transition-colors sm:p-20 dark:border-gray-800 dark:bg-[#16171d]">
        <h3 className="mb-2 text-base font-bold uppercase text-gray-900 sm:text-lg dark:text-gray-100">{t('home.no_results')}</h3>
        <p className="text-xs font-medium text-gray-500 sm:text-sm dark:text-gray-400">{t('home.try_browsing')}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
        {products.map((product, index) => (
          <ProductCard key={product.id} product={product} priority={index < 4} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 rounded-control border border-gray-300 bg-white px-6 py-2.5 text-xs font-black uppercase tracking-widest text-gray-700 shadow-card transition hover:border-brand-500 hover:text-brand-600 disabled:opacity-60 dark:border-gray-700 dark:bg-[#16171d] dark:text-gray-200 dark:hover:text-brand-400"
          >
            {loadingMore && (
              <svg className="h-4 w-4 animate-spin text-brand-600" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {loadingMore ? t('common.loading', { defaultValue: 'Loading...' }) : t('common.load_more', { defaultValue: 'Load more' })}
          </button>
        </div>
      )}
    </div>
  );
};
