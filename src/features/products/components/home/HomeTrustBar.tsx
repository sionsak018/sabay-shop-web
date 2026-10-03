import { useTranslation } from 'react-i18next';

const ITEMS = [
  {
    key: 'verified',
    titleKey: 'home.trust_verified',
    titleDefault: 'Verified Sellers',
    descKey: 'home.trust_verified_desc',
    descDefault: 'Shop from trusted accounts',
    icon: (
      <path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
    ),
  },
  {
    key: 'chat',
    titleKey: 'home.trust_chat',
    titleDefault: 'Chat Directly',
    descKey: 'home.trust_chat_desc',
    descDefault: 'Message sellers in real time',
    icon: <path d="M18 10c0 3.866-3.582 7-8 7a8.8 8.8 0 01-2.42-.34L3 18l1.34-4.02A6.6 6.6 0 013 10c0-3.866 3.582-7 8-7s7 3.134 7 7z" />,
  },
  {
    key: 'free',
    titleKey: 'home.trust_free',
    titleDefault: 'Free Posting',
    descKey: 'home.trust_free_desc',
    descDefault: 'List your items at no cost',
    icon: <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zm14 5H2v7a2 2 0 002 2h12a2 2 0 002-2V9zM7 12a1 1 0 011-1h8a1 1 0 110 2H8a1 1 0 01-1-1z" />,
  },
  {
    key: 'nationwide',
    titleKey: 'home.trust_nationwide',
    titleDefault: 'Nationwide',
    descKey: 'home.trust_nationwide_desc',
    descDefault: 'Deals across all 25 provinces',
    icon: <path d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5A2.5 2.5 0 1112 6a2.5 2.5 0 010 5.5z" />,
  },
];

export const HomeTrustBar = () => {
  const { t } = useTranslation();

  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-3">
      {ITEMS.map((item) => (
        <div
          key={item.key}
          className="flex items-center gap-3 rounded-card border border-gray-200 bg-white p-3 shadow-card transition-colors dark:border-gray-800 dark:bg-[#16171d]"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              {item.icon}
            </svg>
          </span>
          <div className="min-w-0">
            <p className="truncate text-[12px] font-black text-gray-800 dark:text-gray-100">{t(item.titleKey, { defaultValue: item.titleDefault })}</p>
            <p className="truncate text-[10px] font-medium text-gray-500 dark:text-gray-400">{t(item.descKey, { defaultValue: item.descDefault })}</p>
          </div>
        </div>
      ))}
    </section>
  );
};
