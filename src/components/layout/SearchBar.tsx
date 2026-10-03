import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDebounce } from '../../hooks/useDebounce';

const RECENT_KEY = 'sabay_recent_searches';

const readRecent = (): string[] => {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
};

interface SearchBarProps {
  onNavigate?: () => void;
  autoFocus?: boolean;
}

export const SearchBar = ({ onNavigate, autoFocus = false }: SearchBarProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>(readRecent);
  const debounced = useDebounce(query, 200);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const categoryMatches = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    if (!q) return [];
    try {
      const raw = sessionStorage.getItem('cached_categories');
      const categories = raw ? (JSON.parse(raw) as { id: number; name: string }[]) : [];
      return categories.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 6);
    } catch {
      return [];
    }
  }, [debounced]);

  const saveRecent = (keyword: string) => {
    const next = [keyword, ...recent.filter((item) => item !== keyword)].slice(0, 5);
    setRecent(next);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      /* ignore quota errors */
    }
  };

  const removeRecent = (keyword: string) => {
    const next = recent.filter((item) => item !== keyword);
    setRecent(next);
    try {
      if (next.length > 0) {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } else {
        localStorage.removeItem(RECENT_KEY);
      }
    } catch {
      /* ignore storage errors */
    }
  };

  const clearRecent = () => {
    setRecent([]);
    try {
      localStorage.removeItem(RECENT_KEY);
    } catch {
      /* ignore storage errors */
    }
  };

  const go = (keyword: string) => {
    const q = keyword.trim();
    if (!q) return;
    saveRecent(q);
    setQuery(q);
    setOpen(false);
    onNavigate?.();
    navigate(`/products?keyword=${encodeURIComponent(q)}`);
  };

  const showRecent = debounced.trim() === '' && recent.length > 0;
  const dropdownOpen = open && (categoryMatches.length > 0 || showRecent);

  return (
    <div ref={boxRef} className="relative w-full">
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          go(query);
        }}
        className="flex items-center w-full bg-gray-100 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-control focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-colors"
      >
        <svg className="w-4 h-4 ml-3 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
        </svg>
        <input
          type="search"
          value={query}
          autoFocus={autoFocus}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={t('common.search_placeholder', { defaultValue: 'Search products, brands and more' })}
          aria-label={t('common.search', { defaultValue: 'Search' })}
          className="flex-1 min-w-0 bg-transparent px-3 py-2 text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setOpen(false);
            }}
            aria-label={t('common.clear', { defaultValue: 'Clear' })}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        <button
          type="submit"
          className="m-0.5 px-3 py-1.5 rounded-control bg-brand-600 hover:bg-brand-700 text-white text-xs font-black uppercase tracking-wider transition-colors"
        >
          {t('common.search', { defaultValue: 'Search' })}
        </button>
      </form>

      {dropdownOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 overflow-hidden bg-white dark:bg-[#1f2028] border border-gray-100 dark:border-gray-800 rounded-control shadow-card-hover">
          {showRecent ? (
            <div className="py-1">
              <div className="flex items-center justify-between px-4 pt-3 pb-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  {t('common.recent_searches', { defaultValue: 'Recent searches' })}
                </span>
                <button
                  type="button"
                  onClick={clearRecent}
                  className="text-[10px] font-black uppercase tracking-widest text-brand-600 dark:text-brand-400 hover:underline"
                >
                  {t('common.clear', { defaultValue: 'Clear' })}
                </button>
              </div>
              {recent.map((item) => (
                <div
                  key={item}
                  className="group flex items-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => go(item)}
                    className="flex flex-1 min-w-0 items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200"
                  >
                    <svg className="w-3.5 h-3.5 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="truncate">{item}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeRecent(item)}
                    aria-label={t('common.remove', { defaultValue: 'Remove' })}
                    title={t('common.remove', { defaultValue: 'Remove' })}
                    className="shrink-0 p-2 mr-1 rounded text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            categoryMatches.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => {
                  setOpen(false);
                  onNavigate?.();
                  navigate(`/products?category_id=${category.id}`);
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="w-3.5 h-3.5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5a2 2 0 011.414.586l7 7a2 2 0 010 2.828l-5 5a2 2 0 01-2.828 0l-7-7A2 2 0 013 10V5a2 2 0 012-2h2z" />
                </svg>
                {category.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
