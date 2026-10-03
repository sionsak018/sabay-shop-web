import { useState } from 'react';

interface RatingInputProps {
  value: number;
  onChange: (value: number) => void;
  size?: 'sm' | 'md';
}

const STAR_PATH =
  'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.363 1.118l1.287 3.957c.3.922-.755 1.688-1.538 1.118l-3.367-2.446a1 1 0 00-1.175 0l-3.367 2.446c-.783.57-1.838-.196-1.538-1.118l1.287-3.957a1 1 0 00-.363-1.118L2.062 9.385c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.287-3.958z';

export const RatingInput = ({ value, onChange, size = 'md' }: RatingInputProps) => {
  const [hover, setHover] = useState(0);
  const active = hover || value;
  const dimension = size === 'sm' ? 'h-5 w-5' : 'h-7 w-7';

  return (
    <div className="flex items-center gap-1" role="radiogroup">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          aria-label={`${star}`}
          aria-checked={value === star}
          role="radio"
          className="transition-transform hover:scale-110 focus:outline-none"
        >
          <svg
            className={`${dimension} ${star <= active ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path d={STAR_PATH} />
          </svg>
        </button>
      ))}
    </div>
  );
};
