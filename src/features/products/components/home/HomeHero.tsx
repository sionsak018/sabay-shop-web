import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../auth/context/AuthContext';
import { isConsoleUser } from '../../../auth/utils/roles';
import { type PublicStats } from '../../services/statsApi';
import { formatNumber } from '../../../../utils/format';

interface HomeHeroProps {
  stats?: PublicStats | null;
}

export const HomeHero = ({ stats }: HomeHeroProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const consoleUser = isConsoleUser(user);

  return (
    <section className="relative overflow-hidden rounded-card bg-gradient-to-br from-brand-600 via-brand-600 to-brand-800 text-white shadow-card mb-3">
      <div className="absolute -top-16 -right-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
      <div className="absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-brand-400/20 blur-3xl" aria-hidden="true" />

      <div className="relative z-10 px-5 py-8 sm:px-10 sm:py-12 max-w-2xl">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-widest mb-4">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.363 1.118l1.287 3.957c.3.922-.755 1.688-1.538 1.118l-3.367-2.446a1 1 0 00-1.175 0l-3.367 2.446c-.783.57-1.838-.196-1.538-1.118l1.287-3.957a1 1 0 00-.363-1.118L2.062 9.385c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.287-3.958z" />
          </svg>
          {t('home.hero_badge', { defaultValue: "Cambodia's #1 marketplace" })}
        </span>

        <h1 className="text-2xl sm:text-4xl font-black leading-tight tracking-tight mb-3">
          {t('home.hero_title', { defaultValue: 'Buy and sell, the simple way' })}
        </h1>
        <p className="text-sm sm:text-base text-white/80 mb-4 max-w-xl leading-relaxed">
          {t('home.hero_subtitle', { defaultValue: 'Post free ads, chat with sellers and find great deals near you.' })}
        </p>

        {stats && (
          <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] sm:text-xs font-bold text-white/90">
            <span>{t('home.stat_listings', { value: formatNumber(stats.total_products), defaultValue: '{{value}} active ads' })}</span>
            <span className="opacity-40" aria-hidden="true">•</span>
            <span>{t('home.stat_members', { value: formatNumber(stats.total_users), defaultValue: '{{value}} members' })}</span>
            <span className="opacity-40" aria-hidden="true">•</span>
            <span>{t('home.stat_categories', { value: formatNumber(stats.total_categories), defaultValue: '{{value}} categories' })}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 rounded-control bg-white px-5 py-2.5 text-sm font-black text-brand-700 shadow-sm hover:bg-blue-50 active:scale-95 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
            </svg>
            {t('home.hero_browse', { defaultValue: 'Browse Marketplace' })}
          </Link>
          {!consoleUser && (
            <Link
              to="/sell"
              className="inline-flex items-center gap-2 rounded-control border border-white/40 px-5 py-2.5 text-sm font-black text-white hover:bg-white/10 active:scale-95 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              {t('common.post_ad')}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
};
