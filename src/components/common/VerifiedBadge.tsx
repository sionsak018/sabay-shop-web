import { useTranslation } from 'react-i18next';

type AccountType = 'private' | 'verified' | 'store';

interface VerifiedBadgeProps {
  accountType?: AccountType | null;
  className?: string;
}

export const VerifiedBadge = ({ accountType, className = '' }: VerifiedBadgeProps) => {
  const { t } = useTranslation();

  if (!accountType || accountType === 'private') return null;

  const isStore = accountType === 'store';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[9px] font-black uppercase transition-colors ${
        isStore
          ? 'border-indigo-100 bg-indigo-50 text-indigo-600 dark:border-indigo-900/30 dark:bg-indigo-900/20 dark:text-indigo-400'
          : 'border-green-100 bg-green-50 text-green-600 dark:border-green-900/30 dark:bg-green-900/20 dark:text-green-400'
      } ${className}`}
    >
      {isStore ? (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM2 9v7a2 2 0 002 2h12a2 2 0 002-2V9H2zm4 3a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1z" />
        </svg>
      ) : (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
        </svg>
      )}
      {isStore ? t('common.store_badge', { defaultValue: 'Store' }) : t('common.verified', { defaultValue: 'Verified' })}
    </span>
  );
};
