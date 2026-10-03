import { useTranslation } from 'react-i18next';

interface StarRatingProps {
  value?: number;
  count?: number;
  size?: 'sm' | 'md';
  className?: string;
}

const SIZES = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
};

export const StarRating = ({ value = 0, count, size = 'sm', className = '' }: StarRatingProps) => {
  const { t } = useTranslation();
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className={`flex items-center gap-1 ${className}`} aria-label={t('common.rating_label', { defaultValue: 'Rating' })}>
      <div className="flex items-center gap-0.5">
        {stars.map((star) => {
          const fill = Math.max(0, Math.min(1, value - (star - 1)));
          return (
            <span key={star} className={`relative ${SIZES[size]}`}>
              <svg className={`${SIZES[size]} text-gray-300 dark:text-gray-600`} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.363 1.118l1.287 3.957c.3.922-.755 1.688-1.538 1.118l-3.367-2.446a1 1 0 00-1.175 0l-3.367 2.446c-.783.57-1.838-.196-1.538-1.118l1.287-3.957a1 1 0 00-.363-1.118L2.062 9.385c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.287-3.958z" />
              </svg>
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <svg className={`${SIZES[size]} text-amber-400`} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.363 1.118l1.287 3.957c.3.922-.755 1.688-1.538 1.118l-3.367-2.446a1 1 0 00-1.175 0l-3.367 2.446c-.783.57-1.838-.196-1.538-1.118l1.287-3.957a1 1 0 00-.363-1.118L2.062 9.385c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.287-3.958z" />
                </svg>
              </span>
            </span>
          );
        })}
      </div>
      {typeof count === 'number' && (
        <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">
          {value.toFixed(1)} ({count})
        </span>
      )}
    </div>
  );
};
