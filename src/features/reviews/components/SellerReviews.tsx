import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth/context/AuthContext';
import { useAlert } from '../../../context/AlertContext';
import { reviewApi } from '../services/reviewApi';
import { type Review } from '../types/review.types';
import { StarRating } from '../../../components/common/StarRating';
import { RatingInput } from './RatingInput';
import SmartImage from '../../../components/common/SmartImage';
import { formatDate } from '../../../utils/format';

interface SellerReviewsProps {
  sellerId: number;
  productId?: number;
  canReview?: boolean;
  initialReviews?: Review[];
  initialRatingAvg?: number;
  initialRatingCount?: number;
  compact?: boolean;
}

export const SellerReviews = ({
  sellerId,
  productId,
  canReview,
  initialReviews,
  initialRatingAvg = 0,
  initialRatingCount = 0,
  compact = false,
}: SellerReviewsProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const navigate = useNavigate();

  const [reviews, setReviews] = useState<Review[]>(initialReviews ?? []);
  const [ratingAvg, setRatingAvg] = useState(initialRatingAvg);
  const [ratingCount, setRatingCount] = useState(initialRatingCount);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(!initialReviews);
  const [loadingMore, setLoadingMore] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  useEffect(() => {
    if (initialReviews) return;
    let active = true;
    reviewApi
      .getSellerReviews(sellerId, 1)
      .then((res) => {
        if (!active) return;
        setReviews(res.data.reviews.data);
        setLastPage(res.data.reviews.last_page);
        setRatingAvg(res.data.rating_avg);
        setRatingCount(res.data.rating_count);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [sellerId, initialReviews]);

  const refreshFirstPage = async () => {
    const res = await reviewApi.getSellerReviews(sellerId, 1);
    setReviews(res.data.reviews.data);
    setLastPage(res.data.reviews.last_page);
    setPage(1);
  };

  const loadMore = async () => {
    const next = page + 1;
    setLoadingMore(true);
    try {
      const res = await reviewApi.getSellerReviews(sellerId, next);
      setReviews((prev) => [...prev, ...res.data.reviews.data]);
      setPage(next);
      setLastPage(res.data.reviews.last_page);
    } catch {
      /* ignore */
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!productId) return;
    if (rating < 1) {
      showAlert({
        title: t('common.error'),
        message: t('review.select_rating', { defaultValue: 'Please choose a rating' }),
        type: 'error',
      });
      return;
    }
    const trimmedComment = comment.trim();
    if (trimmedComment.length < 10) {
      showAlert({
        title: t('common.error'),
        message: t('review.comment_required', {
          defaultValue: 'Please write at least 10 characters describing your experience.',
        }),
        type: 'error',
      });
      return;
    }
    setSubmitting(true);
    try {
      const res = await reviewApi.submit({
        seller_id: sellerId,
        product_id: productId,
        rating,
        comment: trimmedComment,
      });
      setRatingAvg(res.data.rating_avg);
      setRatingCount(res.data.rating_count);
      await refreshFirstPage();
      setRating(0);
      setComment('');
      setHasReviewed(true);
      showAlert({
        title: t('common.success'),
        message: t('review.submitted', { defaultValue: 'Thanks for your review!' }),
        type: 'success',
      });
    } catch (err) {
      const apiMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showAlert({
        title: t('common.error'),
        message: apiMessage || t('review.failed', { defaultValue: 'Failed to submit review' }),
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isOwnProfile = user?.id === sellerId;
  const showReviewForm = !isOwnProfile && !!productId && canReview !== false && !hasReviewed;
  const visibleReviews = compact ? reviews.slice(0, 3) : reviews;

  return (
    <section className="rounded-card border border-gray-200 bg-white p-4 shadow-card transition-colors sm:p-6 dark:border-gray-800 dark:bg-[#16171d]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4 dark:border-gray-800">
        <h2 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-gray-100">
          {t('review.title', { defaultValue: 'Reviews' })}
        </h2>
        <div className="flex items-center gap-2">
          <StarRating value={ratingAvg} size="md" />
          <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
            {ratingAvg.toFixed(1)} ({ratingCount})
          </span>
        </div>
      </div>

      {showReviewForm && (
        <div className="mb-5 rounded-control bg-[#f8f9fa] p-3 transition-colors sm:p-4 dark:bg-[#1f2028]">
          <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
            {t('review.write', { defaultValue: 'Write a review' })}
          </p>
          <RatingInput value={rating} onChange={setRating} />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('review.placeholder', { defaultValue: 'Share your experience with this seller...' })}
            className="mt-3 min-h-[80px] w-full rounded border border-gray-200 bg-white p-3 text-sm text-gray-800 outline-none transition-all focus:border-blue-500 dark:border-gray-700 dark:bg-[#16171d] dark:text-gray-200 dark:focus:border-blue-400"
          />
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="mt-2 rounded bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            {submitting
              ? t('common.loading', { defaultValue: 'Loading...' })
              : t('review.submit', { defaultValue: 'Submit Review' })}
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/3 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                <div className="h-3 w-full animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
              </div>
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <p className="py-6 text-center text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
          {t('review.none', { defaultValue: 'No reviews yet. Be the first to review this seller.' })}
        </p>
      ) : (
        <ul className="space-y-4">
          {visibleReviews.map((review) => (
            <li key={review.id} className="flex gap-3">
              <Link
                to={review.reviewer?.id ? `/u/${review.reviewer.id}` : '#'}
                className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-blue-600 text-center text-sm font-black leading-10 text-white"
              >
                {review.reviewer?.avatar ? (
                  <SmartImage
                    src={review.reviewer.avatar}
                    alt={review.reviewer.name}
                    width={80}
                    height={80}
                    widths={[40, 80]}
                    sizes="40px"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  (review.reviewer?.name || '?').charAt(0).toUpperCase()
                )}
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-100">
                    {review.reviewer?.name || t('review.anonymous', { defaultValue: 'User' })}
                  </span>
                  <StarRating value={review.rating} />
                  <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">
                    {formatDate(review.created_at)}
                  </span>
                </div>
                {review.comment && (
                  <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{review.comment}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {!compact && page < lastPage && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="rounded-control border border-gray-300 bg-white px-5 py-2 text-[11px] font-black uppercase tracking-widest text-gray-700 transition hover:border-brand-500 hover:text-brand-600 disabled:opacity-60 dark:border-gray-700 dark:bg-[#16171d] dark:text-gray-200 dark:hover:text-brand-400"
          >
            {loadingMore
              ? t('common.loading', { defaultValue: 'Loading...' })
              : t('review.load_more', { defaultValue: 'Load more reviews' })}
          </button>
        </div>
      )}
    </section>
  );
};
