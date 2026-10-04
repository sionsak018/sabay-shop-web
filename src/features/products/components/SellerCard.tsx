import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth/context/AuthContext';
import { useAlert } from '../../../context/AlertContext';
import { messageApi } from '../../messages/services/messageApi';
import SmartImage from '../../../components/common/SmartImage';
import { VerifiedBadge } from '../../../components/common/VerifiedBadge';
import { StarRating } from '../../../components/common/StarRating';

interface SellerInfo {
  id: number;
  name: string;
  avatar?: string;
  account_type?: 'private' | 'verified' | 'store';
  rating_avg?: number;
  rating_count?: number;
}

interface SellerCardProps {
  product: {
    id: number;
    title: string;
    poster_name?: string;
    company_name?: string;
    poster_phones?: string | string[] | null;
    seller?: SellerInfo | null;
  };
  isOwn?: boolean;
}

const getTelecomProvider = (phoneNumber: string) => {
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  const prefix = cleanPhone.startsWith('855') ? '0' + cleanPhone.substring(3, 5) : cleanPhone.substring(0, 3);

  const providers = [
    { name: 'Smart', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Smart_Axiata_logo.svg/100px-Smart_Axiata_logo.svg.png', color: '#1fb25a', textColor: 'white', prefixes: ['010', '015', '016', '069', '070', '081', '086', '087', '093', '096', '098'] },
    { name: 'Cellcard', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/0e/Cellcard_logo.png/100px-Cellcard_logo.png', color: '#f37021', textColor: 'white', prefixes: ['011', '012', '014', '017', '061', '076', '077', '078', '085', '089', '092', '095', '099'] },
    { name: 'Metfone', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Metfone_logo.png/100px-Metfone_logo.png', color: '#ed1c24', textColor: 'white', prefixes: ['031', '060', '066', '067', '068', '071', '088', '090', '097'] },
    { name: 'Yes', logo: 'https://yes.com.kh/wp-content/uploads/2020/03/yes-logo.png', color: '#fcee21', textColor: '#333333', prefixes: ['018'] },
  ];

  return providers.find((p) => p.prefixes.includes(prefix));
};

export const SellerCard = ({ product, isOwn = false }: SellerCardProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [showMessageBox, setShowMessageBox] = useState(false);
  const [sending, setSending] = useState(false);

  const seller = product.seller;

  let posterPhones: string[] = [];
  try {
    if (product.poster_phones) {
      posterPhones = typeof product.poster_phones === 'string' ? JSON.parse(product.poster_phones) : product.poster_phones;
    }
  } catch {
    posterPhones = [];
  }

  const handleSendMessage = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!message.trim()) return;
    const sellerId = seller?.id;
    if (!sellerId) {
      showAlert({ title: t('common.error'), message: t('product.seller_missing', { defaultValue: 'Seller information is missing' }), type: 'error' });
      return;
    }
    try {
      setSending(true);
      const formData = new FormData();
      formData.append('to_user_id', String(sellerId));
      formData.append('message', message);
      formData.append('product_id', String(product.id));
      formData.append('type', 'text');
      await messageApi.sendMessage(formData);
      showAlert({ title: t('common.success'), message: t('product.message_sent', { defaultValue: 'Message sent!' }), type: 'success' });
      setMessage('');
      setShowMessageBox(false);
    } catch {
      showAlert({ title: t('common.error'), message: t('product.message_failed', { defaultValue: 'Failed to send message' }), type: 'error' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-card border border-gray-200 bg-white shadow-card transition-colors lg:sticky lg:top-20 dark:border-gray-800 dark:bg-[#16171d]">
      <div className="border-b border-gray-100 bg-[#f8f9fa] px-4 py-2 transition-colors dark:border-gray-800 dark:bg-[#16171d]">
        <h2 className="text-[11px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-600">
          {t('product.seller_contact', { defaultValue: 'Seller Contact' })}
        </h2>
      </div>

      <div className="p-4 sm:p-6">
        <div className="mb-6 flex items-center gap-4">
          <Link
            to={`/u/${seller?.id}`}
            className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-[#f1f2f6] bg-blue-600 text-2xl font-black text-white shadow-inner transition-colors dark:border-[#08060d]"
          >
            {seller?.avatar ? (
              <SmartImage src={seller.avatar} alt={seller?.name ?? 'Seller'} width={160} height={160} widths={[80, 160, 320]} sizes="48px" className="h-full w-full object-cover" />
            ) : (
              (seller?.name || product.poster_name || '?').charAt(0).toUpperCase()
            )}
          </Link>
          <div className="min-w-0">
            <Link to={`/u/${seller?.id}`} className="mb-1 block truncate text-lg font-bold leading-tight text-gray-900 transition-colors hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400">
              {seller?.name || product.poster_name}
            </Link>
            {product.company_name && (
              <p className="truncate text-[11px] font-bold uppercase tracking-tight text-blue-600 dark:text-blue-400">{product.company_name}</p>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <VerifiedBadge accountType={seller?.account_type} />
              {typeof seller?.rating_count === 'number' && seller.rating_count > 0 && (
                <StarRating value={seller.rating_avg ?? 0} count={seller.rating_count} />
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {posterPhones.length > 0 ? posterPhones.map((phone, i) => {
            const provider = getTelecomProvider(phone);
            return (
              <a
                key={i}
                href={`tel:${phone.replace(/\s/g, '')}`}
                style={provider ? { backgroundColor: provider.color, color: provider.textColor } : {}}
                className={`group flex items-center justify-between rounded px-4 py-3 font-bold shadow-md transition-all hover:opacity-95 ${!provider ? 'bg-[#28a745] text-white' : ''}`}
              >
                <div className="flex items-center gap-3">
                  {provider ? (
                    <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-white p-0.5 shadow-sm">
                      <SmartImage src={provider.logo} className="h-full w-full object-contain" alt={provider.name} referrerPolicy="no-referrer" width={96} height={96} widths={[96, 192]} sizes="48px" />
                    </div>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                  )}
                  <span className="text-lg tracking-tight">{phone}</span>
                </div>
                {provider && <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{provider.name}</span>}
              </a>
            );
          }) : (
            <div className="rounded bg-gray-50 p-4 text-center text-xs font-bold uppercase text-gray-400 transition-colors dark:bg-[#16171d] dark:text-gray-600">
              {t('product.no_phone', { defaultValue: 'No phone provided' })}
            </div>
          )}

          {isOwn ? (
            <div className="rounded bg-blue-50 p-3 text-center text-xs font-bold text-blue-600 dark:bg-blue-900/10 dark:text-blue-400">
              {t('product.your_listing', { defaultValue: 'This is your listing' })}
            </div>
          ) : (
            <>
              <button
                onClick={() => setShowMessageBox(!showMessageBox)}
                className={`flex w-full items-center justify-center gap-2 rounded border px-4 py-3 font-bold transition-all active:scale-95 ${showMessageBox ? 'border-gray-300 bg-white text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400' : 'border-blue-600 bg-white text-blue-600 hover:bg-blue-50 dark:border-blue-500 dark:bg-[#1f2028] dark:text-blue-400 dark:hover:bg-blue-900/10'}`}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
                {showMessageBox ? t('common.cancel') : t('product.send_message', { defaultValue: 'Send Message' })}
              </button>

              {showMessageBox && (
                <div className="mt-4 animate-in fade-in slide-in-from-top-2 border-t border-gray-100 pt-4 duration-300 dark:border-gray-800">
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder={t('product.message_placeholder', { defaultValue: 'Type your message...' })}
                    className="min-h-[100px] w-full rounded border border-gray-200 bg-[#f8f9fa] p-3 text-sm text-gray-800 outline-none transition-all focus:border-blue-500 dark:border-gray-700 dark:bg-[#16171d] dark:text-gray-200 dark:focus:border-blue-400"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={sending}
                    className="mt-2 w-full rounded bg-blue-600 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-600"
                  >
                    {sending ? t('common.loading', { defaultValue: 'Loading...' }) : t('common.send', { defaultValue: 'SEND' })}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="border-t border-gray-100 bg-gray-50 p-4 text-[10px] font-medium leading-relaxed text-gray-500 transition-colors dark:border-gray-800 dark:bg-[#16171d] dark:text-gray-500">
        <p className="mb-2 flex items-center gap-2 font-bold text-gray-800 dark:text-gray-400">
          <svg className="h-4 w-4 text-orange-500 dark:text-orange-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/></svg>
          {t('product.safety_tips', { defaultValue: 'Safety Tips' })}
        </p>
        <ul className="ml-4 list-disc space-y-1">
          <li>{t('product.safety_1', { defaultValue: 'Meet seller at a public place' })}</li>
          <li>{t('product.safety_2', { defaultValue: 'Check the item before you buy' })}</li>
          <li>{t('product.safety_3', { defaultValue: 'Pay only after collecting the item' })}</li>
        </ul>
      </div>
    </div>
  );
};
