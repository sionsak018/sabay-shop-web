import { type Product } from '../types/product.types';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { profileApi } from '../../profile/services/profileApi';
import { useAuth } from '../../auth/hooks/useAuth';

import { getImageUrl } from '../../../utils/imageUrl';

interface ProductCardProps {
  product: Product;
  onToggleFavorite?: (id: number) => void;
  isFavorited?: boolean;
  showLocation?: boolean;
  variant?: 'grid' | 'list';
}

export const ProductCard = ({ product, onToggleFavorite, isFavorited: initialFavorited, showLocation = true, variant = 'grid' }: ProductCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(initialFavorited !== undefined ? initialFavorited : !!product.is_favorited);

  useEffect(() => {
    if (initialFavorited !== undefined) {
      setIsLiked(initialFavorited);
    } else {
      setIsLiked(!!product.is_favorited);
    }
  }, [product.is_favorited, initialFavorited]);

  const coverImage = getImageUrl(product.images?.[0]?.image_url);

  const price = typeof product.price === 'number' 
    ? product.price.toFixed(0)
    : Number(product.price)?.toFixed(0) || '0';

  const discountPrice = product.discount_price
    ? (typeof product.discount_price === 'number' ? product.discount_price.toFixed(0) : Number(product.discount_price).toFixed(0))
    : null;

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await profileApi.toggleFavorite(product.id);
      setIsLiked(!isLiked);
      if (onToggleFavorite) onToggleFavorite(product.id);
    } catch (error) {
      console.error('Failed to toggle favorite', error);
    }
  };

  const timeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diff = Math.abs(now.getTime() - then.getTime()) / 1000;

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return then.toLocaleDateString();
  };

  if (variant === 'list') {
    return (
      <div
        onClick={() => navigate(`/product/${product.id}`)}
        className="bg-white dark:bg-[#16171d] border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer flex gap-3 sm:gap-4 p-2 sm:p-3 group"
      >
        <div className="relative w-32 sm:w-48 aspect-[4/3] overflow-hidden rounded-md bg-[#f8f9fa] dark:bg-[#16171d] shrink-0">
          <img
            src={coverImage}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://placehold.co/400x300?text=Product+Image+Not+Found';
            }}
          />
          <div className="absolute top-1 left-1 flex flex-col gap-0.5">
            {product.discount_price && <span className="bg-red-500 text-white text-[7px] px-1 py-0.5 rounded font-black uppercase">SALE</span>}
            {product.condition && <span className="bg-black/40 backdrop-blur-sm text-white text-[7px] px-1 py-0.5 rounded font-bold uppercase">{product.condition}</span>}
          </div>
          <button
            onClick={handleLike}
            className={`absolute top-1 right-1 p-1.5 rounded-full backdrop-blur-sm transition-all z-10 ${isLiked ? 'bg-red-500 text-white shadow-lg' : 'bg-black/10 text-white hover:bg-white hover:text-red-500 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-red-500 dark:hover:text-white'}`}
          >
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.01 0 000 6.364L12 20.364l7.682-7.682a4.5 4.01 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.01 0 00-6.364 0z" /></svg>
          </button>
        </div>

        <div className="flex flex-col flex-grow min-w-0 py-1">
          <h3 className="text-sm sm:text-lg font-bold text-gray-800 dark:text-gray-100 line-clamp-2 leading-tight mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{product.title}</h3>

          <div className="flex items-baseline gap-2 mb-2">
            <p className="text-lg sm:text-2xl font-black text-blue-600 dark:text-blue-500">${discountPrice || price}</p>
            {discountPrice && <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-600 line-through font-bold">${price}</p>}
          </div>

          <div className="mt-auto pt-2 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between text-[10px] sm:text-xs text-gray-500 dark:text-gray-500">
            <div className="flex items-center gap-1 truncate max-w-[70%] hover:text-blue-600 dark:hover:text-blue-400 transition-colors" onClick={(e) => { e.stopPropagation(); navigate(`/u/${product.seller?.id}`); }}>
              {showLocation ? (
                <>
                  <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  <span className="truncate">{product.province?.name || product.location || 'Cambodia'}</span>
                </>
              ) : (
                <span className="font-bold text-gray-400 dark:text-gray-600">{product.seller?.name || 'Seller'}</span>
              )}
            </div>
            <span className="shrink-0">{timeAgo(product.created_at || new Date().toISOString())}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => navigate(`/product/${product.id}`)}
      className="bg-white dark:bg-[#16171d] border border-gray-200 dark:border-gray-800 rounded sm:rounded-md overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col h-full group"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#f8f9fa] dark:bg-[#16171d]">
        <img
          src={coverImage}
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://placehold.co/400x300?text=Product+Image+Not+Found';
          }}
        />

        <div className="absolute top-1 left-1 sm:top-1.5 sm:left-1.5 flex flex-col gap-0.5">
            {product.discount_price && (
                <span className="bg-red-500 text-white text-[7px] sm:text-[8px] px-1 py-0.5 rounded uppercase font-black tracking-tighter w-fit">
                    SALE
                </span>
            )}
            {product.condition && (
                <span className="bg-black/40 backdrop-blur-sm text-white text-[7px] sm:text-[8px] px-1 py-0.5 rounded uppercase font-bold tracking-tighter w-fit">
                    {product.condition}
                </span>
            )}
        </div>

        <button
          onClick={handleLike}
          className={`absolute top-1 right-1 sm:top-1.5 sm:right-1.5 p-1 rounded-full backdrop-blur-sm transition-all z-10 ${isLiked ? 'bg-red-500 text-white shadow-lg' : 'bg-black/20 text-white hover:bg-white hover:text-red-500 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-red-500 dark:hover:text-white'}`}
        >
          <svg className="w-3 sm:w-3.5 h-3 sm:h-3.5" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.01 0 000 6.364L12 20.364l7.682-7.682a4.5 4.01 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.01 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      <div className="p-1.5 sm:p-2.5 flex flex-col flex-grow">
        <h3 className="text-[11px] sm:text-[13px] font-bold text-gray-800 dark:text-gray-100 line-clamp-2 leading-tight mb-1 sm:mb-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {product.title}
        </h3>

        <div className="mt-auto">
          <div className="flex items-baseline gap-1 sm:gap-1.5 mb-1 sm:mb-1.5">
            <p className="text-[13px] sm:text-[16px] font-black text-blue-600 dark:text-blue-500 leading-none">
              ${discountPrice || price}
            </p>
            {discountPrice && (
              <p className="text-[9px] sm:text-[11px] text-gray-400 dark:text-gray-600 line-through font-bold">
                ${price}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between text-[8px] sm:text-[10px] text-gray-500 dark:text-gray-500 border-t border-gray-100 dark:border-gray-800 pt-1 sm:pt-1.5">
            <div className="flex items-center gap-0.5 sm:gap-1 max-w-[65%] hover:text-blue-600 dark:hover:text-blue-400 transition-colors" onClick={(e) => { e.stopPropagation(); navigate(`/u/${product.seller?.id}`); }}>
                {showLocation ? (
                  <>
                    <svg className="w-2 sm:w-2.5 h-2 sm:h-2.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    <span className="truncate">
                        {product.province?.name || product.location || 'Cambodia'}
                    </span>
                  </>
                ) : (
                  <span className="truncate font-bold text-gray-400 dark:text-gray-600">
                    {product.seller?.name || 'Seller'}
                  </span>
                )}
            </div>
            <span>{timeAgo(product.created_at || new Date().toISOString())}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
