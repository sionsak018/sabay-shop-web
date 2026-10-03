import api from '../../../services/api';
import { type SellerReviewsResponse, type Review } from '../types/review.types';

export const reviewApi = {
  getSellerReviews: (userId: number, page = 1) =>
    api.get<SellerReviewsResponse>(`/reviews/seller/${userId}?page=${page}`),

  submit: (data: { seller_id: number; rating: number; comment?: string; product_id?: number }) =>
    api.post<{ message: string; review: Review; rating_avg: number; rating_count: number }>('/reviews', data),
};
