// src/features/products/hooks/useProducts.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { productApi } from '../services/productApi';
import {type Product } from '../types/product.types';

export interface ProductFilters {
  keyword?: string;
  category_id?: string;
  min_price?: string;
  max_price?: string;
  location?: string;
  province_id?: string;
  district_id?: string;
  sort?: string;
  page?: number;
}

export const useProducts = (filters: ProductFilters = {}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 20,
  });

  // Create a stable, serializable key from filters to detect actual changes
  // This ensures that when any filter property changes, the fetch is triggered.
  const filtersKey = useMemo(() => {
    const { page, ...rest } = filters;
    return JSON.stringify(rest);
  }, [filters]);
  // Dependency on 'filters' object is safe because ProductListPage
  // creates a new object on every render based on searchParams.

  // Separate page from the rest – changing page should also trigger fetch
  const page = filters.page || 1;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.keyword) params.append('keyword', filters.keyword);
      if (filters.category_id) params.append('category_id', filters.category_id);
      if (filters.min_price) params.append('min_price', filters.min_price);
      if (filters.max_price) params.append('max_price', filters.max_price);
      if (filters.location) params.append('location', filters.location);
      if (filters.province_id) params.append('province_id', filters.province_id);
      if (filters.district_id) params.append('district_id', filters.district_id);
      if (filters.sort) params.append('sort', filters.sort);
      if (page) params.append('page', String(page));

      const response = await productApi.getFiltered(params.toString());
      setProducts(response.data.data);
      setPagination({
        currentPage: response.data.current_page,
        lastPage: response.data.last_page,
        total: response.data.total,
        perPage: response.data.per_page,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [filtersKey, page]); // only re-run when filter criteria OR page changes

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const goToPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.lastPage) {
      // Returning a new object with the same filters + new page triggers re‑fetch
      // But this is handled by the parent component (HomePage) via state
    }
  };

  return { products, loading, error, pagination, goToPage, refetch: fetchProducts };
};