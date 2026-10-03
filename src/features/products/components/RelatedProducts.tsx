import { useTranslation } from 'react-i18next';
import { useProducts } from '../hooks/useProducts';
import { ProductCard } from './ProductCard';
import { ProductSkeleton } from './ProductSkeleton';

interface RelatedProductsProps {
  categoryId: number;
  excludeId: number;
}

export const RelatedProducts = ({ categoryId, excludeId }: RelatedProductsProps) => {
  const { t } = useTranslation();
  const { products, loading } = useProducts({ category_id: String(categoryId), page: 1 });
  const related = products.filter((product) => product.id !== excludeId).slice(0, 5);

  if (!loading && related.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-gray-900 dark:text-gray-100">
        {t('product.related', { defaultValue: 'Related Ads' })}
      </h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
        {loading
          ? [...Array(5)].map((_, i) => <ProductSkeleton key={i} />)
          : related.map((product, index) => <ProductCard key={product.id} product={product} priority={index < 2} />)}
      </div>
    </section>
  );
};
