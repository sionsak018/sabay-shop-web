import { type Category } from '../../../categories/types/category.types';
import SmartImage from '../../../../components/common/SmartImage';

interface HomeCategoryTilesProps {
  loading: boolean;
  title: string;
  categories: Category[];
  hasChildren: (id: number) => boolean;
  activeCategoryId?: number;
  onSelect: (category: Category, hasChildren: boolean) => void;
}

const CategoryIcon = ({ cat, className = '' }: { cat: Category; className?: string }) => {
  if (cat.image_url) {
    return (
      <SmartImage
        src={cat.image_url}
        className={`w-full h-full object-cover ${className}`}
        alt=""
        width={160}
        height={160}
        widths={[80, 160, 320]}
        sizes="64px"
      />
    );
  }
  return (
    <div className={className}>
      <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
      </svg>
    </div>
  );
};

export const HomeCategoryTiles = ({
  loading,
  title,
  categories,
  hasChildren,
  activeCategoryId,
  onSelect,
}: HomeCategoryTilesProps) => {
  if (loading) {
    return (
      <div className="mb-3 animate-pulse rounded-card border border-gray-200 bg-white p-3 shadow-card sm:p-4 dark:border-gray-800 dark:bg-[#16171d]">
        <div className="mb-4 h-5 w-1/4 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 p-2">
              <div className="size-10 rounded-full bg-gray-200 sm:size-14 dark:bg-gray-800" />
              <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-800" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="mb-3 rounded-card border border-gray-200 bg-white p-3 shadow-card transition-colors sm:p-4 dark:border-gray-800 dark:bg-[#16171d]">
      <h2 className="mb-3 text-[13px] font-bold text-gray-800 sm:mb-4 sm:text-base dark:text-gray-100">{title}</h2>
      <ul className="grid grid-cols-3 gap-1 text-center sm:grid-cols-4 sm:gap-2 lg:grid-cols-6">
        {categories.map((cat) => {
          const child = hasChildren(cat.id);
          return (
            <li key={cat.id}>
              <button
                onClick={() => onSelect(cat, child)}
                className={`group block h-full w-full cursor-pointer rounded p-1.5 transition-all hover:bg-[#f8f9fa] active:opacity-50 sm:p-2.5 dark:hover:bg-[#1f2028] ${
                  activeCategoryId === cat.id ? 'bg-blue-50 ring-2 ring-blue-500 dark:bg-blue-900/10' : ''
                }`}
              >
                <div className="mx-auto flex size-10 items-center justify-center overflow-hidden rounded-full bg-[#e9ecef] transition-all group-hover:bg-[#dee2e6] sm:size-14 dark:bg-gray-700 dark:group-hover:bg-gray-600">
                  <CategoryIcon cat={cat} className="h-full w-full transition-transform duration-300 group-hover:scale-110" />
                </div>
                <p className="mt-1.5 overflow-hidden text-ellipsis text-[10px] font-bold leading-tight text-gray-700 group-hover:text-blue-600 sm:mt-2.5 sm:text-[13px] dark:text-gray-300">
                  {cat.name}
                </p>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
