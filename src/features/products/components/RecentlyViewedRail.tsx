import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type Product } from '../types/product.types';
import { getRecentlyViewed } from '../../../utils/recentlyViewed';
import { ProductCard } from './ProductCard';

interface RecentlyViewedRailProps {
  currentId: number;
}

export const RecentlyViewedRail = ({ currentId }: RecentlyViewedRailProps) => {
  const { t } = useTranslation();
  const [items] = useState<Product[]>(() => getRecentlyViewed().filter((product) => product.id !== currentId));

  if (items.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-gray-900 dark:text-gray-100">
        {t('product.recently_viewed', { defaultValue: 'Recently Viewed' })}
      </h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
        {items.slice(0, 5).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};
