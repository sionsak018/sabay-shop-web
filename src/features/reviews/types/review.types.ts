export interface ReviewReviewer {
  id: number;
  name: string;
  avatar?: string;
  account_type?: 'private' | 'verified' | 'store';
}

export interface Review {
  id: number;
  reviewer_id: number;
  seller_id: number;
  product_id?: number | null;
  rating: number;
  comment?: string | null;
  created_at: string;
  reviewer?: ReviewReviewer;
}

export interface PaginatedReviews {
  current_page: number;
  data: Review[];
  last_page: number;
  total: number;
  per_page: number;
}

export interface SellerReviewsResponse {
  rating_avg: number;
  rating_count: number;
  reviews: PaginatedReviews;
}
