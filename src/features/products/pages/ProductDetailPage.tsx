import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productApi } from '../services/productApi';
import { profileApi } from '../../profile/services/profileApi';
import { useAuth } from '../../auth/context/AuthContext';
import { useAlert } from '../../../context/AlertContext';
import { useTranslation } from 'react-i18next';
import { formatMoney, formatDate } from '../../../utils/format';
import { addRecentlyViewed } from '../../../utils/recentlyViewed';
import { useSeo } from '../../../utils/seo';
import { LazyMapView } from '../../../components/common/LazyMapView';
import { SellerCard } from '../components/SellerCard';
import { RelatedProducts } from '../components/RelatedProducts';
import { RecentlyViewedRail } from '../components/RecentlyViewedRail';
import { SellerReviews } from '../../reviews/components/SellerReviews';

import { getImageUrl } from '../../../utils/imageUrl';
import SmartImage from '../../../components/common/SmartImage';

// Product descriptions are stored as Markdown. Render them with a tiny
// renderer + sanitizer instead of pulling the ~900 KB Toast UI viewer chunk
// into this public page.
import { marked } from 'marked';
import DOMPurify from 'dompurify';

marked.setOptions({ gfm: true, breaks: true });

export const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  const descriptionHtml = useMemo(() => {
    const raw = product?.description;
    if (!raw) return '';
    return DOMPurify.sanitize(marked.parse(raw) as string);
  }, [product?.description]);

  const plainDescription = useMemo(() => {
    const raw = product?.description;
    if (!raw) return undefined;
    return raw
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/[#*_>`~]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 160);
  }, [product?.description]);

  const seoImage = product?.images?.[0]?.image_url
    ? getImageUrl(product.images[0].image_url)
    : null;

  const seoJsonLd = product
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.title,
        description: plainDescription || undefined,
        sku: `SS-${product.id}`,
        image: seoImage ? [seoImage] : undefined,
        offers: {
          '@type': 'Offer',
          price: product.price,
          priceCurrency: 'USD',
          availability:
            product.status === 'active'
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
          url: typeof window !== 'undefined' ? `${window.location.origin}/products/${product.id}` : undefined,
        },
      }
    : null;

  useSeo({
    title: product?.title,
    description: plainDescription,
    canonical: id ? `/products/${id}` : undefined,
    image: seoImage,
    type: 'product',
    jsonLd: seoJsonLd,
  });

  useEffect(() => {
    if (id) {
      productApi.getOne(parseInt(id))
        .then(res => {
          setProduct(res.data);
          setIsLiked(!!res.data.is_favorited);
          addRecentlyViewed(res.data);
        })
        .catch(err => {
          console.error('Failed to load product', err);
          setError(err.response?.data?.message || 'Product not found');
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleToggleLike = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!product) return;
    try {
      await profileApi.toggleFavorite(product.id);
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Failed to toggle favorite', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="animate-pulse flex flex-col lg:flex-row gap-8 text-left">
          <div className="lg:w-2/3 space-y-4">
            <div className="bg-gray-200 aspect-video rounded-md"></div>
            <div className="h-8 bg-gray-200 w-3/4 rounded"></div>
            <div className="h-4 bg-gray-200 w-full rounded"></div>
          </div>
          <div className="lg:w-1/3 space-y-4">
            <div className="bg-gray-200 h-64 rounded-md"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">{error || 'Product not found'}</h2>
        <Link to="/" className="text-blue-600 hover:underline font-bold uppercase tracking-widest text-xs">Back to Homepage</Link>
      </div>
    );
  }

  const images = product.images?.length > 0
    ? product.images.map((img: any) => getImageUrl(img.image_url))
    : ['https://placehold.co/800x600?text=No+Image'];

  const mainCategory = product.category?.parent || product.category;
  const subCategory = product.category?.parent ? product.category : null;

  const isOwnListing = !!user && (product.seller_id === user.id || product.seller?.id === user.id);

  const firstPhone = (() => {
    try {
      const raw = product.poster_phones;
      if (!raw) return '';
      const phones = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return Array.isArray(phones) && phones.length > 0 ? String(phones[0]) : '';
    } catch {
      return '';
    }
  })();

  const handleShare = async () => {
    const shareData = { title: product.title, url: window.location.href };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard.writeText(window.location.href);
      showAlert({ title: t('common.success'), message: t('product.link_copied', { defaultValue: 'Link copied to clipboard' }), type: 'success' });
    } catch {
      /* user cancelled share */
    }
  };

  const scrollToSeller = () => {
    document.getElementById('seller-contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="bg-[#f1f2f6] dark:bg-[#08060d] min-h-screen antialiased text-left pb-32 md:pb-20 font-sans transition-colors duration-300">

      {/* Khmer24 Style Breadcrumbs */}
      <div className="bg-white dark:bg-[#16171d] border-b border-gray-200 dark:border-gray-800 py-3 shadow-sm transition-colors">
        <div className="container mx-auto px-4 max-w-7xl">
          <nav className="flex text-xs font-bold text-gray-400 dark:text-gray-500 gap-2 items-center uppercase tracking-tight">
            <Link to="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Home</Link>
            <svg className="w-3 h-3 text-gray-300 dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
            <Link to={`/products?category_id=${mainCategory.id}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{mainCategory.name}</Link>
            {subCategory && (
              <>
                <svg className="w-3 h-3 text-gray-300 dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
                <Link to={`/products?category_id=${subCategory.id}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{subCategory.name}</Link>
              </>
            )}
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Left Column: Media & Details */}
          <div className="lg:w-2/3 space-y-6">

            <div className="bg-white dark:bg-[#16171d] border border-gray-200 dark:border-gray-800 rounded-md overflow-hidden shadow-sm transition-colors">
              {/* Image Gallery - Exact ratio */}
              <div className="relative bg-black aspect-video flex items-center justify-center group">
                <SmartImage
                  src={images[activeImageIndex]}
                  alt={product.title}
                  priority
                  widths={[640, 960, 1280]}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  width={960}
                  height={960}
                  className="max-h-full max-w-full object-contain"
                />

                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveImageIndex(prev => (prev === 0 ? images.length - 1 : prev - 1))}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white p-3 rounded-full transition opacity-0 group-hover:opacity-100"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"/></svg>
                    </button>
                    <button
                      onClick={() => setActiveImageIndex(prev => (prev === images.length - 1 ? 0 : prev + 1))}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white p-3 rounded-full transition opacity-0 group-hover:opacity-100"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
                    </button>
                  </>
                )}

                {!isOwnListing && (
                  <button
                    onClick={handleToggleLike}
                    className={`absolute top-4 right-4 p-2 rounded-full backdrop-blur-md transition-all ${isLiked ? 'bg-red-500 text-white shadow-xl' : 'bg-black/20 text-white hover:bg-white hover:text-red-500'}`}
                  >
                    <svg className="w-6 h-6" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.01 0 000 6.364L12 20.364l7.682-7.682a4.5 4.01 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.01 0 00-6.364 0z" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto bg-[#f8f9fa] dark:bg-[#16171d] border-b border-gray-200 dark:border-gray-800 transition-colors">
                  {images.map((img: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`flex-shrink-0 w-16 h-12 rounded border-2 transition-all ${activeImageIndex === idx ? 'border-blue-600' : 'border-white dark:border-gray-700'}`}
                    >
                      <SmartImage src={img} alt="" widths={[160, 320]} sizes="72px" width={160} height={160} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Product Header */}
              <div className="p-4 sm:p-6">
                <div className="mb-6 sm:mb-8 border-b border-gray-100 dark:border-gray-800 pb-6">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight mb-4">{product.title}</h1>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-baseline gap-4">
                            <p className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-500 tabular-nums">{formatMoney(product.discount_price ?? product.price ?? 0)}</p>
                            {product.discount_price && (
                                <p className="text-lg sm:text-xl font-bold text-gray-400 dark:text-gray-600 line-through tabular-nums">{formatMoney(product.price || 0)}</p>
                            )}
                        </div>
                        <div className="text-[10px] sm:text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tighter space-y-0.5 sm:text-right">
                           <p className="flex items-center justify-end gap-1.5">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                {t('product.posted_on', { defaultValue: 'Posted on' })} {formatDate(product.created_at)}
                           </p>
                           <p className="flex items-center justify-end gap-1.5">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg>
                                {product.village?.name ? `${product.village.name}, ` : ''}
                                {product.commune?.name ? `${product.commune.name}, ` : ''}
                                {product.district?.name ? `${product.district.name}, ` : ''}
                                {product.province?.name || product.location}
                           </p>
                        </div>
                    </div>
                </div>

                {/* Specifications Grid - THE KEY REQUESTED PART */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-2 sm:gap-x-4 mb-10">
                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-400 dark:text-gray-600 uppercase font-black tracking-tight">Category</p>
                    <p className="text-sm font-bold text-blue-600 dark:text-blue-500 hover:underline"><Link to={`/products?category_id=${product.category?.id}`}>{product.category?.name}</Link></p>
                  </div>

                  {/* Dynamic Attributes based on Category */}
                  {product.attribute_values?.map((av: any) => (
                    <div key={av.id} className="space-y-1">
                      <p className="text-[10px] text-gray-400 dark:text-gray-600 uppercase font-black tracking-tight">{av.attribute?.name}</p>
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{av.value}</p>
                    </div>
                  ))}

                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-400 dark:text-gray-600 uppercase font-black tracking-tight">Condition</p>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200 capitalize">{product.condition}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-400 dark:text-gray-600 uppercase font-black tracking-tight">{t('product.ad_id', { defaultValue: 'Ad ID' })}</p>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">#SS-{product.id}</p>
                  </div>
                </div>

                {/* Description */}
                <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800">
                  <h3 className="text-sm font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest mb-6">Description</h3>
                  <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed max-w-none">
                    {product.description ? (
                      <div className="product-description" dangerouslySetInnerHTML={{ __html: descriptionHtml }} />
                    ) : (
                      t('product.no_description', { defaultValue: 'No description provided.' })
                    )}
                  </div>
                </div>

                {/* Map Integration */}
                {product.lat && product.lng && (
                    <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800">
                        <h3 className="text-sm font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest mb-6">Location Map</h3>
                        <div className="h-80 w-full rounded-md border border-gray-200 dark:border-gray-800 overflow-hidden relative shadow-inner group transition-colors">
                            <LazyMapView lat={String(product.lat)} lng={String(product.lng)} />
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${product.lat},${product.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute inset-0 z-20 hover:bg-black/5 dark:hover:bg-white/5 transition-all flex items-center justify-center group"
                            >
                                <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md px-6 py-2.5 rounded-full shadow-2xl border border-gray-100 dark:border-gray-800 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all font-black text-[11px] uppercase tracking-widest text-blue-600 dark:text-blue-400">
                                    Open in Google Maps
                                </div>
                            </a>
                        </div>
                    </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Seller Info */}
          <div className="lg:w-1/3">
            <SellerCard product={product} isOwn={isOwnListing} />
          </div>
        </div>

        {product.category?.id && (
          <RelatedProducts categoryId={product.category.id} excludeId={product.id} />
        )}

        {product.seller?.id && (
          <div className="mt-10">
            <SellerReviews
              sellerId={product.seller.id}
              initialRatingAvg={product.seller.rating_avg ?? 0}
              initialRatingCount={product.seller.rating_count ?? 0}
              compact
            />
          </div>
        )}

        <RecentlyViewedRail currentId={product.id} />
      </div>

      {/* Mobile sticky action bar */}
      <div className="fixed bottom-16 left-0 right-0 z-40 md:hidden bg-white dark:bg-[#16171d] border-t border-gray-200 dark:border-gray-800 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
        <div className={`grid ${isOwnListing ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {!isOwnListing && (
            <button
              onClick={scrollToSeller}
              className="flex flex-col items-center justify-center gap-1 py-2.5 text-blue-600 dark:text-blue-400 font-bold text-[11px] active:bg-gray-50 dark:active:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
              {t('product.send_message', { defaultValue: 'Message' })}
            </button>
          )}
          <a
            href={firstPhone ? `tel:${firstPhone}` : undefined}
            onClick={(e) => { if (!firstPhone) { e.preventDefault(); scrollToSeller(); } }}
            className="flex flex-col items-center justify-center gap-1 py-2.5 border-x border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 font-bold text-[11px] active:bg-gray-50 dark:active:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
            {t('product.call', { defaultValue: 'Call' })}
          </a>
          <button
            onClick={handleShare}
            className="flex flex-col items-center justify-center gap-1 py-2.5 text-gray-700 dark:text-gray-300 font-bold text-[11px] active:bg-gray-50 dark:active:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342a3 3 0 100-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
            {t('common.share', { defaultValue: 'Share' })}
          </button>
        </div>
      </div>
    </div>
  );
};
