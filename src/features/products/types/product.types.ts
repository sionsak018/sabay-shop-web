export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: 'user' | 'admin';
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface ProductImage {
  id: number;
  image_url: string;
  sort_order: number;
}

export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  discount_price?: number;
  condition: 'new' | 'used';
  location: string;
  status: 'active' | 'inactive' | 'sold';
  seller: User;
  category: Category;
  images: ProductImage[];
  province?: { id: number; name: string };
  commune?: { id: number; name: string };
  created_at: string;
  is_favorited?: boolean;
}
export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: Array<{ url: string | null; label: string; active: boolean }>;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}